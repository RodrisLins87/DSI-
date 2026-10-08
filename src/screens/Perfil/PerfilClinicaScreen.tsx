import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { doc, getDoc } from 'firebase/firestore';
import {
  useFonts,
  Manrope_400Regular,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';
import { auth, db } from '../../lib/firebase';

interface Clinica {
  nome: string;
  cnpj: string;
  endereco: string;
  email: string;
  telefone: string;
}

export default function PerfilClinicaScreen({ navigation }: { navigation: any }) {
  const [clinica, setClinica] = useState<Clinica | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  // Recarrega sempre que a tela volta ao foco (útil depois de editar)
  useFocusEffect(
    useCallback(() => {
      async function carregar(): Promise<void> {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        try {
          const snap = await getDoc(doc(db, 'clinicas', uid));
          if (snap.exists()) {
            setClinica(snap.data() as Clinica);
          }
        } catch (error) {
          Alert.alert('Erro', 'Não foi possível carregar os dados da clínica.');
        } finally {
          setLoading(false);
        }
      }
      carregar();
    }, [])
  );

  if (!fontsLoaded) return null;

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0E3D3A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil da Clínica</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0E6B5C" />
        </View>
      ) : (
        <View style={styles.content}>
          {/* Card principal */}
          <View style={styles.card}>
            <View style={styles.avatar} />
            <Text style={styles.nome}>{clinica?.nome ?? 'Clínica'}</Text>
            <Text style={styles.cnpj}>CNPJ: {clinica?.cnpj}</Text>

            <View style={styles.enderecoBox}>
              <Ionicons name="location-outline" size={20} color="#5A6B69" />
              <Text style={styles.enderecoText}>{clinica?.endereco}</Text>
            </View>
          </View>

          {/* Dados de contato */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>DADOS DE CONTATO</Text>

            <Text style={styles.fieldLabel}>E-mail</Text>
            <View style={styles.fieldBox}>
              <Ionicons name="mail-outline" size={20} color="#5A6B69" />
              <Text style={styles.fieldText}>{clinica?.email}</Text>
            </View>

            <Text style={styles.fieldLabel}>Telefone</Text>
            <View style={styles.fieldBox}>
              <Ionicons name="call-outline" size={20} color="#5A6B69" />
              <Text style={styles.fieldText}>{clinica?.telefone || 'Não informado'}</Text>
            </View>
          </View>

          {/* Ações */}
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('EditarPerfil')}
          >
            <Ionicons name="pencil" size={18} color="#FFFFFF" />
            <Text style={styles.editButtonText}>Editar Perfil</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => navigation.navigate('ConfirmarExclusao')}
          >
            <Ionicons name="trash-outline" size={18} color="#A61B1B" />
            <Text style={styles.deleteButtonText}>Excluir Conta</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Barra inferior */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Home')}>
          <Ionicons name="home-outline" size={22} color="#5A6B69" />
          <Text style={styles.tabLabel}>Início</Text>
        </TouchableOpacity>
        <View style={styles.tabItem}>
          <Ionicons name="person" size={22} color="#0E6B5C" />
          <Text style={[styles.tabLabel, { color: '#0E6B5C' }]}>Perfil</Text>
        </View>
      </View>
    </View>
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

  content: { flex: 1, padding: 20 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E5E9',
    padding: 20,
    marginBottom: 18,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#EEF3FB',
    borderWidth: 2,
    borderColor: '#DCE7F5',
    alignSelf: 'center',
    marginBottom: 18,
  },
  nome: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 20,
    color: '#0E3D3A',
    textAlign: 'center',
    marginBottom: 4,
  },
  cnpj: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    color: '#5A6B69',
    textAlign: 'center',
    marginBottom: 16,
  },
  enderecoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#E2E5E9',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FBFCFD',
  },
  enderecoText: {
    flex: 1,
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    color: '#1C2B2E',
  },

  sectionLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    color: '#0E3D3A',
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  fieldLabel: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
    color: '#5A6B69',
    marginBottom: 6,
    marginLeft: 4,
  },
  fieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E5E9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: '#FBFCFD',
    marginBottom: 14,
  },
  fieldText: {
    flex: 1,
    fontFamily: 'Manrope_400Regular',
    fontSize: 15,
    color: '#1C2B2E',
  },

  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0E6B5C',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 12,
  },
  editButtonText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFE1DD',
    borderRadius: 12,
    paddingVertical: 16,
  },
  deleteButtonText: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 15,
    color: '#A61B1B',
  },

  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E5E9',
    backgroundColor: '#FFFFFF',
  },
  tabItem: { alignItems: 'center' },
  tabLabel: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
    color: '#5A6B69',
    marginTop: 2,
  },
});