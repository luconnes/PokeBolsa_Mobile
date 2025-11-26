import React from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";

import SobreNosCard from "../components/SobreNosCard";
import TecnologiasCard from '../components/TecnologiasCards';

export default function SobreScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView>
        <SobreNosCard />
        <TecnologiasCard />
      </ScrollView>
    </SafeAreaView>
  );
}