import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

const TecnologiasCard = () => {
  return (
    <View style={styles.card}>
      <Text style={styles.titulo}>Tecnologias Usadas</Text>
      <Text style={styles.texto}>
        React-Native;{"\n"}
        Expo;{"\n"}
        Back4App;{"\n"}
        API PokémonTCG
      </Text>
      
      {/* Usando a mesma imagem do exemplo anterior, certifique-se que ela existe */}
      <Image 
        source={require('../assets/logan-paul-wears-most-expensive-pokemon-card-to-wrestlemania_3xwc.jpg')} 
        style={styles.image} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center'
  },
  titulo: {
    fontSize: 20,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 10,
    color: '#333',
    alignSelf: 'flex-start'
  },
  texto: {
    fontSize: 16,
    lineHeight: 22,
    color: '#555',
    marginBottom: 20,
    width: '100%' // Garante que o texto ocupe a largura
  },
  image: {
    width: 250,
    height: 250,
    borderRadius: 8
  }
});

export default TecnologiasCard;