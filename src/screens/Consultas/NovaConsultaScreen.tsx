import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';


const TIPOS_CONSULTA = ['Primeira Consulta', 'Retorno', 'Exame'];
const HORARIOS = {
  Manhã: ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'],
  Tarde: ['13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'],
} as const;
type Periodo = keyof typeof HORARIOS;

// Cores tiradas do design (Figma)
const COR = {
  fundo: '#F8F9FF',
  escuro: '#00353F',   // título, horário selecionado
  botao: '#004D5B',
  destaque: '#E0F5F1', // fundo de pílula, dia e chip selecionados
  destaqueTexto: '#00695C', // texto dentro do destaque
  borda: '#BFC8CB',
  texto: '#1A2E35',
  suave: '#5B6B70',
  desabilitado: '#B8C0C4',
};

interface Pessoa { id: string; nome: string; }
interface Medico { id: string; nome: string; especialidade: string; fotoUrl?: string; }

// Os campos de nome podem variar entre as coleções; aceita os nomes mais prováveis.
const lerNome = (d: any): string => d.nomeCompleto ?? d.nome ?? '(sem nome)';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const doisDigitos = (n: number) => String(n).padStart(2, '0');
const formatarData = (d: Date) => `${doisDigitos(d.getDate())}/${doisDigitos(d.getMonth() + 1)}/${d.getFullYear()}`;
const inicioDoDia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export default function NovaConsultaScreen({ navigation }: { navigation: any }) {
  const insets = useSafeAreaInsets();

  const [tipoPessoa, setTipoPessoa] = useState<'paciente' | 'dependente'>('paciente');
  const [pacientes, setPacientes] = useState<Pessoa[]>([]);
  const [dependentes, setDependentes] = useState<Pessoa[]>([]);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [pessoa, setPessoa] = useState<Pessoa | null>(null);
  const [abrirPessoa, setAbrirPessoa] = useState(false);
  const [buscaPessoa, setBuscaPessoa] = useState('');

  const [medico, setMedico] = useState<Medico | null>(null);
  const [abrirMedico, setAbrirMedico] = useState(false);

  const hoje = inicioDoDia(new Date());
  const [mesVisivel, setMesVisivel] = useState(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
  const [dataSelecionada, setDataSelecionada] = useState<Date | null>(null);

  const [periodo, setPeriodo] = useState<Periodo>('Manhã');
  const [horario, setHorario] = useState<string | null>(null);
  const [ocupados, setOcupados] = useState<string[]>([]);

  const [tipoConsulta, setTipoConsulta] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  // ---------------- carregar pacientes, dependentes e médicos da clínica ----------------
  useEffect(() => {
    async function carregar() {
      const clinicaId = auth.currentUser?.uid;
      if (!clinicaId) return;
      try {
        const buscar = (nome: string) =>
          getDocs(query(collection(db, nome), where('clinicaId', '==', clinicaId)));
        const [p, d, m] = await Promise.all([buscar('pacientes'), buscar('dependentes'), buscar('medicos')]);
        const ordenar = (a: Pessoa, b: Pessoa) => a.nome.localeCompare(b.nome);
        setPacientes(p.docs.map((x) => ({ id: x.id, nome: lerNome(x.data()) })).sort(ordenar));
        setDependentes(d.docs.map((x) => ({ id: x.id, nome: lerNome(x.data()) })).sort(ordenar));
        setMedicos(
          m.docs
            .map((x) => {
              const dados: any = x.data();
              return { id: x.id, nome: lerNome(dados), especialidade: dados.especialidade ?? '', fotoUrl: dados.fotoUrl };
            })
            .sort(ordenar),
        );
      } catch {
        Alert.alert('Erro', 'Não foi possível carregar pacientes e médicos.');
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  // ---------------- horários já ocupados do médico no dia escolhido ----------------
  async function buscarOcupados(medicoId: string, data: Date): Promise<string[]> {
    const clinicaId = auth.currentUser?.uid;
    if (!clinicaId) return [];
    const snap = await getDocs(
      query(
        collection(db, 'consultas'),
        where('clinicaId', '==', clinicaId),
        where('medicoId', '==', medicoId),
        where('data', '==', formatarData(data)),
      ),
    );
    return snap.docs.map((d) => d.data()).filter((c: any) => c.status !== 'cancelada').map((c: any) => c.horario as string);
  }

  useEffect(() => {
    setHorario(null);
    if (!medico || !dataSelecionada) { setOcupados([]); return; }
    buscarOcupados(medico.id, dataSelecionada).then(setOcupados).catch(() => setOcupados([]));
  }, [medico, dataSelecionada]);

  // ---------------- listas filtradas ----------------
  const listaPessoas = tipoPessoa === 'paciente' ? pacientes : dependentes;
  const pessoasFiltradas = useMemo(
    () => listaPessoas.filter((p) => p.nome.toLowerCase().includes(buscaPessoa.toLowerCase())),
    [listaPessoas, buscaPessoa],
  );

  function trocarTipoPessoa(tipo: 'paciente' | 'dependente') {
    setTipoPessoa(tipo);
    setPessoa(null);
    setBuscaPessoa('');
    setAbrirPessoa(false);
  }

  // ---------------- calendário ----------------
  const celulasDoMes = useMemo(() => {
    const ano = mesVisivel.getFullYear();
    const mes = mesVisivel.getMonth();
    const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();
    const diasMesAnterior = new Date(ano, mes, 0).getDate();
    const celulas: { dia: number; data: Date; doMes: boolean }[] = [];
    for (let i = primeiroDiaSemana - 1; i >= 0; i--) {
      const dia = diasMesAnterior - i;
      celulas.push({ dia, data: new Date(ano, mes - 1, dia), doMes: false });
    }
    for (let dia = 1; dia <= diasNoMes; dia++) celulas.push({ dia, data: new Date(ano, mes, dia), doMes: true });
    return celulas;
  }, [mesVisivel]);

  const podeVoltarMes =
    mesVisivel.getFullYear() > hoje.getFullYear() ||
    (mesVisivel.getFullYear() === hoje.getFullYear() && mesVisivel.getMonth() > hoje.getMonth());

  function mudarMes(delta: number) {
    setMesVisivel(new Date(mesVisivel.getFullYear(), mesVisivel.getMonth() + delta, 1));
  }

  const mesmaData = (a: Date | null, b: Date) => !!a && a.getTime() === b.getTime();

  // ---------------- horários ----------------
  function horarioPassou(h: string): boolean {
    if (!dataSelecionada || !mesmaData(dataSelecionada, hoje)) return false;
    const [hh, mm] = h.split(':').map(Number);
    const agora = new Date();
    return hh * 60 + mm <= agora.getHours() * 60 + agora.getMinutes();
  }

  // ---------------- salvar ----------------
  const formularioCompleto = !!(pessoa && medico && dataSelecionada && horario && tipoConsulta);

  async function confirmar() {
    if (!pessoa || !medico || !dataSelecionada || !horario || !tipoConsulta) {
      Alert.alert('Atenção', 'Preencha todos os campos para agendar.');
      return;
    }
    if (!auth.currentUser) return;
    setSalvando(true);
    try {
      // confere de novo: outra pessoa pode ter ocupado o horário enquanto este formulário estava aberto
      const agoraOcupados = await buscarOcupados(medico.id, dataSelecionada);
      if (agoraOcupados.includes(horario)) {
        setOcupados(agoraOcupados);
        setHorario(null);
        Alert.alert('Horário indisponível', 'Esse horário acabou de ser ocupado. Escolha outro.');
        return;
      }
      await addDoc(collection(db, 'consultas'), {
        clinicaId: auth.currentUser.uid,
        tipoPessoa,
        pacienteId: pessoa.id,
        pacienteNome: pessoa.nome,
        medicoId: medico.id,
        medicoNome: medico.nome,
        data: formatarData(dataSelecionada),
        horario,
        tipoConsulta,
        status: 'pendente',
        criadaEm: serverTimestamp(),
      });
      Alert.alert('Sucesso', 'Consulta agendada!');
      navigation.goBack();
    } catch {
      Alert.alert('Erro', 'Não foi possível agendar a consulta.');
    } finally {
      setSalvando(false);
    }
  }

  const iniciais = (nome: string) => nome.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color={COR.escuro} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nova Consulta</Text>
        <View style={styles.back} />
      </View>

      {carregando ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={COR.botao} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Paciente / Dependente */}
          <View style={styles.segmento}>
            {(['paciente', 'dependente'] as const).map((tipo) => {
              const ativo = tipoPessoa === tipo;
              return (
                <TouchableOpacity key={tipo} style={[styles.segmentoItem, ativo && styles.segmentoAtivo]} onPress={() => trocarTipoPessoa(tipo)}>
                  <Text style={[styles.segmentoTexto, ativo && styles.segmentoTextoAtivo]}>{tipo === 'paciente' ? 'Paciente' : 'Dependente'}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Selecionar paciente / dependente */}
          <Text style={styles.label}>{tipoPessoa === 'paciente' ? 'Selecionar Paciente' : 'Selecionar Dependente'}</Text>
          <TouchableOpacity style={styles.campo} onPress={() => { setAbrirPessoa(!abrirPessoa); setAbrirMedico(false); }}>
            <Ionicons name="search" size={22} color={COR.suave} />
            <Text style={[styles.campoTexto, !pessoa && { color: COR.desabilitado }]} numberOfLines={1}>
              {pessoa ? pessoa.nome : tipoPessoa === 'paciente' ? 'Buscar paciente' : 'Buscar dependente'}
            </Text>
            <Ionicons name="caret-down" size={14} color={COR.suave} />
          </TouchableOpacity>
          {abrirPessoa && (
            <View style={styles.painel}>
              <TextInput style={styles.painelBusca} placeholder="Digite o nome" value={buscaPessoa} onChangeText={setBuscaPessoa} autoFocus />
              <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                {pessoasFiltradas.length === 0 ? (
                  <Text style={styles.vazio}>Nenhum {tipoPessoa} encontrado.</Text>
                ) : (
                  pessoasFiltradas.map((p) => (
                    <TouchableOpacity key={p.id} style={styles.painelItem} onPress={() => { setPessoa(p); setAbrirPessoa(false); setBuscaPessoa(''); }}>
                      <Text style={styles.painelItemTexto}>{p.nome}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          )}

          {/* Especialista */}
          <Text style={styles.label}>Especialista</Text>
          <TouchableOpacity style={styles.campo} onPress={() => { setAbrirMedico(!abrirMedico); setAbrirPessoa(false); }}>
            {medico ? (
              <>
                <Avatar medico={medico} iniciais={iniciais(medico.nome)} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.medicoNome} numberOfLines={1}>{medico.nome}</Text>
                  <Text style={styles.medicoEsp} numberOfLines={1}>{medico.especialidade}</Text>
                </View>
              </>
            ) : (
              <Text style={[styles.campoTexto, { color: COR.desabilitado, marginLeft: 0 }]}>Selecionar especialista</Text>
            )}
            <Ionicons name="chevron-down" size={20} color={COR.suave} />
          </TouchableOpacity>
          {abrirMedico && (
            <View style={styles.painel}>
              <ScrollView style={{ maxHeight: 240 }} nestedScrollEnabled>
                {medicos.length === 0 ? (
                  <Text style={styles.vazio}>Nenhum médico cadastrado.</Text>
                ) : (
                  medicos.map((m) => (
                    <TouchableOpacity key={m.id} style={[styles.painelItem, styles.painelItemMedico]} onPress={() => { setMedico(m); setAbrirMedico(false); }}>
                      <Avatar medico={m} iniciais={iniciais(m.nome)} />
                      <View style={{ marginLeft: 12, flex: 1 }}>
                        <Text style={styles.medicoNome} numberOfLines={1}>{m.nome}</Text>
                        <Text style={styles.medicoEsp} numberOfLines={1}>{m.especialidade}</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          )}

          {/* Calendário */}
          <Text style={styles.label}>Data da Consulta</Text>
          <View style={styles.calendario}>
            <View style={styles.calHeader}>
              <TouchableOpacity onPress={() => mudarMes(-1)} disabled={!podeVoltarMes} hitSlop={10}>
                <Ionicons name="chevron-back" size={20} color={podeVoltarMes ? COR.escuro : COR.desabilitado} />
              </TouchableOpacity>
              <Text style={styles.calMes}>{MESES[mesVisivel.getMonth()]} {mesVisivel.getFullYear()}</Text>
              <TouchableOpacity onPress={() => mudarMes(1)} hitSlop={10}>
                <Ionicons name="chevron-forward" size={20} color={COR.escuro} />
              </TouchableOpacity>
            </View>
            <View style={styles.calLinha}>
              {DIAS_SEMANA.map((d, i) => (
                <Text key={i} style={styles.calSemana}>{d}</Text>
              ))}
            </View>
            <View style={styles.calGrade}>
              {celulasDoMes.map((c, i) => {
                const passado = c.data < hoje;
                const desabilitado = !c.doMes || passado;
                const selecionado = c.doMes && mesmaData(dataSelecionada, c.data);
                return (
                  <View key={i} style={styles.calCelula}>
                    <TouchableOpacity
                      disabled={desabilitado}
                      onPress={() => setDataSelecionada(c.data)}
                      style={[styles.calDia, selecionado && styles.calDiaSelecionado]}
                    >
                      <Text style={[styles.calDiaTexto, desabilitado && { color: COR.borda }, selecionado && { color: COR.destaqueTexto, fontWeight: '700' }]}>
                        {c.dia}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Horários */}
          <View style={styles.horariosTopo}>
            <Text style={[styles.label, { marginTop: 0 }]}>Horários Disponíveis</Text>
            <View style={{ flexDirection: 'row' }}>
              {(Object.keys(HORARIOS) as Periodo[]).map((p) => (
                <TouchableOpacity key={p} onPress={() => setPeriodo(p)} hitSlop={8}>
                  <Text style={[styles.periodo, periodo === p && styles.periodoAtivo]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          {!medico || !dataSelecionada ? (
            <Text style={styles.dica}>Escolha o especialista e a data para ver os horários.</Text>
          ) : (
            <View style={styles.horariosGrade}>
              {HORARIOS[periodo].map((h) => {
                const indisponivel = ocupados.includes(h) || horarioPassou(h);
                const selecionado = horario === h;
                return (
                  <View key={h} style={styles.horarioCelula}>
                    <TouchableOpacity
                      disabled={indisponivel}
                      onPress={() => setHorario(h)}
                      style={[styles.horario, indisponivel && styles.horarioIndisponivel, selecionado && styles.horarioSelecionado]}
                    >
                      <Text style={[styles.horarioTexto, indisponivel && { color: COR.desabilitado }, selecionado && { color: '#FFFFFF' }]}>{h}</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}

          {/* Tipo de consulta */}
          <Text style={styles.label}>Tipo de Consulta</Text>
          <View style={styles.chips}>
            {TIPOS_CONSULTA.map((t) => {
              const ativo = tipoConsulta === t;
              return (
                <TouchableOpacity key={t} style={[styles.chip, ativo && styles.chipAtivo]} onPress={() => setTipoConsulta(t)}>
                  <Text style={[styles.chipTexto, ativo && { color: COR.destaqueTexto }]}>{t}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* Botão fixo no rodapé */}
      <View style={[styles.rodape, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity style={[styles.botao, (!formularioCompleto || salvando) && { opacity: 0.55 }]} onPress={confirmar} disabled={salvando}>
          {salvando ? <ActivityIndicator color="#fff" /> : <Text style={styles.botaoTexto}>CONFIRMAR AGENDAMENTO</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Avatar({ medico, iniciais }: { medico: Medico; iniciais: string }) {
  if (medico.fotoUrl) return <Image source={{ uri: medico.fotoUrl }} style={styles.avatar} />;
  return (
    <View style={[styles.avatar, styles.avatarIniciais]}>
      <Text style={styles.avatarTexto}>{iniciais}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COR.fundo },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFFFFF' },
  back: { width: 32 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COR.escuro },

  scroll: { padding: 20, paddingBottom: 32 },

  segmento: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: COR.borda, borderRadius: 12, padding: 4 },
  segmentoItem: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  segmentoAtivo: { backgroundColor: COR.destaque },
  segmentoTexto: { fontSize: 15, color: COR.texto },
  segmentoTextoAtivo: { fontWeight: '600', color: COR.destaqueTexto },

  label: { fontSize: 14, color: COR.texto, marginTop: 24, marginBottom: 8 },

  campo: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: COR.borda, borderRadius: 12, paddingHorizontal: 16, minHeight: 60 },
  campoTexto: { flex: 1, marginLeft: 12, fontSize: 16, color: COR.texto },

  painel: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: COR.borda, borderRadius: 12, marginTop: 6, overflow: 'hidden' },
  painelBusca: { padding: 14, fontSize: 16, color: COR.texto, borderBottomWidth: 1, borderBottomColor: '#E5EAEC' },
  painelItem: { paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F0F3F4' },
  painelItemMedico: { flexDirection: 'row', alignItems: 'center' },
  painelItemTexto: { fontSize: 16, color: COR.texto },
  vazio: { padding: 16, color: COR.suave, textAlign: 'center' },

  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarIniciais: { backgroundColor: '#D3E4FE', alignItems: 'center', justifyContent: 'center' },
  avatarTexto: { fontWeight: '700', color: COR.escuro },
  medicoNome: { fontSize: 15, fontWeight: '700', color: COR.texto },
  medicoEsp: { fontSize: 14, color: COR.suave, marginTop: 1 },

  calendario: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: COR.borda, borderRadius: 12, padding: 16 },
  calHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  calMes: { fontSize: 15, fontWeight: '700', color: COR.escuro },
  calLinha: { flexDirection: 'row', marginBottom: 6 },
  calSemana: { width: '14.2857%', textAlign: 'center', fontSize: 13, color: COR.suave },
  calGrade: { flexDirection: 'row', flexWrap: 'wrap' },
  calCelula: { width: '14.2857%', alignItems: 'center', paddingVertical: 4 },
  calDia: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  calDiaSelecionado: { backgroundColor: COR.destaque },
  calDiaTexto: { fontSize: 15, color: COR.texto },

  horariosTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 8 },
  periodo: { fontSize: 13, color: COR.desabilitado, marginLeft: 12 },
  periodoAtivo: { color: COR.suave, fontWeight: '700' },
  dica: { color: COR.suave, fontSize: 14 },
  horariosGrade: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  horarioCelula: { width: '25%', padding: 4 },
  horario: { height: 44, borderRadius: 8, borderWidth: 1, borderColor: COR.borda, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  horarioIndisponivel: { backgroundColor: COR.fundo, borderColor: '#E5EAEC' },
  horarioSelecionado: { backgroundColor: COR.escuro, borderColor: COR.escuro },
  horarioTexto: { fontSize: 14, color: COR.texto },

  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: COR.borda, backgroundColor: '#FFFFFF', marginRight: 8, marginBottom: 8 },
  chipAtivo: { backgroundColor: COR.destaque, borderColor: COR.destaque },
  chipTexto: { fontSize: 13, color: COR.texto },

  rodape: { paddingHorizontal: 20, paddingTop: 14, backgroundColor: COR.fundo, borderTopWidth: 1, borderTopColor: COR.borda },
  botao: { backgroundColor: COR.botao, borderRadius: 12, height: 56, alignItems: 'center', justifyContent: 'center' },
  botaoTexto: { color: '#FFFFFF', fontWeight: '700', fontSize: 14, letterSpacing: 0.6 },
});