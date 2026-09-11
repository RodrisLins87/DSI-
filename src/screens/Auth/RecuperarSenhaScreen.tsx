import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../lib/firebase';

export default function RecuperarSenhaScreen({ navigation }: { navigation: any }) {
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  async function handleEnviarLink(): Promise<void> {
    if (!email.trim()) {
      Alert.alert('Atenção', 'Digite seu e-mail cadastrado.');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert(
        'E-mail enviado',
        'Verifique sua caixa de entrada para redefinir sua senha.'
      );
      navigation.goBack();
    } catch (error: any) {
      // O Firebase retorna códigos de erro específicos, tipo 'auth/user-not-found'
      Alert.alert('Erro', 'Não foi possível enviar o link. Confira o e-mail digitado.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#0E3D3A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>VittaFlow</Text>
        <View style={{ width: 26 }} />
        {/* ↑ espaço vazio do mesmo tamanho do ícone, só pra centralizar o título */}
      </View>

      <View style={styles.content}>
        {/* Ícone do cadeado */}
        <View style={styles.iconCircle}>
          <Ionicons name="lock-closed" size={36} color="#0E3D3A" />
        </View>

        <Text style={styles.title}>Recuperar Senha</Text>
        <Text style={styles.subtitle}>
          Digite seu e-mail cadastrado e enviaremos um link para redefinir sua senha
        </Text>

        {/* Card do formulário */}
        <View style={styles.card}>
          <Text style={styles.label}>E-mail cadastrado</Text>
          <TextInput
            style={styles.input}
            placeholder="seu.email@exemplo.com"
            placeholderTextColor="#9AA5A3"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>
      </View>

      {/* Rodapé fixo */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleEnviarLink}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.buttonText}>Enviar link de redefinição</Text>
              <Ionicons name="mail" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.linkText}>Voltar para o login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E5E9',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0E3D3A',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DCE7E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0E3D3A',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#5A6B69',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E5E9',
  },
  label: {
    fontSize: 14,
    color: '#0E3D3A',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D5DAD9',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0E3D3A',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#0E6B5C',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  linkText: {
    color: '#0E6B5C',
    fontSize: 14,
    textAlign: 'center',
  },
});