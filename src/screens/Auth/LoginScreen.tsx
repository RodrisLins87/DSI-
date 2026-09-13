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
      <TouchableOpacity onPress={() => navigation.navigate('RecuperarSenha')}>
        <Text>Esqueci minha senha</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Cadastro')}>
        <Text>Não tem conta? Criar conta</Text>
      </TouchableOpacity>
    </View>
  );
}

const COLORS = {
  teal900: '#0d3b3e',
  teal800: '#124a4d',
  teal600: '#1a6b6f',
  teal050: '#e6f4f2',
  ink: '#1c2b2e',
  muted: '#6b7a7d',
  placeholder: '#9aa6a8',
  border: '#e3e7e8',
  bg: '#eef1f4',
  card: '#ffffff',
  inputBg: '#f7f9fa',
  error: '#9c2b2b',
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.card,
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 32,
    shadowColor: '#10282a',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },

  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.teal050,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 24,
  },
  logoImage: {
    width: 160,
    height: 48,
  },

  title: {
    textAlign: 'center',
    fontSize: 21,
    fontWeight: '700',
    color: COLORS.teal900,
    marginBottom: 6,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 14,
    color: COLORS.muted,
    marginBottom: 24,
  },

  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.ink,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    paddingHorizontal: 14,
    fontSize: 14,
    color: COLORS.ink,
  },
  inputWithToggle: {
    paddingRight: 4,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.teal600,
  },
  fieldError: {
    marginTop: 6,
    fontSize: 12,
    color: COLORS.error,
  },

  forgotRow: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.teal800,
  },

  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.teal900,
    borderRadius: 12,
    paddingVertical: 15,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginVertical: 22,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontSize: 13,
    color: COLORS.placeholder,
  },

  signupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signupText: {
    fontSize: 14,
    color: COLORS.muted,
  },
  signupLink: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.teal800,
  },
});
