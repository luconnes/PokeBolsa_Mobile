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
  RefreshControl // Adicionei para poder puxar pra baixo e atualizar
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

// Importamos nossas funções REST
import { apiGet, apiPost, apiPut } from '../../services/api';

// =================================================================
// 1. TIPOS
// =================================================================

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  // image?: string; // Futuramente você pode adicionar imagem
}

interface CartItem extends Product {
  quantity: number;
}

type Screen = 'PRODUCTS' | 'CART';

// REMOVIDO: O PRODUCTS_MOCK não é mais necessário, pois virá do banco.

// =================================================================
// 2. COMPONENTES AUXILIARES
// =================================================================

const ProductCard: React.FC<{ product: Product, onAddToCart: (product: Product) => void }> = React.memo(({ product, onAddToCart }) => (
  <View style={styles.productCard}>
    <Text style={styles.productName}>{product.name}</Text>
    {/* Tratamento para garantir que price seja número antes de toFixed */}
    <Text style={styles.productPrice}>
      R$ {Number(product.price || 0).toFixed(2).replace('.', ',')}
    </Text>
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
  
  // NOVO: Estado para os produtos do banco de dados
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentScreen, setCurrentScreen] = useState<Screen>('PRODUCTS');
  const [loadingSession, setLoadingSession] = useState(true);
  
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [cartObjectId, setCartObjectId] = useState<string | null>(null);

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cart]);

  // --- Função REST para Salvar Carrinho ---
  const saveCartToAPI = useCallback(async (currentCart: CartItem[], currentSessionId: string, objectId: string | null) => {
    try {
      const payload = {
        sessionId: currentSessionId,
        items: JSON.stringify(currentCart) 
      };

      if (objectId) {
        await apiPut('CartSession', objectId, payload);
        console.log('Carrinho ATUALIZADO via REST.');
      } else {
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

  // --- NOVA FUNÇÃO: Buscar Produtos do Back4App ---
  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      // ATENÇÃO: Certifique-se que o nome da classe no Back4App é exatamente 'Product'
      const response = await apiGet('Product'); 
      
      if (response.results) {
        // Mapeamos os dados do Back4App (objectId) para nosso formato (id)
        const mappedProducts = response.results.map((p: any) => ({
          id: p.objectId,
          name: p.name,
          price: p.price || 0,
          description: p.description || '',
        }));
        setProducts(mappedProducts);
      }
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      Alert.alert("Erro", "Não foi possível carregar os produtos.");
    } finally {
      setLoadingProducts(false);
    }
  };

  // --- Inicialização ---
  useEffect(() => {
    const initialize = async () => {
      // 1. Busca Produtos
      fetchProducts();

      // 2. Busca Sessão do Carrinho
      let localSessionId = await AsyncStorage.getItem('userSessionId');
      if (!localSessionId) {
        localSessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2)}`;
        await AsyncStorage.setItem('userSessionId', localSessionId);
      }
      setSessionId(localSessionId);

      try {
        const whereQuery = JSON.stringify({ sessionId: localSessionId });
        const result = await apiGet(`CartSession?where=${encodeURIComponent(whereQuery)}`);

        if (result.results && result.results.length > 0) {
          const serverCart = result.results[0];
          setCartObjectId(serverCart.objectId);
          if (serverCart.items) {
            setCart(JSON.parse(serverCart.items) as CartItem[]);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar carrinho inicial:', error);
      } finally {
        setLoadingSession(false);
      }
    };

    initialize();
  }, []);

  // --- Auto-Save ---
  useEffect(() => {
    if (sessionId && !loadingSession) {
      const timer = setTimeout(() => {
        saveCartToAPI(cart, sessionId, cartObjectId);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cart, sessionId, cartObjectId, loadingSession, saveCartToAPI]);


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
      data={products} // AGORA USAMOS OS DADOS DO BANCO
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl refreshing={loadingProducts} onRefresh={fetchProducts} />
      }
      ListEmptyComponent={
        !loadingProducts ? (
          <Text style={styles.emptyCartText}>Nenhum produto encontrado no Back4App.</Text>
        ) : null
      }
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
              onPress={() => Alert.alert("Sucesso", "Pedido enviado!")}
            >
              <Text style={styles.checkoutButtonText}>Finalizar Compra</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={{ height: 20 }} /> 
      </ScrollView>
    </View>
  );

  if (loadingSession) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Carregando Loja...</Text>
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