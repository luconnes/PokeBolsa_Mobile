import { Image } from 'expo-image';
import { Platform, StyleSheet } from 'react-native';

import { Collapsible } from '@/components/ui/collapsible';
import { ExternalLink } from '@/components/external-link';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts } from '@/constants/theme';

export default function TabTwoScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#e7e7e7', dark: '#2c2c2c' }}
      headerImage={
        <IconSymbol
          size={260}
          color="#A0A0A0"
          name="paperplane.fill"
          style={styles.headerImage}
        />
      }
    >
      {/* TÍTULO */}
      <ThemedView style={styles.titleContainer}>
        <ThemedText
          type="title"
          style={{
            fontFamily: Fonts.rounded,
            fontSize: 32,
            fontWeight: '600',
          }}
        >
          Explore
        </ThemedText>
      </ThemedView>

      <ThemedText style={styles.subtitle}>
        Recursos úteis para ajudar você a navegar pelo projeto:
      </ThemedText>

      {/* SEÇÃO 1 */}
      <ThemedView style={styles.card}>
        <Collapsible title="📁 File-based routing">
          <ThemedText style={styles.text}>
            O app possui duas telas principais:{' '}
            <ThemedText type="defaultSemiBold">index.tsx</ThemedText> e{' '}
            <ThemedText type="defaultSemiBold">explore.tsx</ThemedText>.
          </ThemedText>

          <ThemedText style={styles.text}>
            O arquivo{' '}
            <ThemedText type="defaultSemiBold">_layout.tsx</ThemedText>{' '}
            configura toda a navegação por abas.
          </ThemedText>

          <ExternalLink href="https://docs.expo.dev/router/introduction">
            <ThemedText type="link">Saiba mais</ThemedText>
          </ExternalLink>
        </Collapsible>
      </ThemedView>

      {/* SEÇÃO 2 */}
      <ThemedView style={styles.card}>
        <Collapsible title="📱 Suporte a Android, iOS e Web">
          <ThemedText style={styles.text}>
            Você pode rodar este projeto no Android, iOS e Web.  
            Para abrir no navegador, aperte{' '}
            <ThemedText type="defaultSemiBold">W</ThemedText> no terminal.
          </ThemedText>
        </Collapsible>
      </ThemedView>

      {/* SEÇÃO 3 */}
      <ThemedView style={styles.card}>
        <Collapsible title="🖼 Imagens">
          <ThemedText style={styles.text}>
            Use os sufixos <ThemedText type="defaultSemiBold">@2x</ThemedText> e{' '}
            <ThemedText type="defaultSemiBold">@3x</ThemedText> para diferentes densidades de tela.
          </ThemedText>

          <Image
            source={require('@/assets/images/react-logo.png')}
            style={styles.image}
          />

          <ExternalLink href="https://reactnative.dev/docs/images">
            <ThemedText type="link">Saiba mais</ThemedText>
          </ExternalLink>
        </Collapsible>
      </ThemedView>

      {/* SEÇÃO 4 */}
      <ThemedView style={styles.card}>
        <Collapsible title="🌗 Light & Dark Mode">
          <ThemedText style={styles.text}>
            Este template suporta temas claro e escuro usando{' '}
            <ThemedText type="defaultSemiBold">useColorScheme()</ThemedText>.
          </ThemedText>

          <ExternalLink href="https://docs.expo.dev/develop/user-interface/color-themes/">
            <ThemedText type="link">Saiba mais</ThemedText>
          </ExternalLink>
        </Collapsible>
      </ThemedView>

      {/* SEÇÃO 5 */}
      <ThemedView style={styles.card}>
        <Collapsible title="✨ Animações">
          <ThemedText style={styles.text}>
            Este projeto inclui animações usando{' '}
            <ThemedText
              type="defaultSemiBold"
              style={{ fontFamily: Fonts.mono }}
            >
              react-native-reanimated
            </ThemedText>.
          </ThemedText>

          {Platform.select({
            ios: (
              <ThemedText style={styles.text}>
                O componente{' '}
                <ThemedText type="defaultSemiBold">
                  ParallaxScrollView
                </ThemedText>{' '}
                adiciona o efeito de paralaxe ao header.
              </ThemedText>
            ),
          })}
        </Collapsible>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    opacity: 0.15,
    bottom: -60,
    left: -20,
    position: 'absolute',
    transform: [{ rotate: '-10deg' }],
  },

  titleContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingHorizontal: 8,
  },

  subtitle: {
    marginBottom: 20,
    fontSize: 15,
    opacity: 0.8,
    paddingHorizontal: 8,
  },

  card: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },

  text: {
    marginBottom: 10,
    lineHeight: 22,
    fontSize: 15,
  },

  image: {
    width: 100,
    height: 100,
    alignSelf: 'center',
    marginVertical: 10,
  },
});
