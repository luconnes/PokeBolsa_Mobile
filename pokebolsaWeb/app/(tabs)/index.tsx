import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, StyleSheet, ActivityIndicator } from 'react-native';

// REMOVIDO: Toda a importação e configuração do Parse que causava o erro.

export default function MegaCardsPage() {
  const [cartas, setCartas] = useState([]);
  const [erro, setErro] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function carregarCartas() {
      try {
        // Mantemos o fetch nativo pois é uma API externa (Pokemon TCG)
        const url = 'https://api.pokemontcg.io/v2/cards?q=subtypes:mega&orderBy=-set.releaseDate';
        const response = await fetch(url, { signal: controller.signal });
        
        if (!response.ok) throw new Error(`Status: ${response.status}`);
        
        const result = await response.json();
        setCartas(Array.isArray(result?.data) ? result.data : []);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setErro(err.message);
        }
      } finally {
        setCarregando(false);
      }
    }

    carregarCartas();
    return () => controller.abort();
  }, []);

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <Image source={{ uri: item.images?.small }} style={styles.image} />
      <Text style={styles.title}>{item.name}</Text>
      <Text style={styles.subtitle}>{item.set?.name || "Conjunto desconhecido"}</Text>
      <Text style={styles.price}>
        {item.tcgplayer?.prices?.holofoil?.low
          ? `R$ ${item.tcgplayer.prices.holofoil.low}`
          : 'Preço indisponível'}
      </Text>
    </View>
  );

  // Componente para o topo da lista (Substitui a parte de cima do ScrollView)
  const renderHeader = () => (
    <View>
      <Text style={styles.header}>CARTAS MEGA</Text>
      <Text style={styles.subheader}>Mais recentes primeiro</Text>
      <Text style={styles.highlight}>Veja as cartas mais raras e poderosas do universo Pokémon!</Text>
      {carregando && <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 20 }} />}
      {erro && <Text style={styles.error}>{erro}</Text>}
    </View>
  );

  // Componente para o rodapé da lista (Substitui a parte de baixo do ScrollView)
  const renderFooter = () => (
    <View style={styles.tipsContainer}>
      <Text style={styles.tipsTitle}>Dicas para colecionadores</Text>
      <Text style={styles.tip}>• Procure cartas com selo especial.</Text>
      <Text style={styles.tip}>• Invista na sua coleção.</Text>
      <Text style={styles.tip}>• Seja um colecionador!!</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={cartas}
        renderItem={renderItem}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={styles.list}
        // Usamos ListHeader e ListFooter para evitar ScrollView dentro de ScrollView
        ListHeaderComponent={renderHeader}
        ListFooterComponent={!carregando ? renderFooter : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' }, // Mudei para flex: 1
  header: { fontSize: 28, fontWeight: 'bold', color: '#4F46E5', marginBottom: 4, marginTop: 16, marginHorizontal: 16 },
  subheader: { fontSize: 18, color: '#6B7280', marginBottom: 10, marginHorizontal: 16 },
  highlight: { fontSize: 16, marginBottom: 20, color: '#1F2937', marginHorizontal: 16 },
  list: { paddingBottom: 20 },
  card: { backgroundColor: '#F3F4F6', padding: 12, borderRadius: 10, marginBottom: 16, marginHorizontal: 16 },
  image: { height: 150, borderRadius: 8, resizeMode: 'contain', marginBottom: 10 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  subtitle: { fontSize: 14, color: '#6B7280', marginVertical: 4 },
  price: { fontSize: 16, fontWeight: 'bold', color: '#059669' },
  error: { color: 'red', fontSize: 16, marginTop: 20, marginHorizontal: 16 },
  tipsContainer: { marginTop: 30, padding: 16, backgroundColor: '#EEF2FF', borderRadius: 8, marginHorizontal: 16, marginBottom: 40 },
  tipsTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: '#4F46E5' },
  tip: { fontSize: 14, color: '#1F2937', marginBottom: 4 },
});