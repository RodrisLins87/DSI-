import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import SwipeableRow from '../../utils/SwipeableRow';
import ConfirmDeleteModal from '../../utils/ConfirmDeleteModal';
import BarraNavegacao from '../../utils/BarraNavegacao';

interface Paciente {
  id: string;
  nomeCompleto: string;
  cpf: string;
  telefone: string;
}

// Esconde os 3 primeiros dígitos do CPF na listagem (ex: ***.456.789-00).
// Não existe em utils/masks.ts (lá só tem máscara de digitação), por isso fica aqui.
function mascararCpf(cpf: string): string {
  if (!cpf || cpf.length < 4) return cpf;
  return `***.${cpf.slice(4)}`;
}

export default function ListagemPacientesScreen({ navigation }: { navigation: any }) {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [busca, setBusca] = useState('');
  const [pacienteParaExcluir, setPacienteParaExcluir] = useState<Paciente | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  async function fetchPacientes(): Promise<void> {
    const clinicaId = auth.currentUser?.uid;
    if (!clinicaId) return;
    const q = query(collection(db, 'pacientes'), where('clinicaId', '==', clinicaId));
    const snap = await getDocs(q);
    setPacientes(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Paciente)));
  }

  useFocusEffect(
    useCallback(() => {
      fetchPacientes();
    }, []),
  );

  const filtrados = pacientes.filter(
    (p) =>
      p.nomeCompleto?.toLowerCase().includes(busca.toLowerCase()) ||
      p.cpf?.replace(/\D/g, '').includes(busca.replace(/\D/g, '')),
  );

  function iniciais(nome: string): string {
    return nome
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase();
  }

  async function confirmarExclusao(): Promise<void> {
    if (!pacienteParaExcluir) return;
    setExcluindo(true);
    try {
      await deleteDoc(doc(db, 'pacientes', pacienteParaExcluir.id));
      setPacientes((atuais) => atuais.filter((p) => p.id !== pacienteParaExcluir.id));
      setPacienteParaExcluir(null);
    } catch {
      // Mantém o modal aberto para o usuário tentar de novo, se quiser.
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* Conteúdo da tela (o padding fica aqui para a barra de navegação ocupar a largura toda) */}
      <View style={styles.conteudo}>
        <View style={styles.header}>
          <Text style={styles.title}>Pacientes</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('FormularioPaciente')}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nome ou CPF"
            value={busca}
            onChangeText={setBusca}
          />
        </View>

        <FlatList
          data={filtrados}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SwipeableRow onDelete={() => setPacienteParaExcluir(item)}>
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('FormularioPaciente', { pacienteId: item.id })}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarTexto}>{iniciais(item.nomeCompleto)}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardNome} numberOfLines={1}>
                    {item.nomeCompleto}
                  </Text>
                  <View style={styles.cardLinha}>
                    <Text style={styles.cardSub}>{mascararCpf(item.cpf)}</Text>
                  </View>
                  <View style={styles.cardLinha}>
                    <Ionicons name="call-outline" size={13} color="#5B6B70" />
                    <Text style={[styles.cardSub, { marginLeft: 4 }]}>{item.telefone}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#8A9599" />
              </TouchableOpacity>
            </SwipeableRow>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Nenhum paciente encontrado.</Text>}
        />
      </View>

      {/* Rodapé de navegação (Início / Perfil), igual ao protótipo */}
      <BarraNavegacao ativa="inicio" />

      <ConfirmDeleteModal
        visible={pacienteParaExcluir !== null}
        title="Excluir Paciente?"
        message="Ao excluir este paciente, todos os dependentes, laudos médicos e consultas vinculados também serão removidos permanentemente. Esta ação não pode ser desfeita."
        onCancel={() => setPacienteParaExcluir(null)}
        onConfirm={confirmarExclusao}
        loading={excluindo}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FF' },
  conteudo: { flex: 1, padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1A2E35' },
  addButton: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#0F4C4A', alignItems: 'center', justifyContent: 'center' },
  addButtonText: { fontSize: 22, fontWeight: '600', color: '#FFFFFF', lineHeight: 24 },
  searchBox: { marginBottom: 14 },
  searchInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#DDE3E6', borderRadius: 12, padding: 12, color: '#1A2E35' },

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
    backgroundColor: '#D3E4FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarTexto: { fontWeight: '700', color: '#00353F' },
  cardInfo: { flex: 1 },
  cardNome: { fontSize: 16, fontWeight: 'bold', color: '#1A2E35' },
  cardLinha: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  cardSub: { color: '#5B6B70', fontSize: 13 },

  empty: { textAlign: 'center', color: '#8A9599', marginTop: 40 },
});