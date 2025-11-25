import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

const TecnologiasCard = () => {
  return (
    <View style={styles.card}>
      <Text style={styles.titulo}>Tecnologias Usadas</Text>
      <Text style={styles.texto}>
        
      </Text>
      <Image source={require('../assets/logan-paul-wears-most-expensive-pokemon-card-to-wrestlemania_3xwc.jpg')} style={{ width : 250, height: 250}} />

      
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    elevation: 5, // Sombra no Android
    shadowColor: '#000', // Sombra no iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  titulo: {
    fontSize: 20,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 10,
    color: '#333',
  },
  texto: {
    fontSize: 16,
    lineHeight: 22,
    color: '#555',
  },
});

export default TecnologiasCard;