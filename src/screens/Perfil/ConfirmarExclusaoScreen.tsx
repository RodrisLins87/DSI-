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
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { deleteUser, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { deleteDoc, doc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { FONT } from '../../global/fonts';
import { COR, CabecalhoTela, Rotulo } from '../Consultas/components/AgendamentoCampos';

export default function ConfirmarExclusaoScreen({ navigation }: { navigation: any }) {
  const insets = useSafeAreaInsets();
  const [senha, setSenha] = useState<string>('');
  const [senhaVisivel, setSenhaVisivel] = useState<boolean>(false);
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <CabecalhoTela
        titulo="Confirmar Exclusão"
        onVoltar={() => navigation.goBack()}
        desabilitado={loading}
      />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Alerta */}
        <View style={styles.alertCircle}>
          <MaterialIcons name="warning" size={32} color="#BA1A1A" />
        </View>
        <Text style={styles.alertTitle}>Ação Irreversível</Text>
        <Text style={styles.alertText}>
          Ao excluir sua conta, todos os seus dados clínicos, agendamentos e históricos de
          pacientes serão apagados permanentemente. Esta ação não pode ser desfeita.
        </Text>

        {/* Senha */}
        <Rotulo primeiro>Senha Atual</Rotulo>
        <View style={styles.campo}>
          <TextInput
            style={styles.input}
            value={senha}
            onChangeText={setSenha}
            placeholder="Insira sua senha"
            placeholderTextColor={COR.placeholder}
            secureTextEntry={!senhaVisivel}
            autoCapitalize="none"
            editable={!loading}
          />
          <TouchableOpacity onPress={() => setSenhaVisivel(!senhaVisivel)}>
            <MaterialIcons
              name={senhaVisivel ? 'visibility-off' : 'visibility'}
              size={22}
              color={COR.placeholder}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Rodapé fixo */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
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
  container: { flex: 1, backgroundColor: COR.fundo },

  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 28 },

  alertCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFDAD6',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 14,
  },
  alertTitle: {
    fontFamily: FONT.bold,
    fontSize: 20,
    color: '#BA1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  alertText: {
    fontFamily: FONT.regular,
    fontSize: 14,
    lineHeight: 22,
    color: COR.suave,
    textAlign: 'center',
    marginBottom: 28,
  },

  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 48,
    backgroundColor: COR.branco,
    borderWidth: 1,
    borderColor: COR.borda,
    borderRadius: 8,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  input: {
    flex: 1,
    fontFamily: FONT.regular,
    fontSize: 14,
    color: COR.texto,
    paddingVertical: 0,
  },

  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COR.borda,
    backgroundColor: COR.branco,
  },
  deleteButton: {
    height: 48,
    backgroundColor: '#BA1A1A',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  buttonDisabled: { opacity: 0.6 },
  deleteButtonText: {
    fontFamily: FONT.semibold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  cancelButton: {
    height: 48,
    borderWidth: 1,
    borderColor: COR.placeholder,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COR.branco,
  },
  cancelButtonText: {
    fontFamily: FONT.semibold,
    fontSize: 14,
    color: COR.escuro,
  },
});