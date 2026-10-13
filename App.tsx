import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import { FONT_ASSETS } from './src/global/fonts';

export default function App() {
  const [fontsLoaded, fontError] = useFonts(FONT_ASSETS);

  // Espera a fonte Manrope carregar. Se der erro, segue com a fonte padrão do sistema.
  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <AppNavigator />
    </GestureHandlerRootView>
  );
}