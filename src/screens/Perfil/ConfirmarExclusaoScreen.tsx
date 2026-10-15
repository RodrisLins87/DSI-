import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { deleteUser, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { deleteDoc, doc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';

export default function ConfirmarExclusaoScreen({ navigation }: { navigation: any }) {
  const [senha, setSenha] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  async function handleExcluir(): Promise<void> {
    const user = auth.currentUser;
    if (!user || !user.email) return;

    if (!senha) {
      Alert.alert('Atenção', 'Digite sua senha atual para confirmar.');
      return;
    }

    setLoading(true);
    try {
      // 1. Reautentica: o Firebase exige login recente para excluir a conta
      const credencial = EmailAuthProvider.credential(user.email, senha);
      await reauthenticateWithCredential(user, credencial);

      // 2. Apaga os dados da clínica no Firestore (precisa ser antes de excluir o usuário)
      await deleteDoc(doc(db, 'clinicas', user.uid));

      // 3. Exclui a conta do Authentication
      await deleteUser(user);

      // O listener do AppNavigator detecta que não há mais usuário e volta para o Login
    } catch (error: any) {
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        Alert.alert('Erro', 'Senha incorreta.');
      } else {
        Alert.alert('Erro', 'Não foi possível excluir a conta. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View>
      <Text>Confirmar Exclusão</Text>
      <Text>Ação Irreversível</Text>
      <Text>
        Ao excluir sua conta, todos os seus dados clínicos, agendamentos e históricos de
        pacientes serão apagados permanentemente. Esta ação não pode ser desfeita.
      </Text>

      <Text>Senha Atual</Text>
      <TextInput
        value={senha}
        onChangeText={setSenha}
        placeholder="Insira sua senha"
        secureTextEntry
        autoCapitalize="none"
        editable={!loading}
      />

      <TouchableOpacity onPress={handleExcluir} disabled={loading}>
        {loading ? <ActivityIndicator /> : <Text>Excluir Conta Permanentemente</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()} disabled={loading}>
        <Text>Cancelar</Text>
      </TouchableOpacity>
    </View>
  );
}

