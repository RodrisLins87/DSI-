import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { getInitials } from '../../utils/masks';
import ConfirmDeleteModal from '../../utils/ConfirmDeleteModal';

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

export default function ListagemMedicosScreen() {
  const navigation = useNavigation<any>();

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
      <View style={styles.header}>
        <Text style={styles.title}>Médicos</Text>
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
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchMedicos();
          }}
          renderItem={({ item }) => (
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
                style={styles.deleteIconButton}
                activeOpacity={0.6}
                onPress={() => setMedicoParaExcluir(item)}
              >
                <Ionicons name="trash-outline" size={20} color="#BA1A1A" />
              </TouchableOpacity>

              <Ionicons name="chevron-forward" size={20} color="#8A9599" />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {busca ? 'Nenhum médico encontrado para a busca.' : 'Nenhum médico cadastrado.'}
            </Text>
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('FormularioMedico')}
      >
        <Ionicons name="add" size={22} color="#FFFFFF" />
        <Text style={styles.fabText}>Adicionar Médico</Text>
      </TouchableOpacity>

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
  container: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: '#F8F9FF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1A2E35' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#DDE3E6',
    borderRadius: 12,
    paddingHorizontal: 12,
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
    marginBottom: 10,
  },
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
  deleteIconButton: {
    padding: 8,
    marginRight: 4,
  },
  empty: { textAlign: 'center', color: '#8A9599', marginTop: 40 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F4C4A',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 28,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  fabText: { color: '#fff', fontWeight: '600', marginLeft: 6 },
});