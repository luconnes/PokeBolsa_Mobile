import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const checkLogin = async () => {
      try {
        // Verifica se existe um token salvo
        const token = await AsyncStorage.getItem('userToken');
        
        // Pequeno delay para garantir que a navegação esteja pronta
        setTimeout(() => {
          if (token) {
            
            router.replace('/(tabs)');
          } else {
            // Se não tem, vai para o login
            router.replace('/login');
          }
        }, 100);
      } catch (e) {
        // Em caso de erro, manda pro login por segurança
        router.replace('/login');
      }
    };

    checkLogin();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#e03427ff" />
    </View>
  );
}