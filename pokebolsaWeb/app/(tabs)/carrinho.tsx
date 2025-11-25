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
// Dependência Feather é parte do @expo/vector-icons
import { Feather } from '@expo/vector-icons';
import Parse from 'parse/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// =================================================================
// 1. CONFIGURAÇÃO BACK4APP (SUBSTITUIR PELAS SUAS CHAVES REAIS)
// =================================================================

// Instrução: Coloque suas chaves reais do Back4App aqui
const BACK4APP_APP_ID = 'YOUR_BACK4APP_APPLICATION_ID_HERE';
const BACK4APP_JS_KEY = 'YOUR_BACK4APP_JAVASCRIPT_KEY_HERE';

if (!Parse.applicationId) {
  Parse.setAsyncStorage(AsyncStorage);
  Parse.initialize(BACK4APP_APP_ID, BACK4APP_JS_KEY);
  Parse.serverURL = 'https://parseapi.back4app.com/';
}

// Classe Parse fictícia para persistir o carrinho do usuário
const ParseCartSession = Parse.Object.extend('CartSession');

// =================================================================
// 2. TIPOS E MOCK DE DADOS
// =================================================================

interface Product {
  id: string; // Usaremos string para Parse ObjectId
  name: string;
  price: number;
  description: string;
  // objectId é útil se estivéssemos lendo do Parse
}

interface CartItem extends Product {
  quantity: number;
}

type Screen = 'PRODUCTS' | 'CART';

// Mock de produtos (Em um app real, você buscaria isso de uma classe 'Product' no Parse)
const PRODUCTS_MOCK: Product[] = [
  { id: 'p1', name: 'Notebook Ultrafast X', price: 5899.99, description: 'Laptop de alta performance para jogos e trabalho.' },
  { id: 'p2', name: 'Mouse Gamer Chroma', price: 199.50, description: 'Mouse ergonômico com 10 botões programáveis.' },
  { id: 'p3', name: 'Teclado Mecânico Pro', price: 450.00, description: 'Switch brown, layout ABNT2, RGB.' },
  { id: 'p4', name: 'Monitor 4K OLED', price: 3200.00, description: '27 polegadas, 144Hz, cores vibrantes.' },
];


// =================================================================
// 3. COMPONENTES AUXILIARES
// =================================================================

// Card de Produto na lista
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

// Card de Item no Carrinho
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
// 4. COMPONENTE PRINCIPAL
// =================================================================

export default function Carrinho() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentScreen, setCurrentScreen] = useState<Screen>('PRODUCTS');
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Calcula o total do carrinho
  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cart]);

  // Função para salvar o carrinho no Back4App/Parse
  const saveCartToParse = useCallback(async (currentCart: CartItem[], currentSessionId: string) => {
    try {
      const query = new Parse.Query(ParseCartSession);
      query.equalTo('sessionId', currentSessionId);
      const result = await query.first();

      let cartObject;
      if (result) {
        // Atualiza o carrinho existente
        cartObject = result;
      } else {
        // Cria um novo carrinho
        cartObject = new ParseCartSession();
        cartObject.set('sessionId', currentSessionId);
      }

      // Salva o array de itens do carrinho (serializado para Parse)
      cartObject.set('items', JSON.stringify(currentCart));
      await cartObject.save();
      console.log('Carrinho salvo com sucesso no Back4App/Parse.');
    } catch (error) {
      console.error('Erro ao salvar o carrinho no Back4App:', error);
      Alert.alert('Erro', 'Não foi possível salvar o carrinho. Tente novamente.');
    }
  }, []);

  // Inicialização e Carregamento do Carrinho
  useEffect(() => {
    const initializeSessionAndLoadCart = async () => {
      let localSessionId = await AsyncStorage.getItem('userSessionId');

      if (!localSessionId) {
        // Cria um ID de sessão temporário se não existir
        localSessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2)}`;
        await AsyncStorage.setItem('userSessionId', localSessionId);
        console.log('Nova sessão iniciada:', localSessionId);
      }
      setSessionId(localSessionId);

      try {
        const query = new Parse.Query(ParseCartSession);
        query.equalTo('sessionId', localSessionId);
        const result = await query.first();

        if (result) {
          const itemsJson = result.get('items');
          if (itemsJson) {
            setCart(JSON.parse(itemsJson) as CartItem[]);
            console.log('Carrinho carregado do Back4App/Parse.');
          }
        }
      } catch (error) {
        console.error('Erro ao carregar o carrinho do Back4App:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeSessionAndLoadCart();
  }, []); // Executa apenas na montagem

  // Hook para persistir o carrinho sempre que ele muda
  useEffect(() => {
    if (sessionId && !loading) {
      saveCartToParse(cart, sessionId);
    }
  }, [cart, sessionId, loading, saveCartToParse]);

  // Adiciona um item ao carrinho ou aumenta a quantidade
  const addItemToCart = useCallback((product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      
      let newCart: CartItem[];
      
      if (existingItem) {
        newCart = prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // Usa as propriedades do produto real (do mock/Parse)
        newCart = [...prevCart, { ...product, quantity: 1 }];
      }
      return newCart;
    });
  }, []);

  // Remove um item completamente do carrinho
  const removeItemFromCart = useCallback((id: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  }, []);

  // Atualiza a quantidade (aumenta ou diminui)
  const updateItemQuantity = useCallback((id: string, type: 'increase' | 'decrease') => {
    setCart(prevCart => {
      return prevCart
        .map(item => {
          if (item.id === id) {
            const newQuantity = type === 'increase' ? item.quantity + 1 : item.quantity - 1;
            if (newQuantity < 1) {
              return null; // Será filtrado (remoção)
            }
            return { ...item, quantity: newQuantity };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]; // Remove itens nulos
    });
  }, []);


  // --- Renderização de Telas ---

  const renderProductList = () => (
    <FlatList
      data={PRODUCTS_MOCK} // Usa o mock de produtos (adaptar para Parse Query se necessário)
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
          <Text style={styles.emptyCartText}>Seu carrinho está vazio. Adicione alguns itens!</Text>
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
        
        {/* Box de Resumo deve ficar dentro do ScrollView ou usar um Footer na FlatList/ScrollView */}
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
              onPress={() => Alert.alert("Finalizar Compra", "Implementação de Checkout com persistência de pedido no Back4App.")}
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
        <Text style={styles.loadingText}>Carregando carrinho...</Text>
      </View>
    );
  }

  // --- Layout Principal ---

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

// =================================================================
// 5. ESTILOS
// =================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingTop: Platform.OS === 'android' ? 30 : 50, // Ajuste para barra de status no Android/iOS
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
  // --- Estilos do Produto ---
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
  // --- Estilos do Carrinho ---
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
  // --- Estilos do Resumo ---
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
    marginBottom: 15, // Espaço final
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