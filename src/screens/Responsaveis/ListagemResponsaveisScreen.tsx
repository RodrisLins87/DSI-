
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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { onlyDigits } from '../../utils/masks';
import SwipeableRow from '../../utils/SwipeableRow';
import ConfirmDeleteModal from '../../utils/ConfirmDeleteModal';

interface Responsavel {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  clinicaId: string;
}

// Remove acentos e deixa o texto minúsculo para a busca.
const normalizar = (s: string): string =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

// "Maria Almeida Silva" -> "MA"
function iniciais(nome: string): string {
  const partes = (nome ?? '').trim().split(/\s+/).filter(Boolean);

  if (partes.length === 0) return '?';

  if (partes.length === 1) {
    return partes[0].slice(0, 2).toUpperCase();
  }

  return (partes[0][0] + partes[1][0]).toUpperCase();
}

// "123.456.789-00" -> "***.456.789-**"
function mascararCpf(cpf: string): string {
  const d = onlyDigits(cpf ?? '');

  if (d.length !== 11) return cpf ?? '';

  return `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**`;
}

// Espaço reservado para o ponto separador entre CPF e telefone.
const LARGURA_PONTO = 16;

function Detalhes({
  cpf,
  telefone,
}: {
  cpf: string;
  telefone: string;
}) {
  const [larguraCaixa, setLarguraCaixa] = useState<number>(0);
  const [larguraCpf, setLarguraCpf] = useState<number>(0);
  const [larguraTel, setLarguraTel] = useState<number>(0);

  const quebrou =
    larguraCaixa > 0 &&
    larguraCpf + larguraTel + LARGURA_PONTO > larguraCaixa;

  return (
    <View
      style={styles.cardDetalhes}
      onLayout={(e) => setLarguraCaixa(e.nativeEvent.layout.width)}
    >
      <View
        style={styles.detalhe}
        onLayout={(e) => setLarguraCpf(e.nativeEvent.layout.width)}
      >
        <MaterialCommunityIcons
          name="card-account-details-outline"
          size={14}
          color="#40484B"
        />
        <Text style={styles.detalheTexto}>{mascararCpf(cpf)}</Text>
      </View>

      <View style={[styles.ponto, quebrou && { opacity: 0 }]} />

      <View
        style={styles.detalhe}
        onLayout={(e) => setLarguraTel(e.nativeEvent.layout.width)}
      >
        <Ionicons name="call-outline" size={14} color="#40484B" />
        <Text style={styles.detalheTexto}>{telefone}</Text>
      </View>
    </View>
  );
}

export default function ListagemResponsaveisScreen() {
  const navigation = useNavigation<any>();

  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [busca, setBusca] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [paraExcluir, setParaExcluir] = useState<Responsavel | null>(null);
  const [excluindo, setExcluindo] = useState<boolean>(false);

  async function fetchResponsaveis(): Promise<void> {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, 'responsaveis'),
        where('clinicaId', '==', auth.currentUser.uid)
      );

      const snap = await getDocs(q);

      const lista = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Responsavel)
      );

      lista.sort((a, b) =>
        (a.nome ?? '').localeCompare(b.nome ?? '', 'pt-BR')
      );

      setResponsaveis(lista);
    } catch (error) {
      console.error('Erro ao buscar responsáveis:', error);
      Alert.alert('Erro', 'Não foi possível carregar os responsáveis.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // Recarrega a lista quando a tela recebe foco.
  useFocusEffect(
    useCallback(() => {
      fetchResponsaveis();
    }, [])
  );

  // Exclusão: deslizar o item -> confirmar -> Firestore.
  async function confirmarExclusao(): Promise<void> {
    if (!paraExcluir || !auth.currentUser) return;

    setExcluindo(true);

    try {
      // Não exclui responsáveis que ainda possuem pacientes vinculados.
      const vinculados = await getDocs(
        query(
          collection(db, 'pacientes'),
          where('clinicaId', '==', auth.currentUser.uid),
          where('responsavelId', '==', paraExcluir.id)
        )
      );

      if (!vinculados.empty) {
        setParaExcluir(null);

        Alert.alert(
          'Não é possível excluir',
          `${paraExcluir.nome} está vinculado a ${vinculados.size} paciente(s). ` +
            'Troque o responsável desses pacientes antes de excluir.'
        );

        return;
      }

      await deleteDoc(doc(db, 'responsaveis', paraExcluir.id));

      setResponsaveis((prev) =>
        prev.filter((r) => r.id !== paraExcluir.id)
      );

      setParaExcluir(null);
    } catch (error: any) {
      Alert.alert(
        'Erro ao excluir',
        error.message || 'Não foi possível excluir o responsável.'
      );
    } finally {
      setExcluindo(false);
    }
  }

  // Busca por nome ou pelos dígitos do CPF.
  const termo = normalizar(busca.trim());
  const termoDigitos = onlyDigits(busca);

  const filtrados = responsaveis.filter(
    (r) =>
      normalizar(r.nome ?? '').includes(termo) ||
      (termoDigitos.length > 0 &&
        onlyDigits(r.cpf ?? '').includes(termoDigitos))
  );

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.title}>Responsável</Text>

        <TouchableOpacity
          style={styles.addButton}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('FormularioResponsavel')}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Campo de busca */}
        <View style={styles.searchBox}>
          <Ionicons
            name="search"
            size={22}
            color="#40484B"
            style={styles.searchIcon}
          />

          <TextInput
            style={styles.searchInput}
            placeholder="Buscar responsável..."
            placeholderTextColor="#BFC8CB"
            value={busca}
            onChangeText={setBusca}
          />
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#006A66"
            style={{ marginTop: 40 }}
          />
        ) : (
          <FlatList
            data={filtrados}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchResponsaveis();
            }}
            renderItem={({ item }) => (
              <SwipeableRow onDelete={() => setParaExcluir(item)}>
                <TouchableOpacity
                  style={styles.card}
                  activeOpacity={0.7}
                  onPress={() =>
                    navigation.navigate('FormularioResponsavel', {
                      responsavelId: item.id,
                    })
                  }
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {iniciais(item.nome)}
                    </Text>
                  </View>

                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.nome}
                    </Text>

                    <Detalhes
                      cpf={item.cpf}
                      telefone={item.telefone}
                    />
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color="#BFC8CB"
                  />
                </TouchableOpacity>
              </SwipeableRow>
            )}
            ListEmptyComponent={
              <Text style={styles.empty}>
                {busca
                  ? 'Nenhum responsável encontrado para a busca.'
                  : 'Nenhum responsável cadastrado.'}
              </Text>
            }
          />
        )}
      </View>

      {/* Barra de navegação inferior */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.navigate('Home')}
        >
          <Ionicons name="home-outline" size={24} color="#006A66" />
          <Text style={[styles.tabLabel, { color: '#006A66' }]}>
            Início
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigation.navigate('Perfil')}
        >
          <Ionicons name="person" size={24} color="#40484B" />
          <Text style={styles.tabLabel}>Perfil</Text>
        </TouchableOpacity>
      </View>

      <ConfirmDeleteModal
        visible={paraExcluir !== null}
        title="Excluir Responsável?"
        message="Esta ação é irreversível. Todas as informações vinculadas a este responsável serão removidas permanentemente do sistema."
        loading={excluindo}
        onCancel={() => setParaExcluir(null)}
        onConfirm={confirmarExclusao}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FF',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 14,
    backgroundColor: '#F8F9FF',
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00353F',
  },

  addButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#006A66',
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    flex: 1,
    paddingHorizontal: 20,
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#BFC8CB',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 52,
    marginTop: 4,
    marginBottom: 20,
  },

  searchIcon: {
    marginRight: 10,
  },

  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#0B1C30',
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E7EAEF',
    paddingVertical: 18,
    paddingHorizontal: 14,
    marginBottom: 10,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5EDEE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  avatarText: {
    color: '#00353F',
    fontWeight: '600',
    fontSize: 18,
  },

  cardInfo: {
    flex: 1,
    marginRight: 6,
  },

  cardTitle: {
    fontSize: 16,
    color: '#0B1C30',
    marginBottom: 6,
  },

  cardDetalhes: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },

  detalhe: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  detalheTexto: {
    fontSize: 12,
    color: '#40484B',
    marginLeft: 4,
  },

  ponto: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#BFC8CB',
    marginHorizontal: 6,
  },

  empty: {
    textAlign: 'center',
    color: '#70787B',
    marginTop: 40,
  },

  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#BFC8CB',
    backgroundColor: '#F8F9FF',
  },

  tabItem: {
    alignItems: 'center',
    minWidth: 80,
  },

  tabLabel: {
    fontSize: 13,
    color: '#40484B',
    marginTop: 3,
  },
});
