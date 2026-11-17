import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { DIAS_SEMANA, horaParaMinutos } from '../../utils/disponibilidadeUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONT } from '../../global/fonts';

interface IntervaloDisponibilidade {
  id: string;
  diaSemana: number;
  horaInicio: string;
  horaFim: string;
}

interface Medico {
  id: string;
  nome: string;
  especialidade: string;
  crm: string;
  disponibilidade?: IntervaloDisponibilidade[];
}

interface Consulta {
  id: string;
  pacienteNome?: string;
  horario: string;
  status: string;
  tipoConsulta?: string;
}

interface SlotAgenda {
  hora: string;
  ocupado: boolean;
  consulta?: Consulta;
}

export default function AgendaMedicoScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const medicoId: string = route.params?.medicoId;

  const [medico, setMedico] = useState<Medico | null>(null);
  const [loadingMedico, setLoadingMedico] = useState<boolean>(true);
  const [loadingAgenda, setLoadingAgenda] = useState<boolean>(false);

  const [dataSelecionada, setDataSelecionada] = useState<Date>(new Date());
  const [consultasDoDia, setConsultasDoDia] = useState<Consulta[]>([]);

  useEffect(() => {
    async function fetchMedico() {
      if (!medicoId) {
        Alert.alert('Erro', 'Médico não identificado.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
        return;
      }
      try {
        const snap = await getDoc(doc(db, 'medicos', medicoId));
        if (snap.exists()) {
          setMedico({ id: snap.id, ...snap.data() } as Medico);
        } else {
          Alert.alert('Erro', 'Médico não encontrado.');
          navigation.goBack();
        }
      } catch (error: any) {
        Alert.alert('Erro ao carregar médico', error.message);
      } finally {
        setLoadingMedico(false);
      }
    }
    fetchMedico();
  }, [medicoId]);

  useEffect(() => {
    async function fetchAgenda() {
      const clinicaId = auth.currentUser?.uid;
      if (!medicoId || !clinicaId) return;
      setLoadingAgenda(true);

      try {
        const dataBR = formatarDataBR(dataSelecionada);
        const q = query(
          collection(db, 'consultas'),
          where('clinicaId', '==', clinicaId),
          where('medicoId', '==', medicoId),
          where('data', '==', dataBR)
        );

        const snap = await getDocs(q);
        const lista = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Consulta))
          .filter((c) => c.status !== 'cancelada');

        setConsultasDoDia(lista);
      } catch (error) {
        console.error('Erro ao buscar agenda:', error);
      } finally {
        setLoadingAgenda(false);
      }
    }

    fetchAgenda();
  }, [medicoId, dataSelecionada]);

  function alterarDia(dias: number) {
    const novaData = new Date(dataSelecionada);
    novaData.setDate(novaData.getDate() + dias);
    setDataSelecionada(novaData);
  }

  function formatarDataBR(d: Date): string {
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    return `${dia}/${mes}/${ano}`;
  }

  const diaSemana = dataSelecionada.getDay();
  const disponibilidadeDoDia =
    medico?.disponibilidade?.filter((d) => d.diaSemana === diaSemana) || [];

  // Gera a lista de slots (Livres vs Ocupados) com intervalo de 30 min (HU06 - Cenário 1)
  const slotsGrid = useMemo(() => {
    if (disponibilidadeDoDia.length === 0) return [];

    const slots: SlotAgenda[] = [];
    const mapaConsultas = new Map<string, Consulta>();
    consultasDoDia.forEach((c) => mapaConsultas.set(c.horario, c));

    disponibilidadeDoDia.forEach((disp) => {
      let minAtual = horaParaMinutos(disp.horaInicio);
      const minFim = horaParaMinutos(disp.horaFim);

      while (minAtual < minFim) {
        const h = Math.floor(minAtual / 60);
        const m = minAtual % 60;
        const horaStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

        const consulta = mapaConsultas.get(horaStr);
        slots.push({
          hora: horaStr,
          ocupado: !!consulta,
          consulta,
        });

        minAtual += 30; // Intervalo padrão de 30 minutos
      }
    });

    slots.sort((a, b) => a.hora.localeCompare(b.hora));
    return slots;
  }, [disponibilidadeDoDia, consultasDoDia]);

  if (loadingMedico) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#006A66" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerLinha}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
           <Ionicons name="arrow-back" size={24} color="#00353F" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Agenda do Médico</Text>
          <View style={styles.backBtn} />
        </View>
      </View>

      <View style={styles.medicoCard}>
        <Text style={styles.medicoNome}>Dr(a). {medico?.nome}</Text>
        <Text style={styles.medicoEspecialidade}>
          {medico?.especialidade} {medico?.crm ? `• CRM ${medico.crm}` : ''}
        </Text>
      </View>

      <View style={styles.dateSelector}>
        <TouchableOpacity onPress={() => alterarDia(-1)} style={styles.arrowBtn}>
          <Ionicons name="chevron-back" size={22} color="#006A66" />
        </TouchableOpacity>

        <View style={{ alignItems: 'center' }}>
          <Text style={styles.dateText}>{formatarDataBR(dataSelecionada)}</Text>
          <Text style={styles.dayOfWeekText}>{DIAS_SEMANA[diaSemana]}</Text>
        </View>

        <TouchableOpacity onPress={() => alterarDia(1)} style={styles.arrowBtn}>
          <Ionicons name="chevron-forward" size={22} color="#006A66" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Grelha de Horários do Dia</Text>

          {loadingAgenda ? (
            <ActivityIndicator size="small" color="#006A66" style={{ marginVertical: 20 }} />
          ) : disponibilidadeDoDia.length === 0 ? (
            <View style={styles.emptyBox}>
              <Feather name="coffee" size={28} color="#70787B" />
              <Text style={styles.emptyText}>
                O profissional não possui horário de atendimento cadastrado para este dia da semana.
              </Text>
            </View>
          ) : (
            slotsGrid.map((slot) => (
              <View
                key={slot.hora}
                style={[
                  styles.slotRow,
                  slot.ocupado ? styles.slotOcupadoRow : styles.slotLivreRow,
                ]}
              >
                <View
                  style={[
                    styles.horaBadge,
                    { backgroundColor: slot.ocupado ? '#00353F' : '#E6F4F1' },
                  ]}
                >
                  <Text
                    style={[
                      styles.horaBadgeText,
                      { color: slot.ocupado ? '#FFFFFF' : '#006A66'},
                    ]}
                  >
                    {slot.hora}
                  </Text>
                </View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                  {slot.ocupado ? (
                    <>
                      <Text style={styles.pacienteText}>
                        {slot.consulta?.pacienteNome || 'Paciente'}
                      </Text>
                      <Text style={styles.statusText}>
                        {slot.consulta?.tipoConsulta ? `${slot.consulta.tipoConsulta} • ` : ''}
                        Status: {slot.consulta?.status}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.livreText}>Disponível / Livre</Text>
                  )}
                </View>

                <View
                  style={[
                    styles.statusTag,
                    { backgroundColor: slot.ocupado ? '#FFDAD6' : '#E6F4F1' },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusTagText,
                      { color: slot.ocupado ? '#BA1A1A' : '#006A66' },
                    ]}
                  >
                    {slot.ocupado ? 'Ocupado' : 'Livre'}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FF' },
  center: { justifyContent: 'center', alignItems: 'center' },

  // cabeçalho (igual ao das listagens)
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
  backBtn: { width: 44, height: 44, alignItems: 'flex-start', justifyContent: 'center' },
  headerTitle: { fontFamily: FONT.semibold, fontSize: 24, lineHeight: 32, color: '#00353F' },

  medicoCard: {
    backgroundColor: '#00353F',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 8,
  },
  medicoNome: { fontFamily: FONT.semibold, fontSize: 20, lineHeight: 28, color: '#FFFFFF' },
  medicoEspecialidade: {
    fontFamily: FONT.regular,
    fontSize: 14,
    lineHeight: 20,
    color: '#DEE3E4',
    marginTop: 2,
  },

  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFC8CB',
  },
  arrowBtn: { padding: 6 },
  dateText: { fontFamily: FONT.semibold, fontSize: 16, lineHeight: 24, color: '#0B1C30' },
  dayOfWeekText: { fontFamily: FONT.regular, fontSize: 14, lineHeight: 20, color: '#40484B' },

  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFC8CB',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardTitle: {
    fontFamily: FONT.semibold,
    fontSize: 20,
    lineHeight: 28,
    color: '#0B1C30',
    marginBottom: 12,
  },

  emptyBox: { alignItems: 'center', paddingVertical: 20 },
  emptyText: {
    fontFamily: FONT.regular,
    fontSize: 14,
    lineHeight: 20,
    color: '#70787B',
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 10,
  },

  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#DEE3E4',
  },
  slotLivreRow: { backgroundColor: '#FFFFFF' },
  slotOcupadoRow: { backgroundColor: '#F8F9FF' },

  horaBadge: {
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 14,
    justifyContent: 'center',
  },
  horaBadgeText: { fontFamily: FONT.semibold, fontSize: 14 },

  pacienteText: { fontFamily: FONT.semibold, fontSize: 16, lineHeight: 24, color: '#0B1C30' },
  statusText: { fontFamily: FONT.regular, fontSize: 14, lineHeight: 20, color: '#40484B' },
  livreText: { fontFamily: FONT.semibold, fontSize: 14, lineHeight: 20, color: '#006A66' },

  // badge (mesmo padrão do status da consulta)
  statusTag: { height: 24, paddingHorizontal: 8, borderRadius: 12, justifyContent: 'center' },
  statusTagText: { fontFamily: FONT.semibold, fontSize: 12, letterSpacing: 0.5 },
});