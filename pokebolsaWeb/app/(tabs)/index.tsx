import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import Parse from 'parse/react-native.js';

Parse.setAsyncStorage(require('@react-native-async-storage/async-storage').default);
Parse.initialize("oROi44bIA05p8RhgGbzBr6ivK5BFxLr6MwKMWH2t", "gOJwJ5OsL2p9pc9HiePVVakMQB8kUm0pId7FVzal");
Parse.serverURL = 'https://parseapi.back4app.com/';

export default function MegaCardsPage() {
  const [cartas, setCartas] = useState([]);
  const [erro, setErro] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function carregarCartas() {
      try {
        const url = 'https://api.pokemontcg.io/v2/cards?q=subtypes:mega&orderBy=-set.releaseDate';
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error(`Status: ${response.status}`);
        const result = await response.json();
        setCartas(Array.isArray(result?.data) ? result.data : []);
      } catch (err) {
        setErro(err.message);
      } finally {
        setCarregando(false);
      }
    }

    carregarCartas();
    return () => controller.abort();
  }, []);

  const renderItem = ({ item }) => (
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

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>CARTAS MEGA</Text>
      <Text style={styles.subheader}>Mais recentes primeiro</Text>
      <Text style={styles.highlight}>Veja as cartas mais raras e poderosas do universo Pokémon!</Text>

      {carregando ? (
        <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 20 }} />
      ) : erro ? (
        <Text style={styles.error}>{erro}</Text>
      ) : (
        <FlatList
          data={cartas}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}

      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>Dicas para colecionadores</Text>
        <Text style={styles.tip}>• Procure cartas com selo especial.</Text>
        <Text style={styles.tip}>• Invista na sua coleção.</Text>
        <Text style={styles.tip}>• Seja um colecionador!!</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff' },
  header: { fontSize: 28, fontWeight: 'bold', color: '#4F46E5', marginBottom: 4 },
  subheader: { fontSize: 18, color: '#6B7280', marginBottom: 10 },
  highlight: { fontSize: 16, marginBottom: 20, color: '#1F2937' },
  list: { paddingBottom: 20 },
  card: { backgroundColor: '#F3F4F6', padding: 12, borderRadius: 10, marginBottom: 16 },
  image: { height: 150, borderRadius: 8, resizeMode: 'contain', marginBottom: 10 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  subtitle: { fontSize: 14, color: '#6B7280', marginVertical: 4 },
  price: { fontSize: 16, fontWeight: 'bold', color: '#059669' },
  error: { color: 'red', fontSize: 16, marginTop: 20 },
  tipsContainer: { marginTop: 30, padding: 16, backgroundColor: '#EEF2FF', borderRadius: 8 },
  tipsTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: '#4F46E5' },
  tip: { fontSize: 14, color: '#1F2937', marginBottom: 4 },
});