import React from 'react';
import { StatusBar } from 'expo-status-bar';
import LaudoAddScreen from './src/screens/Laudos/LaudoAddScreen';

export default function App() {
  const [fontsLoaded, fontError] = useFonts(FONT_ASSETS);

  // Espera a fonte Manrope carregar. Se der erro, segue com a fonte padrão do sistema.
  if (!fontsLoaded && !fontError) return null;

  return (
    <>
      <StatusBar style="auto" />
      <LaudoAddScreen />
    </>
  )
}