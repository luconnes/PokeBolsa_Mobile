import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TecnologiasCard = () => {
  return (
    <View style={styles.card}>
      <Text style={styles.titulo}>Tecnologias Usadas</Text>

      <View style={styles.lista}>
        <View style={styles.item}>
          <Ionicons name="logo-react" size={22} color="#61DBFB" />
          <Text style={styles.textoItem}>React Native</Text>
        </View>

        <View style={styles.item}>
          <Ionicons name="rocket-outline" size={22} color="#444" />
          <Text style={styles.textoItem}>Expo</Text>
        </View>

        <View style={styles.item}>
          <Ionicons name="cloud-outline" size={22} color="#444" />
          <Text style={styles.textoItem}>Back4App</Text>
        </View>

        <View style={styles.item}>
          <Ionicons name="albums-outline" size={22} color="#ff3d3d" />
          <Text style={styles.textoItem}>API Pokémon TCG</Text>
        </View>
      </View>

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
    marginBottom: 15,
    color: '#333',
    alignSelf: 'flex-start'
  },

  lista: {
    width: '100%',
    marginBottom: 20,
  },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  textoItem: {
    fontSize: 16,
    color: '#555',
    marginLeft: 10,
  },

  image: {
    width: 250,
    height: 250,
    borderRadius: 8,
  }
});

export default TecnologiasCard;
