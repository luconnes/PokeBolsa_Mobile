import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const checkLogin = async () => {
      try {
        
        const token = await AsyncStorage.getItem('userToken');
        
        
        setTimeout(() => {
          if (token) {
            
            router.replace('/(tabs)');
          } else {
            
            router.replace('/login');
          }
        }, 100);
      } catch (e) {
        
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