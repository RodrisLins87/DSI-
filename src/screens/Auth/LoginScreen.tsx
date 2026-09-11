import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';

export default function LoginScreen({ navigation }: { navigation: any }) {
  const [email, setEmail] = useState<string>('');
  const [senha, setSenha] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  async function handleLogin(): Promise<void> {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, senha);
      // sucesso: o listener global (passo 5) já redireciona pra Home sozinho
    } catch (error) {
      Alert.alert('Erro', 'E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View>
      <Text>Login</Text>
      <TextInput value={email} onChangeText={setEmail} placeholder="E-mail" autoCapitalize="none" />
      <TextInput value={senha} onChangeText={setSenha} placeholder="Senha" secureTextEntry />
      <TouchableOpacity onPress={handleLogin} disabled={loading}>
        <Text>{loading ? 'Entrando...' : 'Entrar'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Cadastro')}>
        <Text>Não tem conta? Criar conta</Text>
      </TouchableOpacity>
    </View>
  );
}