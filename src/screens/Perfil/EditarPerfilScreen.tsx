import React, { useEffect, useState } from 'react';
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
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import {
  useFonts,
  Manrope_400Regular,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';
import { auth, db } from '../../lib/firebase';

export default function EditarPerfilScreen({ navigation }: { navigation: any }) {
  const [nome, setNome] = useState<string>('');
  const [endereco, setEndereco] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [telefone, setTelefone] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  // Preenche o formulário com os dados atuais da clínica
  useEffect(() => {
    async function carregar(): Promise<void> {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      try {
        const snap = await getDoc(doc(db, 'clinicas', uid));
        if (snap.exists()) {
          const dados = snap.data();
          setNome(dados.nome ?? '');
          setEndereco(dados.endereco ?? '');
          setEmail(dados.email ?? '');
          setTelefone(dados.telefone ?? '');
        }
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível carregar os dados da clínica.');
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, []);

  async function handleSalvar(): Promise<void> {
    if (!nome.trim() || !endereco.trim()) {
      Alert.alert('Atenção', 'Nome e endereço são obrigatórios.');
      return;
    }
    if (!email.includes('@')) {
      Alert.alert('Atenção', 'Digite um e-mail válido.');
      return;
    }

    const uid = auth.currentUser?.uid;
    if (!uid) return;

    setSaving(true);
    try {
      // O CNPJ não aparece no formulário, então não é alterado
      await updateDoc(doc(db, 'clinicas', uid), {
        nome: nome.trim(),
        endereco: endereco.trim(),
        email: email.trim(),
        telefone: telefone.trim(),
      });
      Alert.alert('Sucesso', 'Dados atualizados.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar as alterações.');
    } finally {
      setSaving(false);
    }
  }

  // Envia o link de redefinição para o e-mail de login da conta
  async function handleRecuperarSenha(): Promise<void> {
    const emailLogin = auth.currentUser?.email;
    if (!emailLogin) return;

    try {
      await sendPasswordResetEmail(auth, emailLogin);
      Alert.alert('E-mail enviado', 'Verifique sua caixa de entrada para redefinir a senha.');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível enviar o e-mail de redefinição.');
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0E3D3A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Perfil da Clínica</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0E6B5C" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.label}>Nome da Clínica</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="medkit-outline" size={20} color="#5A6B69" />
            <TextInput
              style={styles.input}
              value={nome}
              onChangeText={setNome}
              placeholder="Nome da Clínica"
              placeholderTextColor="#9AA5A3"
              editable={!saving}
            />
          </View>

          <Text style={styles.label}>Endereço</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="location-outline" size={20} color="#5A6B69" />
            <TextInput
              style={styles.input}
              value={endereco}
              onChangeText={setEndereco}
              placeholder="Endereço"
              placeholderTextColor="#9AA5A3"
              editable={!saving}
            />
          </View>

          <Text style={styles.label}>E-mail</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={20} color="#5A6B69" />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="E-mail"
              placeholderTextColor="#9AA5A3"
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!saving}
            />
          </View>

          <Text style={styles.label}>Telefone</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="call-outline" size={20} color="#5A6B69" />
            <TextInput
              style={styles.input}
              value={telefone}
              onChangeText={setTelefone}
              placeholder="Telefone"
              placeholderTextColor="#9AA5A3"
              keyboardType="phone-pad"
              editable={!saving}
            />
          </View>

          <TouchableOpacity style={styles.recoverRow} onPress={handleRecuperarSenha}>
            <Ionicons name="refresh-circle-outline" size={20} color="#0E3D3A" />
            <Text style={styles.recoverText}>Recuperar Senha</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Rodapé fixo */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, (saving || loading) && styles.saveButtonDisabled]}
          onPress={handleSalvar}
          disabled={saving || loading}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Salvar Alterações</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FC' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

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

  content: { padding: 20 },

  label: {
    fontFamily: 'Manrope_400Regular',
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
    marginBottom: 20,
  },
  input: {
    flex: 1,
    fontFamily: 'Manrope_400Regular',
    fontSize: 15,
    color: '#1C2B2E',
    paddingVertical: 14,
  },

  recoverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  recoverText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: '#0E3D3A',
  },

  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E5E9',
    backgroundColor: '#F7F9FC',
  },
  saveButton: {
    backgroundColor: '#0E6B5C',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },
});