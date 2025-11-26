import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

const SobreNosCard = () => {
  return (
    <View style={styles.card}>
      <Text style={styles.titulo}>Porque POKEBOLSA ?</Text>

      <Text style={styles.texto}>
        Decidimos replicar o funcionamento de uma bolsa de valores utilizando o
        funcionamento do mercado de cartas de Pokémon Trading Card Game.
      </Text>

      <Image
        source={require('../assets/logan-paul-wears-most-expensive-pokemon-card-to-wrestlemania_3xwc.jpg')}
        style={styles.imagem}
        resizeMode="cover"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    margin: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,

    borderWidth: 1,
    borderColor: '#f1f1f1',

    transform: [{ translateY: 0 }],
  },

  titulo: {
    fontSize: 22,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 12,
    color: '#222',
    letterSpacing: 1,
  },

  texto: {
    fontSize: 16,
    lineHeight: 24,
    color: '#555',
    marginBottom: 20,
  },

  imagem: {
    width: '100%',
    aspectRatio: 1, // mantém proporção quadrada
    borderRadius: 16,
    overflow: 'hidden',
  },
});

export default SobreNosCard;