import React from 'react';
import { StatusBar } from 'expo-status-bar';
import LaudoAddScreen from './src/screens/Laudos/LaudoAddScreen';

export default function App() {
  return (
    <>
      <StatusBar style="auto" />
      <LaudoAddScreen />
    </>
  );
}