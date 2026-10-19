import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Swipeable } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { getInitials } from '../../utils/masks';
import ConfirmDeleteModal from '../../utils/ConfirmDeleteModal';
import BarraNavegacao from '../../utils/BarraNavegacao';
import { FONT } from '../../global/fonts';

interface Medico {
  id: string;
  nome: string;
  crm: string;
  especialidade: string;
  telefone: string;
  clinicaId: string;
}

const normalizar = (s: string): string =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

// Arrastar o card para a esquerda mostra a lixeira (mesmo esquema da ListagemConsultasScreen)
function CartaoArrastavel({ children, onExcluir }: { children: React.ReactNode; onExcluir: () => void }) {
  const ref = useRef<Swipeable>(null);

  function renderAcao(progress: Animated.AnimatedInterpolation<number>) {
    const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [72, 0] });
    return (
      <TouchableOpacity
        style={styles.acaoExcluir}
        activeOpacity={0.85}
        onPress={() => {
          ref.current?.close();
          onExcluir();
        }}
      >
        <Animated.View style={{ transform: [{ translateX }] }}>
          <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.espacoEntreCards}>
      <Swipeable ref={ref} renderRightActions={renderAcao} overshootRight={false} rightThreshold={40}>
        {children}
      </Swipeable>
    </View>
  );
}

export default function ListagemMedicosScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [busca, setBusca] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [medicoParaExcluir, setMedicoParaExcluir] = useState<Medico | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  async function fetchMedicos(): Promise<void> {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }
    try {
      const q = query(
        collection(db, 'medicos'),
        where('clinicaId', '==', auth.currentUser.uid)
      );
      const snap = await getDocs(q);
      const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Medico));
      lista.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
      setMedicos(lista);
    } catch (error) {
      console.error('Erro ao buscar médicos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      fetchMedicos();
    }, [])
  );

 async function handleConfirmDelete(): Promise<void> {
  if (!medicoParaExcluir) return;

  setDeleting(true);
  try {
    const clinicaId = auth.currentUser?.uid;
    const qConsultas = query(
      collection(db, 'consultas'),
      where('clinicaId', '==', clinicaId),
      where('medicoId', '==', medicoParaExcluir.id)
    );
    const snapConsultas = await getDocs(qConsultas);

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const consultasAtivas = snapConsultas.docs.filter((d) => {
      const c = d.data();
      if (c.status === 'cancelada') return false;
      const partes = (c.data ?? '').split('/');
      if (partes.length !== 3) return false;
      const dataConsulta = new Date(Number(partes[2]), Number(partes[1]) - 1, Number(partes[0]));
      return dataConsulta >= hoje;
    });

    if (consultasAtivas.length > 0) {
      setMedicoParaExcluir(null);
      Alert.alert(
        'Não é possível excluir',
        `O(A) Dr(a). ${medicoParaExcluir.nome} possui ${consultasAtivas.length} consulta(s) futura(s) agendada(s). Reagende ou cancele as consultas antes de excluir o cadastro.`
      );
      return;
    }

    await deleteDoc(doc(db, 'medicos', medicoParaExcluir.id));
    setMedicos((prev) => prev.filter((m) => m.id !== medicoParaExcluir.id));
    setMedicoParaExcluir(null);
    Alert.alert('Sucesso', 'Médico excluído com sucesso!');
  } catch (error: any) {
    Alert.alert('Erro ao excluir', error.message);
  } finally {
    setDeleting(false);
  }
}

  const termo = normalizar(busca.trim());
  const filtrados = medicos.filter(
    (m) =>
      normalizar(m.nome ?? '').includes(termo) ||
      normalizar(m.especialidade ?? '').includes(termo)
  );

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerLinha}>
          <Text style={styles.title}>Médicos</Text>
          <TouchableOpacity
            style={styles.addButton}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('FormularioMedico')}
          >
            <MaterialIcons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color="#8A9599" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nome ou especialidade"
          placeholderTextColor="#8A9599"
          value={busca}
          onChangeText={setBusca}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#006A66" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtrados}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lista}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchMedicos();
          }}
          renderItem={({ item }) => (
            <CartaoArrastavel onExcluir={() => setMedicoParaExcluir(item)}>
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('FormularioMedico', { medicoId: item.id })}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{getInitials(item.nome)}</Text>
                </View>

                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{item.nome}</Text>
                  <Text style={styles.cardSubtitle}>{item.especialidade}</Text>
                  <Text style={styles.cardCrm}>{item.crm}</Text>
                </View>

                <TouchableOpacity
                  style={styles.calendarIconButton}
                  activeOpacity={0.6}
                  onPress={() => navigation.navigate('GerenciarAgenda', { medicoId: item.id })}
                >
                  <Ionicons name="calendar-outline" size={22} color="#006A66" />
                </TouchableOpacity>

                <Ionicons name="chevron-forward" size={20} color="#8A9599" />
              </TouchableOpacity>
            </CartaoArrastavel>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {busca ? 'Nenhum médico encontrado para a busca.' : 'Nenhum médico cadastrado.'}
            </Text>
          }
        />
      )}

      <BarraNavegacao ativa="inicio" />

      <ConfirmDeleteModal
        visible={medicoParaExcluir !== null}
        title="Excluir Médico?"
        message={`Esta ação é irreversível. O médico ${medicoParaExcluir?.nome ?? ''} será removido permanentemente do sistema.`}
        onCancel={() => setMedicoParaExcluir(null)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FF' },
  // cabeçalho igual ao da ListagemConsultasScreen
  header: {
    backgroundColor: '#F8F9FF',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    zIndex: 1,
  },
  headerLinha: {
    height: 76,
    paddingTop: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontFamily: FONT.semibold, fontSize: 24, lineHeight: 32, color: '#00353F' },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#006A66',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lista: { paddingHorizontal: 20, paddingBottom: 24 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#DDE3E6',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 14,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, color: '#1A2E35' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  espacoEntreCards: { marginBottom: 10 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0F4C4A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A2E35' },
  cardSubtitle: { color: '#5B6B70', marginTop: 2 },
  cardCrm: { color: '#8A9599', marginTop: 2, fontSize: 12 },
  calendarIconButton: {
    padding: 8,
    marginRight: 4,
  },
  acaoExcluir: {
    width: 72,
    marginLeft: 8,
    borderRadius: 12,
    backgroundColor: '#BA1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { textAlign: 'center', color: '#8A9599', marginTop: 40 },
});