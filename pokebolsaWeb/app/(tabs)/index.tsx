import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Importamos nossas funções para falar com o Back4App
import { apiGet, apiPost, apiPut } from '../../services/api';

export default function MegaCardsPage() {
  const [cartas, setCartas] = useState([]);
  const [erro, setErro] = useState(null);
  const [carregando, setCarregando] = useState(true);
  
  // Estado para bloquear cliques múltiplos enquanto salva
  const [salvando, setSalvando] = useState(false); 

useEffect(() => {
    const controller = new AbortController();

    // Adicionamos um parâmetro para contar as tentativas (começa em 0)
    async function carregarCartas(tentativaAtual = 0) {
      const maxTentativas = 3;

      try {
        const url = 'https://api.pokemontcg.io/v2/cards?q=subtypes:mega&orderBy=-set.releaseDate';
        const response = await fetch(url, { signal: controller.signal });
        
        if (!response.ok) throw new Error(`Status: ${response.status}`);
        
        const result = await response.json();
        setCartas(Array.isArray(result?.data) ? result.data : []);
        
        // Se deu certo, paramos o carregamento aqui
        setCarregando(false);

      } catch (err: any) {
        // Se o erro foi cancelamento do usuário (sair da tela), não faz nada
        if (err.name === 'AbortError') return;

        // LÓGICA DE RETRY
        if (tentativaAtual < maxTentativas) {
          console.log(`Erro ao buscar. Tentando novamente em 2s... (Tentativa ${tentativaAtual + 1}/${maxTentativas})`);
          
          // Espera 2 segundos e chama a função novamente
          setTimeout(() => {
            // Verifica se o componente ainda está montado antes de tentar de novo
            if (!controller.signal.aborted) {
              carregarCartas(tentativaAtual + 1);
            }
          }, 2000); 

        } else {
          // Se excedeu o número de tentativas, mostra o erro e para o loading
          setErro("Falha após várias tentativas: " + err.message);
          setCarregando(false);
        }
      }
    }

    carregarCartas();
    return () => controller.abort();
  }, []);

  // --- LÓGICA DE ADICIONAR AO CARRINHO ---
  const handleAddToCart = async (item: any) => {
    if (salvando) return;
    setSalvando(true);

    try {
      // 1. Recuperar ou Criar ID de Sessão
      let sessionId = await AsyncStorage.getItem('userSessionId');
      if (!sessionId) {
        sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2)}`;
        await AsyncStorage.setItem('userSessionId', sessionId);
      }

      // 2. Mapear os dados da API Pokémon para o formato do nosso Carrinho
      // (A API do Pokémon tem uma estrutura complexa, simplificamos aqui)
      const preco = item.tcgplayer?.prices?.holofoil?.low || 10.00; // Preço padrão se não tiver
      
      const novoItem = {
        id: item.id, // ID da carta na API Pokémon
        name: item.name,
        price: preco,
        description: item.set?.name || "Coleção Pokémon",
        quantity: 1
      };

      // 3. Buscar o Carrinho Atual no Back4App
      const whereQuery = JSON.stringify({ sessionId: sessionId });
      const result = await apiGet(`CartSession?where=${encodeURIComponent(whereQuery)}`);

      let cartItems: any[] = [];
      let objectId = null;

      if (result.results && result.results.length > 0) {
        const carrinhoNoBanco = result.results[0];
        objectId = carrinhoNoBanco.objectId;
        if (carrinhoNoBanco.items) {
          cartItems = JSON.parse(carrinhoNoBanco.items);
        }
      }

      // 4. Atualizar a lista de itens (Lógica de Carrinho)
      const indexExistente = cartItems.findIndex((i: any) => i.id === novoItem.id);
      
      if (indexExistente >= 0) {
        // Se já existe, aumenta a quantidade
        cartItems[indexExistente].quantity += 1;
      } else {
        // Se não existe, adiciona
        cartItems.push(novoItem);
      }

      // 5. Salvar de volta no Back4App
      const payload = {
        sessionId: sessionId,
        items: JSON.stringify(cartItems)
      };

      if (objectId) {
        await apiPut('CartSession', objectId, payload);
      } else {
        await apiPost('CartSession', payload);
      }

      Alert.alert("Sucesso", `${novoItem.name} foi para o carrinho!`);

    } catch (error) {
      console.error("Erro ao adicionar ao carrinho:", error);
      Alert.alert("Erro", "Falha ao salvar no carrinho.");
    } finally {
      setSalvando(false);
    }
  };

  const renderItem = ({ item }: any) => {
    // Pegar o preço para exibir (tratando casos onde não existe preço)
    const precoDisplay = item.tcgplayer?.prices?.holofoil?.low 
      ? `R$ ${item.tcgplayer.prices.holofoil.low}`
      : 'R$ 10,00 (Est.)';

    return (
      <View style={styles.card}>
        <Image source={{ uri: item.images?.small }} style={styles.image} />
        
        <View style={styles.infoContainer}>
          <Text style={styles.title}>{item.name}</Text>
          <Text style={styles.subtitle}>{item.set?.name || "Conjunto desconhecido"}</Text>
          <Text style={styles.price}>{precoDisplay}</Text>
        </View>

        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => handleAddToCart(item)}
          disabled={salvando}
        >
          {salvando ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Feather name="shopping-cart" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.addButtonText}>Comprar</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // Cabeçalho da Lista
  const renderHeader = () => (
    <View>
      <Text style={styles.header}>CARTAS MEGA</Text>
      <Text style={styles.subheader}>API Externa + Back4App</Text>
      <Text style={styles.highlight}>Escolha suas cartas e mande para o carrinho!</Text>
      {carregando && <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 20 }} />}
      {erro && <Text style={styles.error}>{erro}</Text>}
    </View>
  );

  // Rodapé da Lista
  const renderFooter = () => (
    <View style={styles.tipsContainer}>
      <Text style={styles.tipsTitle}>Dicas para colecionadores</Text>
      <Text style={styles.tip}>• Os preços vêm da TCGPlayer.</Text>
      <Text style={styles.tip}>• O carrinho é sincronizado na nuvem.</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={cartas}
        renderItem={renderItem}
        keyExtractor={(item: any) => item.id}        
        contentContainerStyle={styles.list}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={!carregando ? renderFooter : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 30 },
  header: { fontSize: 28, fontWeight: 'bold', color: '#4F46E5', marginBottom: 4, marginTop: 16, marginHorizontal: 16 },
  subheader: { fontSize: 18, color: '#6B7280', marginBottom: 10, marginHorizontal: 16 },
  highlight: { fontSize: 16, marginBottom: 20, color: '#1F2937', marginHorizontal: 16 },
  
  // 1. Estilo para o container da FlatList.
  // Usado em 'contentContainerStyle' para garantir o padding horizontal geral.
  listContent: { 
    paddingHorizontal: 8, 
    paddingBottom: 20,
    // É crucial que a FlatList no seu JSX tenha a prop numColumns={2}
},
  
  // 2. Estilo do Cartão AJUSTADO para layout de 2 colunas
  card: { 
    // Define a largura para que dois cards caibam, deixando espaço para as margens
    width: '47%', 
    backgroundColor: '#F3F4F6', 
    padding: 12, 
    borderRadius: 10, 
    marginBottom: 16, 
    // Adiciona margem horizontal para criar um espaçamento entre os cards
    marginHorizontal: '1.5%', 
    
    // Sombra (Mantido)
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: { height: 120, borderRadius: 8, resizeMode: 'contain', marginBottom: 10, backgroundColor: '#fff' },
  infoContainer: { marginBottom: 10 },
  title: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' }, // Ajustado para caber melhor
  subtitle: { fontSize: 12, color: '#6B7280', marginVertical: 4 },
  price: { fontSize: 16, fontWeight: 'bold', color: '#059669', marginTop: 4 },
  
  // Estilo do Botão (Ajustado)
  addButton: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },

  error: { color: 'red', fontSize: 16, marginTop: 20, marginHorizontal: 16 },
  tipsContainer: { marginTop: 30, padding: 16, backgroundColor: '#EEF2FF', borderRadius: 8, marginHorizontal: 16, marginBottom: 40 },
  tipsTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: '#4F46E5' },
  tip: { fontSize: 14, color: '#1F2937', marginBottom: 4 },
});