import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { FONT } from '../../global/fonts';
import { COR, CabecalhoTela } from '../Consultas/components/AgendamentoCampos';

interface Clinica {
  nome: string;
  cnpj: string;
  endereco: string;
  email: string;
  telefone: string;
}

export default function PerfilClinicaScreen({ navigation }: { navigation: any }) {
  const insets = useSafeAreaInsets();
  const [clinica, setClinica] = useState<Clinica | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

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

  return (
    <View style={styles.container}>
      <CabecalhoTela titulo="Perfil da Clínica" onVoltar={() => navigation.goBack()} />

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={COR.botao} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Card principal */}
          <View style={styles.card}>
            <View style={styles.avatar}>
              <MaterialIcons name="business" size={48} color={COR.destaqueTexto} />
            </View>
            <Text style={styles.nome}>{clinica?.nome ?? 'Clínica'}</Text>
            <Text style={styles.cnpj}>CNPJ: {clinica?.cnpj}</Text>

            <View style={styles.enderecoBox}>
              <MaterialIcons name="location-on" size={20} color={COR.placeholder} />
              <Text style={styles.enderecoText}>{clinica?.endereco}</Text>
            </View>
          </View>

          {/* Dados de contato */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>DADOS DE CONTATO</Text>

            <Text style={styles.fieldLabel}>E-mail</Text>
            <View style={styles.fieldBox}>
              <MaterialIcons name="mail-outline" size={20} color={COR.placeholder} />
              <Text style={styles.fieldText}>{clinica?.email}</Text>
            </View>

            <Text style={styles.fieldLabel}>Telefone</Text>
            <View style={[styles.fieldBox, { marginBottom: 0 }]}>
              <MaterialIcons name="phone" size={20} color={COR.placeholder} />
              <Text style={styles.fieldText}>{clinica?.telefone || 'Não informado'}</Text>
            </View>
          </View>

          {/* Ações */}
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('EditarPerfil')}
          >
            <MaterialIcons name="edit" size={18} color="#FFFFFF" />
            <Text style={styles.editButtonText}>EDITAR PERFIL</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => navigation.navigate('ConfirmarExclusao')}
          >
            <MaterialIcons name="delete-outline" size={18} color="#BA1A1A" />
            <Text style={styles.deleteButtonText}>EXCLUIR CONTA</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Barra inferior */}
      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Home')}>
          <MaterialIcons name="home" size={24} color={COR.placeholder} />
          <Text style={styles.tabLabel}>Início</Text>
        </TouchableOpacity>
        <View style={styles.tabItem}>
          <MaterialIcons name="person" size={24} color="#006A66" />
          <Text style={[styles.tabLabel, { color: '#006A66', fontFamily: FONT.semibold }]}>
            Perfil
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COR.fundo },

  content: { paddingHorizontal: 20, paddingTop: 17, paddingBottom: 28 },

  card: {
    backgroundColor: COR.branco,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COR.borda,
    padding: 20,
    marginBottom: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COR.destaque,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  nome: {
    fontFamily: FONT.semibold,
    fontSize: 20,
    color: COR.escuro,
    textAlign: 'center',
    marginBottom: 4,
  },
  cnpj: {
    fontFamily: FONT.regular,
    fontSize: 14,
    color: COR.suave,
    textAlign: 'center',
    marginBottom: 16,
  },
  enderecoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: COR.borda,
    borderRadius: 8,
    padding: 12,
    backgroundColor: COR.branco,
  },
  enderecoText: {
    flex: 1,
    fontFamily: FONT.regular,
    fontSize: 14,
    color: COR.texto,
  },

  sectionLabel: {
    fontFamily: FONT.bold,
    fontSize: 12,
    color: COR.escuro,
    letterSpacing: 0.55,
    marginBottom: 14,
  },
  fieldLabel: {
    fontFamily: FONT.regular,
    fontSize: 12,
    color: COR.suave,
    marginBottom: 7,
  },
  fieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: COR.borda,
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 48,
    backgroundColor: COR.branco,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  fieldText: {
    flex: 1,
    fontFamily: FONT.regular,
    fontSize: 14,
    color: COR.texto,
  },

  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COR.botao,
    borderRadius: 8,
    height: 56,
    marginBottom: 12,
  },
  editButtonText: {
    fontFamily: FONT.bold,
    fontSize: 12,
    letterSpacing: 0.55,
    color: '#FFFFFF',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFDAD6',
    borderRadius: 8,
    height: 56,
  },
  deleteButtonText: {
    fontFamily: FONT.bold,
    fontSize: 12,
    letterSpacing: 0.55,
    color: '#BA1A1A',
  },

  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COR.borda,
    backgroundColor: COR.branco,
  },
  tabItem: { alignItems: 'center' },
  tabLabel: {
    fontFamily: FONT.regular,
    fontSize: 12,
    color: COR.placeholder,
    marginTop: 2,
  },
});