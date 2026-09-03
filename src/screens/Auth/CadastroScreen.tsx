import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';

interface DadosClinica {
  nome: string;
  cnpj: string;
  endereco: string;
  email: string;
  senha: string;
}

export default function CadastroScreen({ navigation }: { navigation: any }) {
  const [nome, setNome] = useState<string>('');
  const [cnpj, setCnpj] = useState<string>('');
  const [endereco, setEndereco] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [senha, setSenha] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  async function handleCadastro(): Promise<void> {
    setLoading(true);
    try {
      // 1. Cria o usuário no Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const clinicaId: string = userCredential.user.uid;

      // 2. Salva os dados da clínica no Firestore, usando o MESMO id do usuário
      await setDoc(doc(db, 'clinicas', clinicaId), {
        nome,
        cnpj,
        endereco,
        email,
        telefone: '',
        criadoEm: new Date(),
      });

      // sucesso: o listener global já redireciona pra Home
    } catch (error: any) {
      Alert.alert('Erro ao criar conta', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View>
      <Text>Criar Conta</Text>
      <TextInput value={nome} onChangeText={setNome} placeholder="Nome da Clínica" />
      <TextInput value={cnpj} onChangeText={setCnpj} placeholder="CNPJ" />
      <TextInput value={endereco} onChangeText={setEndereco} placeholder="Endereço" />
      <TextInput value={email} onChangeText={setEmail} placeholder="E-mail" autoCapitalize="none" />
      <TextInput value={senha} onChangeText={setSenha} placeholder="Senha" secureTextEntry />
      <TouchableOpacity onPress={handleCadastro} disabled={loading}>
        <Text>{loading ? 'Criando...' : 'Criar Conta'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text>Já tem conta? Entrar</Text>
      </TouchableOpacity>
    </View>
  );
}