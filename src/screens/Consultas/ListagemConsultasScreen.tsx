import React, { useCallback, useRef, useState } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { Swipeable } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { STATUS_STYLES } from '../../utils/statusStyles';
import { FONT } from '../../global/fonts';
import CancelarConsultaModal from './CancelarConsultaModal';
import BarraNavegacao from '../../utils/BarraNavegacao';

interface Consulta {
  id: string;
  pacienteId: string;
  medicoId: string;
  data: string; // "dd/mm/aaaa"
  horario: string; // "HH:mm"
  status: string;
  pacienteNome?: string;
  medicoNome?: string;
  medicoEspecialidade?: string;
}

const MESES_CURTOS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// "18/10/2023" -> "18 Out 2023"
function dataCurta(data: string): string {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(data ?? '');
  if (!m) return data ?? '';
  return `${m[1]} ${MESES_CURTOS[Number(m[2]) - 1]} ${m[3]}`;
}

// "18/10/2023" + "09:00" -> "202310180900" (serve para ordenar: mais recentes primeiro)
function chaveOrdenacao(c: Consulta): string {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(c.data ?? '');
  const dia = m ? `${m[3]}${m[2]}${m[1]}` : '00000000';
  return dia + (c.horario ?? '').replace(':', '');
}

// remove acentos e deixa minúsculo para a busca
const normalizar = (s: string): string =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

// ---------------------------------------------------------------
// Arrastar o card para a esquerda revela o botão "cancelar consulta"
// ---------------------------------------------------------------
function CartaoArrastavel({
  children,
  podeCancelar,
  onCancelar,
}: {
  children: React.ReactNode;
  podeCancelar: boolean;
  onCancelar: () => void;
}) {
  const ref = useRef<Swipeable>(null);

  if (!podeCancelar) return <View style={styles.espacoEntreCards}>{children}</View>;

  function renderAcao(progress: Animated.AnimatedInterpolation<number>) {
    const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [72, 0] });
    return (
      <TouchableOpacity
        style={styles.acaoCancelar}
        activeOpacity={0.85}
        onPress={() => {
          ref.current?.close();
          onCancelar();
        }}
      >
        <Animated.View style={{ transform: [{ translateX }] }}>
          <MaterialIcons name="event-busy" size={24} color="#FFFFFF" />
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

export default function ListagemConsultasScreen({ navigation }: { navigation: any }) {
  const insets = useSafeAreaInsets();

  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [especialidades, setEspecialidades] = useState<Record<string, string>>({});
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);

  const [paraCancelar, setParaCancelar] = useState<Consulta | null>(null);
  const [cancelando, setCancelando] = useState(false);

  async function fetchConsultas(): Promise<void> {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }
    try {
      const clinicaId = auth.currentUser.uid;
      const [consultasSnap, medicosSnap] = await Promise.all([
        getDocs(query(collection(db, 'consultas'), where('clinicaId', '==', clinicaId))),
        getDocs(query(collection(db, 'medicos'), where('clinicaId', '==', clinicaId))),
      ]);
      // consultas antigas podem não ter a especialidade salva: busca pelo cadastro do médico
      const mapa: Record<string, string> = {};
      medicosSnap.docs.forEach((d) => {
        mapa[d.id] = (d.data() as any).especialidade ?? '';
      });
      setEspecialidades(mapa);

      const lista = consultasSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Consulta));
      lista.sort((a, b) => chaveOrdenacao(b).localeCompare(chaveOrdenacao(a)));
      setConsultas(lista);
    } catch (error) {
      console.error('Erro ao buscar consultas:', error);
    } finally {
      setLoading(false);
    }
  }

  // recarrega sempre que a tela ganhar foco (ex.: ao voltar de Nova Consulta ou Reagendar)
  useFocusEffect(
    useCallback(() => {
      fetchConsultas();
    }, []),
  );

  // ---------- Cancelamento (swipe -> modal -> Firestore) ----------
  async function confirmarCancelamento(): Promise<void> {
    if (!paraCancelar) return;
    setCancelando(true);
    try {
      await updateDoc(doc(db, 'consultas', paraCancelar.id), {
        status: 'cancelada',
        canceladaEm: serverTimestamp(),
      });
      const id = paraCancelar.id;
      setConsultas((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'cancelada' } : c)));
      setParaCancelar(null);
    } catch {
      Alert.alert('Erro', 'Não foi possível cancelar a consulta.');
    } finally {
      setCancelando(false);
    }
  }

  function abrirConsulta(c: Consulta) {
    if (c.status === 'cancelada' || c.status === 'realizada') {
      Alert.alert('Consulta encerrada', `Esta consulta já está ${c.status} e não pode ser reagendada.`);
      return;
    }
    navigation.navigate('ReagendarConsulta', { consultaId: c.id });
  }

  const subtitulo = (c: Consulta): string => {
    const medico = c.medicoNome ?? c.medicoId;
    const especialidade = c.medicoEspecialidade || especialidades[c.medicoId] || '';
    if (!especialidade) return medico;
    return `${medico} • ${especialidade}`;
  };

  const termo = normalizar(busca.trim());
  const filtradas = consultas.filter(
    (c) =>
      normalizar(c.pacienteNome ?? c.pacienteId ?? '').includes(termo) ||
      normalizar(c.medicoNome ?? c.medicoId ?? '').includes(termo),
  );

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerLinha}>
          <Text style={styles.title}>Consulta</Text>
          <TouchableOpacity
            style={styles.addButton}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('NovaConsulta')}
          >
            <MaterialIcons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Busca */}
      <View style={styles.searchBox}>
        <MaterialIcons name="search" size={24} color="#70787B" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar paciente ou médico"
          placeholderTextColor="#6B7280"
          value={busca}
          onChangeText={setBusca}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#006A66" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtradas}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const s = STATUS_STYLES[item.status] ?? STATUS_STYLES.pendente;
            const podeCancelar = item.status === 'pendente' || item.status === 'confirmada';
            return (
              <CartaoArrastavel podeCancelar={podeCancelar} onCancelar={() => setParaCancelar(item)}>
                <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={() => abrirConsulta(item)}>
                  <View style={styles.cardTopo}>
                    <View style={styles.cardTextos}>
                      <Text style={styles.cardNome}>{item.pacienteNome ?? item.pacienteId}</Text>
                      <Text style={styles.cardSubtitulo}>{subtitulo(item)}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: s.bg }]}>
                      <Text style={[styles.badgeTexto, { color: s.text }]}>{s.label}</Text>
                    </View>
                  </View>

                  <View style={styles.divisor} />

                  <View style={styles.cardRodape}>
                    <View style={[styles.iconeCaixa, { width: 14 }]}>
                      <MaterialCommunityIcons name="calendar-today-outline" size={18} color="#40484B" />
                    </View>
                    <Text style={[styles.rodapeTexto, { marginLeft: 6 }]}>{dataCurta(item.data)}</Text>
                    <View style={[styles.iconeCaixa, { width: 15, marginLeft: 16 }]}>
                      <MaterialIcons name="schedule" size={18} color="#40484B" />
                    </View>
                    <Text style={[styles.rodapeTexto, { marginLeft: 6 }]}>{item.horario}</Text>
                  </View>
                </TouchableOpacity>
              </CartaoArrastavel>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.vazio}>
              {busca ? 'Nenhuma consulta encontrada para a busca.' : 'Nenhuma consulta agendada.'}
            </Text>
          }
        />
      )}

      <BarraNavegacao ativa="inicio" />

      <CancelarConsultaModal
        visible={paraCancelar !== null}
        loading={cancelando}
        onManter={() => setParaCancelar(null)}
        onCancelar={confirmarCancelamento}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FF' },

  // cabeçalho (76 de altura + sombra leve)
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

  // busca
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 24,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BFC8CB',
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontFamily: FONT.regular,
    fontSize: 16,
    color: '#0B1C30',
  },

  // lista e cards
  lista: { paddingHorizontal: 20, paddingBottom: 24 },
  espacoEntreCards: { marginBottom: 16 },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BFC8CB',
    borderRadius: 8,
    paddingTop: 16,
    paddingBottom: 18,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardTopo: { flexDirection: 'row', alignItems: 'flex-start' },
  cardTextos: { flex: 1, marginRight: 12 },
  cardNome: { fontFamily: FONT.semibold, fontSize: 20, lineHeight: 28, color: '#0B1C30', position: 'relative', top: 1 },
  cardSubtitulo: { fontFamily: FONT.regular, fontSize: 14, lineHeight: 20, color: '#40484B' },
  badge: { height: 24, paddingHorizontal: 8, borderRadius: 12, justifyContent: 'center' },
  badgeTexto: { fontFamily: FONT.semibold, fontSize: 12, letterSpacing: 0.5 },
  divisor: { height: 1, backgroundColor: '#DEE3E4', marginTop: 11 },
  cardRodape: { flexDirection: 'row', alignItems: 'center', height: 18, marginTop: 12 },
  iconeCaixa: { height: 18, alignItems: 'center', justifyContent: 'center' },
  rodapeTexto: { fontFamily: FONT.regular, fontSize: 14, color: '#40484B' },

  // botão que aparece ao arrastar
  acaoCancelar: {
    width: 72,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#BA1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  vazio: { fontFamily: FONT.regular, textAlign: 'center', color: '#70787B', marginTop: 40 },

});