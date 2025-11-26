import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

// IMPORTANTE: Importamos nossas funções REST aqui
import { apiGet, apiPost, apiPut } from '../../services/api';

// =================================================================
// 1. TIPOS E MOCK DE DADOS
// =================================================================

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
}

interface CartItem extends Product {
  quantity: number;
}

type Screen = 'PRODUCTS' | 'CART';

// Mock de produtos (Idealmente você buscaria isso com apiGet('Product') futuramente)
const PRODUCTS_MOCK: Product[] = [
  { id: 'p1', name: 'Notebook Ultrafast X', price: 5899.99, description: 'Laptop de alta performance para jogos e trabalho.' },
  { id: 'p2', name: 'Mouse Gamer Chroma', price: 199.50, description: 'Mouse ergonômico com 10 botões programáveis.' },
  { id: 'p3', name: 'Teclado Mecânico Pro', price: 450.00, description: 'Switch brown, layout ABNT2, RGB.' },
  { id: 'p4', name: 'Monitor 4K OLED', price: 3200.00, description: '27 polegadas, 144Hz, cores vibrantes.' },
];

// =================================================================
// 2. COMPONENTES AUXILIARES
// =================================================================

const ProductCard: React.FC<{ product: Product, onAddToCart: (product: Product) => void }> = React.memo(({ product, onAddToCart }) => (
  <View style={styles.productCard}>
    <Text style={styles.productName}>{product.name}</Text>
    <Text style={styles.productPrice}>R$ {product.price.toFixed(2).replace('.', ',')}</Text>
    <Text style={styles.productDescription}>{product.description}</Text>
    <TouchableOpacity style={styles.addButton} onPress={() => onAddToCart(product)}>
      <Text style={styles.addButtonText}>Adicionar ao Carrinho</Text>
    </TouchableOpacity>
  </View>
));

const CartItemCard: React.FC<{
  item: CartItem;
  onUpdateQuantity: (id: string, type: 'increase' | 'decrease') => void;
  onRemove: (id: string) => void;
}> = React.memo(({ item, onUpdateQuantity, onRemove }) => (
  <View style={styles.cartItem}>
    <View style={styles.cartItemDetails}>
      <Text style={styles.cartItemName}>{item.name}</Text>
      <Text style={styles.cartItemPrice}>
        Total: R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
      </Text>
      <Text style={styles.cartItemPriceSmall}>
        (R$ {item.price.toFixed(2).replace('.', ',')} / un)
      </Text>
    </View>

    <View style={styles.quantityControl}>
      <TouchableOpacity style={styles.quantityButton} onPress={() => onUpdateQuantity(item.id, 'decrease')}>
        <Text style={styles.quantityButtonText}>-</Text>
      </TouchableOpacity>
      <Text style={styles.quantityText}>{item.quantity}</Text>
      <TouchableOpacity style={styles.quantityButton} onPress={() => onUpdateQuantity(item.id, 'increase')}>
        <Text style={styles.quantityButtonText}>+</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.removeButton} onPress={() => onRemove(item.id)}>
        <Feather name="trash-2" size={20} color="#EF4444" />
      </TouchableOpacity>
    </View>
  </View>
));

// =================================================================
// 3. COMPONENTE PRINCIPAL
// =================================================================

export default function Carrinho() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentScreen, setCurrentScreen] = useState<Screen>('PRODUCTS');
  const [loading, setLoading] = useState(true);
  
  // Estado para controlar a sessão e o ID do objeto no Back4App
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [cartObjectId, setCartObjectId] = useState<string | null>(null);

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cart]);

  // --- Função REST para Salvar Carrinho ---
  const saveCartToAPI = useCallback(async (currentCart: CartItem[], currentSessionId: string, objectId: string | null) => {
    try {
      // Preparamos os dados. Convertemos o array para string JSON pois o Back4App armazena arrays complexos melhor assim ou via Relations
      const payload = {
        sessionId: currentSessionId,
        items: JSON.stringify(currentCart) 
      };

      if (objectId) {
        // Se já temos um ID, ATUALIZAMOS (PUT)
        await apiPut('CartSession', objectId, payload);
        console.log('Carrinho ATUALIZADO via REST.');
      } else {
        // Se não temos ID, CRIAMOS (POST) e salvamos o novo ID
        const response = await apiPost('CartSession', payload);
        if (response.objectId) {
          setCartObjectId(response.objectId);
          console.log('Carrinho CRIADO via REST. ID:', response.objectId);
        }
      }
    } catch (error) {
      console.error('Erro ao salvar carrinho via REST:', error);
    }
  }, []);

  // --- Inicialização ---
  useEffect(() => {
    const initializeSession = async () => {
      let localSessionId = await AsyncStorage.getItem('userSessionId');

      if (!localSessionId) {
        localSessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2)}`;
        await AsyncStorage.setItem('userSessionId', localSessionId);
      }
      setSessionId(localSessionId);

      try {
        // Busca carrinho existente no Back4App usando REST
        // Query param: ?where={"sessionId":"valor"}
        const whereQuery = JSON.stringify({ sessionId: localSessionId });
        // Codificamos a URL para evitar erros com caracteres especiais
        const result = await apiGet(`CartSession?where=${encodeURIComponent(whereQuery)}`);

        if (result.results && result.results.length > 0) {
          const serverCart = result.results[0];
          setCartObjectId(serverCart.objectId); // Salvamos o ID para updates futuros
          
          if (serverCart.items) {
            setCart(JSON.parse(serverCart.items) as CartItem[]);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar carrinho inicial:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeSession();
  }, []);

  // --- Auto-Save ---
  useEffect(() => {
    // Debounce simples: só salva se não estiver carregando e se tiver sessão
    if (sessionId && !loading) {
      const timer = setTimeout(() => {
        saveCartToAPI(cart, sessionId, cartObjectId);
      }, 1000); // Espera 1 segundo após a última mudança para salvar (evita muitas requisições)

      return () => clearTimeout(timer);
    }
  }, [cart, sessionId, cartObjectId, loading, saveCartToAPI]);


  // --- Manipulação do Carrinho ---

  const addItemToCart = useCallback((product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
    Alert.alert("Sucesso", "Produto adicionado ao carrinho!");
  }, []);

  const removeItemFromCart = useCallback((id: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  }, []);

  const updateItemQuantity = useCallback((id: string, type: 'increase' | 'decrease') => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.id === id) {
          const newQuantity = type === 'increase' ? item.quantity + 1 : item.quantity - 1;
          return newQuantity < 1 ? null : { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  }, []);

  // --- Renderização ---

  const renderProductList = () => (
    <FlatList
      data={PRODUCTS_MOCK}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ProductCard product={item} onAddToCart={addItemToCart} />
      )}
      contentContainerStyle={styles.listContainer}
    />
  );

  const renderCart = () => (
    <View style={styles.cartContainer}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {cart.length === 0 ? (
          <Text style={styles.emptyCartText}>Seu carrinho está vazio.</Text>
        ) : (
          cart.map(item => (
            <CartItemCard
              key={item.id}
              item={item}
              onUpdateQuantity={updateItemQuantity}
              onRemove={removeItemFromCart}
            />
          ))
        )}
        
        {cart.length > 0 && (
          <View style={styles.summaryBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>R$ {cartTotal.toFixed(2).replace('.', ',')}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Frete:</Text>
              <Text style={styles.totalValue}>R$ 20,00</Text>
            </View>
            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Total Final:</Text>
              <Text style={styles.grandTotalValue}>R$ {(cartTotal + 20).toFixed(2).replace('.', ',')}</Text>
            </View>
            <TouchableOpacity 
              style={styles.checkoutButton}
              onPress={() => Alert.alert("Sucesso", "Pedido finalizado! (Integração REST pronta)")}
            >
              <Text style={styles.checkoutButtonText}>Finalizar Compra</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={{ height: 20 }} /> 
      </ScrollView>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Sincronizando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Minha Loja</Text>
        <TouchableOpacity style={styles.cartIconContainer} onPress={() => setCurrentScreen('CART')}>
          <Feather name="shopping-cart" size={28} color="#4F46E5" />
          {cart.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{cart.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, currentScreen === 'PRODUCTS' && styles.tabActive]}
          onPress={() => setCurrentScreen('PRODUCTS')}
        >
          <Text style={[styles.tabText, currentScreen === 'PRODUCTS' && styles.tabTextActive]}>Produtos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, currentScreen === 'CART' && styles.tabActive]}
          onPress={() => setCurrentScreen('CART')}
        >
          <Text style={[styles.tabText, currentScreen === 'CART' && styles.tabTextActive]}>
            Carrinho ({cart.reduce((sum, item) => sum + item.quantity, 0)})
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {currentScreen === 'PRODUCTS' ? renderProductList() : renderCart()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingTop: Platform.OS === 'android' ? 30 : 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  cartIconContainer: {
    padding: 8,
  },
  badge: {
    position: 'absolute',
    right: 4,
    top: 4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#4F46E5',
  },
  tabText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: 10,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 8,
  },
  productDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: '#4F46E5',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 5,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
  cartContainer: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  emptyCartText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
    color: '#6B7280',
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 5,
    borderLeftColor: '#4F46E5',
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
  },
  cartItemDetails: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  cartItemPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#059669',
    marginTop: 5,
  },
  cartItemPriceSmall: {
    fontSize: 12,
    color: '#6B7280',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  quantityButton: {
    backgroundColor: '#F3F4F6',
    width: 30,
    height: 30,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    minWidth: 20,
    textAlign: 'center',
  },
  removeButton: {
    padding: 5,
    marginLeft: 10,
  },
  summaryBox: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
    marginBottom: 15,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  grandTotalRow: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 5,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
  },
  checkoutButton: {
    backgroundColor: '#059669',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 2 },
      android: { elevation: 5 },
    }),
  },
  checkoutButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 18,
  },
});