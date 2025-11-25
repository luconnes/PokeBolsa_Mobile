import { Image } from 'expo-image';
import { Platform, StyleSheet, Button, Pressable } from 'react-native';
// Adicionar o hook useRouter para navegação programática
import { Link, useRouter } from 'expo-router'; 

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function HomeScreen() {
  const router = useRouter(); // Inicializa o hook de roteamento

  const handleNavigateToDetail = () => {
    // router.push() empilha a nova tela, permitindo que o usuário volte.
    // O nome da rota é baseado no caminho do arquivo (ex: app/(tabs)/detail.tsx -> '/detail')
    router.push('/sobre'); 
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome!</ThemedText>
        <HelloWave />
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 1: Try it</ThemedText>
        <ThemedText>
          Edit <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> to see changes.
          Press{' '}
          <ThemedText type="defaultSemiBold">
            {Platform.select({
              ios: 'cmd + d',
              android: 'cmd + m',
              web: 'F12',
            })}
          </ThemedText>{' '}
          to open developer tools.
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        {/*
          Exemplo de navegação declarativa usando o componente Link (já existia no seu código)
          Isto abriria um modal, mas você pode mudar o href para navegar para qualquer rota.
        */}
        <Link href="/modal">
          <Link.Trigger>
            <ThemedText type="subtitle">Step 2: Explore</ThemedText>
          </Link.Trigger>
          <Link.Preview />
          {/* ... Link.Menu ... */}
        </Link>

        <ThemedText>
          {`Tap the Explore tab to learn more about what's included in this starter app.`}
        </ThemedText>
      </ThemedView>

      {/* --- CÓDIGO DE REDIRECIONAMENTO (NAVEGAÇÃO) ADICIONADO --- */}
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 4: Redirecionar para outra Página</ThemedText>
        <ThemedText>
            Clique no botão abaixo para ir para a página de detalhes usando navegação programática.
        </ThemedText>
        
        <Button
            title="Ir para Detalhes (/detail)"
            onPress={handleNavigateToDetail}
        />
      </ThemedView>
      {/* --------------------------------------------------------- */}

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
        <ThemedText>
          {`When you're ready, run `}
          <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText> to get a fresh{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> directory. This will move the current{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> to{' '}
          <ThemedText type="defaultSemiBold">app-example</ThemedText>.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});