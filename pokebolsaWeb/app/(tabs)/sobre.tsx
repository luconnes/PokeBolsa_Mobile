import { Image } from 'expo-image';
import { Platform, StyleSheet } from 'react-native';

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Link } from 'expo-router';
import { ScrollView } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import SobreNosCard from "../components/SobreNosCard";
import TecnologiasCard from '../components/TecnologiasCards';



export default function SobreScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView>
        <SobreNosCard />
        <TecnologiasCard />
      </ScrollView>
    </SafeAreaView>
  );
}