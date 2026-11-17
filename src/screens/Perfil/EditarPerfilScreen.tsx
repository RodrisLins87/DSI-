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
import { MaterialIcons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { FONT } from '../../global/fonts';
import {
  COR,
  CabecalhoTela,
  Rotulo,
  RodapeConfirmar,
} from '../Consultas/components/AgendamentoCampos';

export default function EditarPerfilScreen({ navigation }: { navigation: any }) {
  const [nome, setNome] = useState<string>('');
  const [endereco, setEndereco] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [telefone, setTelefone] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

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
    // O rodapé padrão não bloqueia o toque, então a trava fica aqui
    if (loading || saving) return;

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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <CabecalhoTela
        titulo="Editar Perfil da Clínica"
        onVoltar={() => navigation.goBack()}
        desabilitado={saving}
      />

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={COR.botao} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Rotulo primeiro>Nome da Clínica</Rotulo>
          <View style={styles.campo}>
            <MaterialIcons name="add-box" size={22} color={COR.suave} />
            <TextInput
              style={styles.input}
              value={nome}
              onChangeText={setNome}
              placeholder="Nome da Clínica"
              placeholderTextColor={COR.placeholder}
              editable={!saving}
            />
          </View>

          <Rotulo>Endereço</Rotulo>
          <View style={styles.campo}>
            <MaterialIcons name="location-on" size={22} color={COR.suave} />
            <TextInput
              style={styles.input}
              value={endereco}
              onChangeText={setEndereco}
              placeholder="Endereço"
              placeholderTextColor={COR.placeholder}
              editable={!saving}
            />
          </View>

          <Rotulo>E-mail</Rotulo>
          <View style={styles.campo}>
            <MaterialIcons name="mail-outline" size={22} color={COR.suave} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="E-mail"
              placeholderTextColor={COR.placeholder}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!saving}
            />
          </View>

          <Rotulo>Telefone</Rotulo>
          <View style={styles.campo}>
            <MaterialIcons name="phone" size={22} color={COR.suave} />
            <TextInput
              style={styles.input}
              value={telefone}
              onChangeText={setTelefone}
              placeholder="Telefone"
              placeholderTextColor={COR.placeholder}
              keyboardType="phone-pad"
              editable={!saving}
            />
          </View>

          <TouchableOpacity
            style={styles.recoverRow}
            onPress={handleRecuperarSenha}
            disabled={saving}
          >
            <MaterialIcons name="lock-reset" size={20} color={COR.escuro} />
            <Text style={styles.recoverText}>Recuperar Senha</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      <RodapeConfirmar
        texto="SALVAR ALTERAÇÕES"
        pronto={!loading}
        salvando={saving}
        onPress={handleSalvar}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COR.fundo },

  scroll: { paddingHorizontal: 20, paddingTop: 17, paddingBottom: 28 },

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

  recoverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 28,
  },
  recoverText: {
    fontFamily: FONT.bold,
    fontSize: 12,
    letterSpacing: 0.55,
    color: COR.escuro,
  },
});