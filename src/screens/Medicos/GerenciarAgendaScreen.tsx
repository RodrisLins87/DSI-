import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import {
  DIAS_SEMANA,
  horaParaMinutos,
  IntervaloDisponibilidade,
} from '../../utils/disponibilidadeUtils';

const DIAS_TAB = [
  { id: 1, label: 'Seg' },
  { id: 2, label: 'Ter' },
  { id: 3, label: 'Qua' },
  { id: 4, label: 'Qui' },
  { id: 5, label: 'Sex' },
  { id: 6, label: 'Sáb' },
  { id: 0, label: 'Dom' },
];

const HORA_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

interface IntervaloPausa {
  id: string;
  inicio: string;
  fim: string;
}

interface DiaConfig {
  diaSemana: number;
  ativo: boolean;
  inicioExpediente: string;
  fimExpediente: string;
  intervalos: IntervaloPausa[];
}

// Agenda inicial: segunda a sexta ativas, com pausa de almoço
function agendaPadrao(): Record<number, DiaConfig> {
  const agenda: Record<number, DiaConfig> = {};
  [1, 2, 3, 4, 5].forEach((dia) => {
    agenda[dia] = {
      diaSemana: dia,
      ativo: true,
      inicioExpediente: '08:00',
      fimExpediente: '18:00',
      intervalos: [{ id: `${dia}-almoco`, inicio: '12:00', fim: '13:00' }],
    };
  });
  [6, 0].forEach((dia) => {
    agenda[dia] = {
      diaSemana: dia,
      ativo: false,
      inicioExpediente: '08:00',
      fimExpediente: '12:00',
      intervalos: [],
    };
  });
  return agenda;
}

// O que está salvo no Firestore é uma lista de faixas (uma linha por faixa de horário),
// o mesmo formato que a AgendaMedicoScreen e o agendamento já leem. Aqui a lista vira
// "expediente + pausas" para a tela: o espaço entre duas faixas do mesmo dia aparece
// como intervalo.
function listaParaAgenda(lista: IntervaloDisponibilidade[]): Record<number, DiaConfig> {
  const nova = agendaPadrao();
  Object.values(nova).forEach((d) => {
    d.ativo = false;
    d.intervalos = [];
  });

  for (let dia = 0; dia <= 6; dia++) {
    const faixas = lista
      .filter((f) => f.diaSemana === dia)
      .sort((a, b) => horaParaMinutos(a.horaInicio) - horaParaMinutos(b.horaInicio));
    if (faixas.length === 0) continue;

    const intervalos: IntervaloPausa[] = [];
    let fimMaximo = faixas[0].horaFim;
    for (let i = 1; i < faixas.length; i++) {
      if (horaParaMinutos(faixas[i].horaInicio) > horaParaMinutos(fimMaximo)) {
        intervalos.push({
          id: `${dia}-${i}`,
          inicio: fimMaximo,
          fim: faixas[i].horaInicio,
        });
      }
      if (horaParaMinutos(faixas[i].horaFim) > horaParaMinutos(fimMaximo)) {
        fimMaximo = faixas[i].horaFim;
      }
    }

    nova[dia] = {
      diaSemana: dia,
      ativo: true,
      inicioExpediente: faixas[0].horaInicio,
      fimExpediente: fimMaximo,
      intervalos,
    };
  }
  return nova;
}

// Caminho contrário, usado ao salvar: o expediente menos as pausas vira uma ou mais
// faixas. Assim a agenda continua no mesmo formato que o resto do app já lê.
function agendaParaLista(agenda: Record<number, DiaConfig>): IntervaloDisponibilidade[] {
  const lista: IntervaloDisponibilidade[] = [];

  Object.values(agenda).forEach((d) => {
    if (!d.ativo) return;

    const pausas = [...d.intervalos].sort(
      (a, b) => horaParaMinutos(a.inicio) - horaParaMinutos(b.inicio)
    );

    let cursor = d.inicioExpediente;
    let n = 0;

    pausas.forEach((p) => {
      if (horaParaMinutos(p.inicio) > horaParaMinutos(cursor)) {
        lista.push({
          id: `${d.diaSemana}-${n++}`,
          diaSemana: d.diaSemana,
          horaInicio: cursor,
          horaFim: p.inicio,
        });
      }
      if (horaParaMinutos(p.fim) > horaParaMinutos(cursor)) cursor = p.fim;
    });

    if (horaParaMinutos(cursor) < horaParaMinutos(d.fimExpediente)) {
      lista.push({
        id: `${d.diaSemana}-${n++}`,
        diaSemana: d.diaSemana,
        horaInicio: cursor,
        horaFim: d.fimExpediente,
      });
    }
  });

  return lista;
}

// Devolve a mensagem do primeiro problema encontrado, ou null se estiver tudo certo
function validarAgenda(agenda: Record<number, DiaConfig>): string | null {
  for (const d of Object.values(agenda)) {
    if (!d.ativo) continue;
    const nome = DIAS_SEMANA[d.diaSemana];

    const horas = [
      d.inicioExpediente,
      d.fimExpediente,
      ...d.intervalos.flatMap((p) => [p.inicio, p.fim]),
    ];
    if (horas.some((h) => !HORA_REGEX.test(h))) {
      return `${nome}: use horários no formato HH:MM (ex.: 08:00).`;
    }

    const ini = horaParaMinutos(d.inicioExpediente);
    const fim = horaParaMinutos(d.fimExpediente);
    if (ini >= fim) {
      return `${nome}: o fim do expediente deve ser depois do início.`;
    }

    for (const p of d.intervalos) {
      const pi = horaParaMinutos(p.inicio);
      const pf = horaParaMinutos(p.fim);
      if (pi >= pf || pi < ini || pf > fim) {
        return `${nome}: o intervalo das ${p.inicio} às ${p.fim} está fora do expediente.`;
      }
    }
  }
  return null;
}

export default function GerenciarAgendaScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const medicoId: string = route.params?.medicoId;

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [diaSelecionado, setDiaSelecionado] = useState<number>(1);
  const [agenda, setAgenda] = useState<Record<number, DiaConfig>>(agendaPadrao);

  const [novoInicioPausa, setNovoInicioPausa] = useState<string>('');
  const [novoFimPausa, setNovoFimPausa] = useState<string>('');

  useEffect(() => {
    async function loadAgenda(): Promise<void> {
      if (!medicoId) {
        setLoading(false);
        return;
      }
      try {
        const snap = await getDoc(doc(db, 'medicos', medicoId));
        const data = snap.data();
        if (!snap.exists() || !data || data.clinicaId !== auth.currentUser?.uid) {
          Alert.alert('Erro', 'Médico não encontrado.', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
          return;
        }
        const disp = (data.disponibilidade ?? []) as IntervaloDisponibilidade[];
        if (disp.length > 0) setAgenda(listaParaAgenda(disp));
      } catch (e: any) {
        Alert.alert('Erro ao carregar', e.message);
      } finally {
        setLoading(false);
      }
    }
    loadAgenda();
  }, [medicoId]);

  const configAtual = agenda[diaSelecionado];

  function updateConfigAtual(updates: Partial<DiaConfig>): void {
    setAgenda((prev) => ({
      ...prev,
      [diaSelecionado]: { ...prev[diaSelecionado], ...updates },
    }));
  }

  function handleAddIntervalo(): void {
    if (!HORA_REGEX.test(novoInicioPausa) || !HORA_REGEX.test(novoFimPausa)) {
      Alert.alert('Atenção', 'Informe o início e o fim do intervalo no formato HH:MM.');
      return;
    }
    if (horaParaMinutos(novoInicioPausa) >= horaParaMinutos(novoFimPausa)) {
      Alert.alert('Atenção', 'O fim do intervalo deve ser depois do início.');
      return;
    }
    const novo: IntervaloPausa = {
      id: Date.now().toString(),
      inicio: novoInicioPausa,
      fim: novoFimPausa,
    };
    updateConfigAtual({ intervalos: [...configAtual.intervalos, novo] });
    setNovoInicioPausa('');
    setNovoFimPausa('');
  }

  function handleRemoveIntervalo(id: string): void {
    updateConfigAtual({
      intervalos: configAtual.intervalos.filter((i) => i.id !== id),
    });
  }

  async function handleSalvarAgenda(): Promise<void> {
    const erro = validarAgenda(agenda);
    if (erro) {
      Alert.alert('Atenção', erro);
      return;
    }

    const listaDisponibilidade = agendaParaLista(agenda);
    if (listaDisponibilidade.length === 0) {
      Alert.alert('Disponibilidade obrigatória', 'Ative ao menos um dia de atendimento.');
      return;
    }

    setSaving(true);
    try {
      const clinicaId = auth.currentUser?.uid;
      if (!clinicaId) throw new Error('Sessão expirada. Faça login novamente.');

      // Não deixa salvar se alguma consulta futura ficaria fora da nova agenda
      const q = query(
        collection(db, 'consultas'),
        where('clinicaId', '==', clinicaId),
        where('medicoId', '==', medicoId)
      );
      const snap = await getDocs(q);
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      const afetadas = snap.docs.filter((d) => {
        const c = d.data();
        if (c.status === 'cancelada' || !c.horario) return false;
        const partes = (c.data ?? '').split('/');
        if (partes.length !== 3) return false;
        const dataConsulta = new Date(Number(partes[2]), Number(partes[1]) - 1, Number(partes[0]));
        if (dataConsulta < hoje) return false;

        const diaSemana = dataConsulta.getDay();
        const minConsulta = horaParaMinutos(c.horario);

        const coberta = listaDisponibilidade.some(
          (disp) =>
            disp.diaSemana === diaSemana &&
            minConsulta >= horaParaMinutos(disp.horaInicio) &&
            minConsulta < horaParaMinutos(disp.horaFim)
        );
        return !coberta;
      });

      if (afetadas.length > 0) {
        Alert.alert(
          'Conflito com consultas agendadas',
          `Existem ${afetadas.length} consulta(s) futura(s) agendada(s) fora da nova disponibilidade. Reagende essas consultas antes de salvar.`
        );
        return;
      }

      await updateDoc(doc(db, 'medicos', medicoId), {
        disponibilidade: listaDisponibilidade,
      });

      Alert.alert('Sucesso', 'Agenda atualizada com sucesso!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Erro ao salvar', error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
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
          <Ionicons name="arrow-back" size={24} color="#00353F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gerenciar Agenda</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.subtitle}>
          Defina os horários de atendimento para cada dia da semana.
        </Text>

        <Text style={styles.sectionLabel}>DIAS DA SEMANA</Text>
        <View style={styles.daysRow}>
          {DIAS_TAB.map((item) => {
            const selected = item.id === diaSelecionado;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.dayChip, selected && styles.dayChipSelected]}
                onPress={() => setDiaSelecionado(item.id)}
              >
                <Text style={[styles.dayChipText, selected && styles.dayChipTextSelected]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.dayTitle}>{DIAS_SEMANA[diaSelecionado]}</Text>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>{configAtual.ativo ? 'Ativo' : 'Inativo'}</Text>
              <Switch
                value={configAtual.ativo}
                onValueChange={(val) => updateConfigAtual({ ativo: val })}
                trackColor={{ false: '#DDE3E6', true: '#006A66' }}
              />
            </View>
          </View>

          {configAtual.ativo && (
            <>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Início do Expediente</Text>
                  <View style={styles.inputBox}>
                    <Feather name="clock" size={16} color="#5B6B70" />
                    <TextInput
                      style={styles.inputText}
                      value={configAtual.inicioExpediente}
                      onChangeText={(t) => updateConfigAtual({ inicioExpediente: t })}
                      placeholder="08:00"
                      maxLength={5}
                      keyboardType="numbers-and-punctuation"
                    />
                  </View>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Fim do Expediente</Text>
                  <View style={styles.inputBox}>
                    <Feather name="clock" size={16} color="#5B6B70" />
                    <TextInput
                      style={styles.inputText}
                      value={configAtual.fimExpediente}
                      onChangeText={(t) => updateConfigAtual({ fimExpediente: t })}
                      placeholder="18:00"
                      maxLength={5}
                      keyboardType="numbers-and-punctuation"
                    />
                  </View>
                </View>
              </View>

              <Text style={[styles.inputLabel, { marginTop: 16 }]}>
                Intervalos (pausa para almoço, etc.)
              </Text>
              {configAtual.intervalos.map((item) => (
                <View key={item.id} style={styles.intervaloRow}>
                  <Text style={styles.intervaloText}>
                    {item.inicio} às {item.fim}
                  </Text>
                  <TouchableOpacity onPress={() => handleRemoveIntervalo(item.id)}>
                    <Feather name="trash-2" size={18} color="#BA1A1A" />
                  </TouchableOpacity>
                </View>
              ))}

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10, alignItems: 'center' }}>
                <TextInput
                  style={styles.pausaInput}
                  placeholder="Início (12:00)"
                  placeholderTextColor="#8A9599"
                  value={novoInicioPausa}
                  onChangeText={setNovoInicioPausa}
                  maxLength={5}
                  keyboardType="numbers-and-punctuation"
                />
                <TextInput
                  style={styles.pausaInput}
                  placeholder="Fim (13:00)"
                  placeholderTextColor="#8A9599"
                  value={novoFimPausa}
                  onChangeText={setNovoFimPausa}
                  maxLength={5}
                  keyboardType="numbers-and-punctuation"
                />
                <TouchableOpacity style={styles.addBtn} onPress={handleAddIntervalo}>
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.7 }]}
          onPress={handleSalvarAgenda}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveBtnText}>SALVAR</Text>
          )}
        </TouchableOpacity>
      </View>
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
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E3E8F0',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#00353F' },
  scroll: { padding: 20 },
  subtitle: { fontSize: 14, color: '#5B6B70', marginBottom: 20 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#1A2E35', marginBottom: 10 },
  daysRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  dayChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BFC8CB',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  dayChipSelected: { backgroundColor: '#004D5B', borderColor: '#004D5B' },
  dayChipText: { fontSize: 13, color: '#1A2E35', fontWeight: '600' },
  dayChipTextSelected: { color: '#FFFFFF' },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BFC8CB',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F4',
  },
  dayTitle: { fontSize: 16, fontWeight: '700', color: '#00353F' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  switchLabel: { fontSize: 14, color: '#5B6B70' },

  inputLabel: { fontSize: 13, color: '#1A2E35', fontWeight: '600', marginBottom: 6 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFC8CB',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 44,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  inputText: { flex: 1, fontSize: 14, color: '#1A2E35' },
  pausaInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#BFC8CB',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 44,
    backgroundColor: '#FFFFFF',
    fontSize: 14,
    color: '#1A2E35',
  },

  intervaloRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E3E8F0',
    marginBottom: 6,
  },
  intervaloText: { fontSize: 14, fontWeight: '600', color: '#1A2E35' },
  addBtn: {
    backgroundColor: '#006A66',
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E3E8F0',
  },
  saveBtn: {
    backgroundColor: '#004D5B',
    height: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14, letterSpacing: 0.5 },
});