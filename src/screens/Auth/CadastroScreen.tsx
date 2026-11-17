import React, { useState } from "react";
import {
  Text,
  StyleSheet,
  View,
  Image,
  TextInput,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Logo from '../../assets/logo3.png'
import { useFonts, Manrope_400Regular } from '@expo-google-fonts/manrope';
import { themas } from "../../global/themes";
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';

export default function CadastroScreen({ navigation }: { navigation: any }) {
  useFonts({ Manrope_400Regular });

  // Campos do formulário
  const [nome, setNome] = useState<string>('');
  const [cnpj, setCnpj] = useState<string>('');
  const [endereco, setEndereco] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [telefone, setTelefone] = useState<string>('');
  const [senha, setSenha] = useState<string>('');
  const [confirmarSenha, setConfirmarSenha] = useState<string>('');

  // Controle de visibilidade das senhas
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [confirmarSenhaVisivel, setConfirmarSenhaVisivel] = useState(false);

  // Controle de carregamento do botão
  const [loading, setLoading] = useState<boolean>(false);

  async function handleCadastro(): Promise<void> {
    // Validações básicas
    if (!nome || !cnpj || !endereco || !email || !telefone || !senha || !confirmarSenha) {
      Alert.alert('Campos obrigatórios', 'Por favor, preencha todos os campos.');
      return;
    }

    if (senha !== confirmarSenha) {
      Alert.alert('Erro', 'As senhas não coincidem.');
      return;
    }

    if (senha.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }

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
        telefone,
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
    <View style={styles.container}>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={themas.colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cadastro</Text>
      </View>

      <ScrollView>
        <View style={styles.TopBox}>
          <Image
            source={Logo}
            style={styles.imagem}
            resizeMode="contain"
          />
        </View>
        <View style={styles.MidBox}>
          <Text style={styles.titleinput}>Nome da Clínica</Text>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="hospital-box-outline" size={18} color="#8A9599" style={styles.icon} />
            <TextInput
              style={styles.inputText}
              placeholder="Ex: Clínica Saúde Integrada"
              placeholderTextColor="#8A9599"
              value={nome}
              onChangeText={setNome}
            />
          </View>

          <Text style={styles.titleinput}>CNPJ</Text>
          <View style={styles.inputContainer}>
            <Feather name="briefcase" size={18} color="#8A9599" style={styles.icon} />
            <TextInput
              style={styles.inputText}
              placeholder="00.000.000/0000-00"
              placeholderTextColor="#8A9599"
              value={cnpj}
              onChangeText={setCnpj}
              keyboardType="numeric"
            />
          </View>

          <Text style={styles.titleinput}>Endereço</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="location-outline" size={18} color="#8A9599" style={styles.icon} />
            <TextInput
              style={styles.inputText}
              placeholder="Rua, Número, Bairro, Cidade - UF"
              placeholderTextColor="#8A9599"
              value={endereco}
              onChangeText={setEndereco}
            />
          </View>

          <Text style={styles.titleinput}>E-mail</Text>
          <View style={styles.inputContainer}>
            <Feather name="mail" size={18} color="#8A9599" style={styles.icon} />
            <TextInput
              style={styles.inputText}
              placeholder="contato@clinica.com.br"
              placeholderTextColor="#8A9599"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <Text style={styles.titleinput}>Telefone</Text>
          <View style={styles.inputContainer}>
            <Feather name="phone" size={18} color="#8A9599" style={styles.icon} />
            <TextInput
              style={styles.inputText}
              placeholder="(00) 0000-0000"
              placeholderTextColor="#8A9599"
              value={telefone}
              onChangeText={setTelefone}
              keyboardType="phone-pad"
            />
          </View>

          <Text style={styles.titleinput}>Senha</Text>
          <View style={styles.inputContainer}>
            <Feather name="lock" size={18} color="#8A9599" style={styles.icon} />
            <TextInput
              style={styles.inputText}
              placeholder="••••••••"
              placeholderTextColor="#8A9599"
              secureTextEntry={!senhaVisivel}
              value={senha}
              onChangeText={setSenha}
            />
            <TouchableOpacity onPress={() => setSenhaVisivel(!senhaVisivel)}>
              <Feather name={senhaVisivel ? "eye" : "eye-off"} size={18} color="#8A9599" />
            </TouchableOpacity>
          </View>

          <Text style={styles.titleinput}>Confirmar senha</Text>
          <View style={styles.inputContainer}>
            <Feather name="lock" size={18} color="#8A9599" style={styles.icon} />
            <TextInput
              style={styles.inputText}
              placeholder="••••••••"
              placeholderTextColor="#8A9599"
              secureTextEntry={!confirmarSenhaVisivel}
              value={confirmarSenha}
              onChangeText={setConfirmarSenha}
            />
            <TouchableOpacity onPress={() => setConfirmarSenhaVisivel(!confirmarSenhaVisivel)}>
              <Feather name={confirmarSenhaVisivel ? "eye" : "eye-off"} size={18} color="#8A9599" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.horizontalline}></View>
        <View style={styles.BottomBox}>
          <TouchableOpacity
            style={[styles.CreateAccountButton, loading && styles.CreateAccountButtonDisabled]}
            onPress={handleCadastro}
            disabled={loading}
          >
            <Text style={styles.CreateAccountButtonText}>
              {loading ? 'Criando...' : 'Criar Conta'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLinkContainer}>
            <Text style={styles.loginLinkText}>Já tem conta? Entrar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',

  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: '#F8F9FF',
  },
  headerTitle: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#006A66',
    marginLeft: 15,
  },
  imagem: {
    width: 200,
    justifyContent: 'center',
    alignContent: 'center',
  },

  TopBox: {
    height: Dimensions.get('window').height / 5,
    width: '100%',
    backgroundColor: '#F8F9FF',
    justifyContent: 'center',
    alignItems: 'center',

  },
  MidBox: {
    width: '100%',
    backgroundColor: '#F8F9FF',
    paddingHorizontal: 25,

  },
  BottomBox: {
    marginTop: 20,
    width: '100%',
    backgroundColor: '#F8F9FF',
    paddingHorizontal: 25,
    paddingBottom: 40,
    alignItems: 'center',

  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderColor: '#BFC8CB',
    width: 350,
    height: 50,
    flexGrow: 0,
    flexShrink: 0,
    alignSelf: 'stretch',
    borderWidth: 2,
    borderRadius: 8,
  },

  icon: {
    marginRight: 10,
  },

  inputText: {
    flex: 1,
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
    textAlignVertical: 'center',
  },

  titleinput: {
    fontFamily: 'Manrope_400Regular',
    marginLeft: 3,
    marginBottom: 4,
    color: themas.colors.black,
    marginTop: 20,
    fontSize: 12
  },

  CreateAccountButton: {
    width: 350,
    height: 56,
    backgroundColor: '#006A66',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  CreateAccountButtonDisabled: {
    opacity: 0.6,
  },

  CreateAccountButtonText: {
    color: 'white',
    fontFamily: 'Manrope_400Regular',
    fontSize: 16,
    textAlign: 'center',
  },

  loginLinkContainer: {
    marginTop: 16,
  },

  loginLinkText: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    color: themas.colors.black,
    textAlign: 'center',
  },

  horizontalline: {
    width: '100%',
    height: 0,
    borderWidth: 1,
    borderColor: '#D3E4FE',
    marginTop: 40

  },

});
