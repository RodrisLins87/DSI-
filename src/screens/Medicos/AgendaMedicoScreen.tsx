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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1A2E35" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Agenda do Médico</Text>
        <View style={{ width: 24 }} />
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
              <Feather name="coffee" size={28} color="#8A9599" />
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
                    { backgroundColor: slot.ocupado ? '#00353F' : '#E0F5F1' },
                  ]}
                >
                  <Text
                    style={[
                      styles.horaBadgeText,
                      { color: slot.ocupado ? '#FFFFFF' : '#00695C' },
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

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: '#F8F9FF',
    borderBottomWidth: 1,
    borderBottomColor: '#E3E8F0',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#006A66' },

  medicoCard: {
    backgroundColor: '#0F4C4A',
    padding: 18,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 14,
  },
  medicoNome: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  medicoEspecialidade: { color: '#B3E5FC', fontSize: 13, marginTop: 4 },

  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E3E8F0',
  },
  arrowBtn: { padding: 6 },
  dateText: { fontSize: 16, fontWeight: 'bold', color: '#1A2E35' },
  dayOfWeekText: { fontSize: 12, color: '#8A9599', marginTop: 2 },

  scroll: { padding: 20 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E3E8F0',
  },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#0F4C4A', marginBottom: 14 },

  emptyBox: { alignItems: 'center', paddingVertical: 20 },
  emptyText: { color: '#8A9599', fontSize: 13, marginTop: 10, textAlign: 'center', paddingHorizontal: 10 },

  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  slotLivreRow: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E3E8F0',
  },
  slotOcupadoRow: {
    backgroundColor: '#FBFCFD',
    borderColor: '#DDE3E6',
  },

  horaBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  horaBadgeText: { fontWeight: 'bold', fontSize: 13 },

  pacienteText: { fontSize: 14, fontWeight: '700', color: '#1A2E35' },
  statusText: { fontSize: 12, color: '#5B6B70', marginTop: 2 },
  livreText: { fontSize: 13, color: '#00695C', fontWeight: '600' },

  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusTagText: { fontSize: 11, fontWeight: 'bold' },
});