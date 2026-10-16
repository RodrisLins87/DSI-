import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { deleteUser, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { deleteDoc, doc } from 'firebase/firestore';
import {
  useFonts,
  Manrope_400Regular,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';
import { auth, db } from '../../lib/firebase';

export default function ConfirmarExclusaoScreen({ navigation }: { navigation: any }) {
  const [senha, setSenha] = useState<string>('');
  const [senhaVisivel, setSenhaVisivel] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

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

  if (!fontsLoaded) return null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Cabeçalho */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          disabled={loading}
        >
          <Ionicons name="arrow-back" size={24} color="#0E3D3A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirmar Exclusão</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Alerta */}
        <View style={styles.alertCircle}>
          <Ionicons name="warning" size={34} color="#B91C1C" />
        </View>
        <Text style={styles.alertTitle}>Ação Irreversível</Text>
        <Text style={styles.alertText}>
          Ao excluir sua conta, todos os seus dados clínicos, agendamentos e históricos de
          pacientes serão apagados permanentemente. Esta ação não pode ser desfeita.
        </Text>

        {/* Senha */}
        <Text style={styles.label}>Senha Atual</Text>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            value={senha}
            onChangeText={setSenha}
            placeholder="Insira sua senha"
            placeholderTextColor="#9AA5A3"
            secureTextEntry={!senhaVisivel}
            autoCapitalize="none"
            editable={!loading}
          />
          <TouchableOpacity onPress={() => setSenhaVisivel(!senhaVisivel)}>
            <Ionicons
              name={senhaVisivel ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color="#5A6B69"
            />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Rodapé fixo */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.deleteButton, loading && styles.buttonDisabled]}
          onPress={handleExcluir}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.deleteButtonText}>Excluir Conta Permanentemente</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FC' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E5E9',
    backgroundColor: '#F7F9FC',
  },
  backButton: { position: 'absolute', left: 20, bottom: 16 },
  headerTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 18,
    color: '#0E3D3A',
  },

  content: { padding: 20, alignItems: 'stretch' },

  alertCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFD9D6',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  alertTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 22,
    color: '#B91C1C',
    textAlign: 'center',
    marginBottom: 10,
  },
  alertText: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    lineHeight: 21,
    color: '#3D4F4D',
    textAlign: 'center',
    marginBottom: 28,
  },

  label: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
    color: '#3D4F4D',
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D5DAD9',
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    fontFamily: 'Manrope_400Regular',
    fontSize: 15,
    color: '#1C2B2E',
    paddingVertical: 14,
  },

  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E5E9',
    backgroundColor: '#F7F9FC',
  },
  deleteButton: {
    backgroundColor: '#B91C1C',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  buttonDisabled: { opacity: 0.6 },
  deleteButtonText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#9AA5A3',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 15,
    color: '#1C2B2E',
  },
});