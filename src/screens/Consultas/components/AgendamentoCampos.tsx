import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../../lib/firebase';
import { FONT } from '../../../global/fonts';

/**
 * Peças compartilhadas pelas telas "Nova Consulta" e "Reagendar Consulta"
 * (as duas telas do Figma são praticamente iguais).
 */

// ---------------------------------------------------------------
// AJUSTES RÁPIDOS (se o time mudar algo, é só mexer aqui)
// ---------------------------------------------------------------
export const TIPOS_CONSULTA = ['Primeira Consulta', 'Retorno', 'Exame'];

export const HORARIOS = {
  Manhã: ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00'],
  Tarde: ['13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'],
} as const;
export type Periodo = keyof typeof HORARIOS;

// Cores tiradas do Figma
export const COR = {
  fundo: '#F8F9FF',
  branco: '#FFFFFF',
  texto: '#0B1C30',
  suave: '#40484B',
  placeholder: '#70787B',
  borda: '#BFC8CB',
  escuro: '#00353F', // título e horário selecionado
  botao: '#004D5B',
  destaque: '#E0F5F1', // dia e chip selecionados
  destaqueTexto: '#00695C',
};

export interface Pessoa {
  id: string;
  nome: string;
}
export interface Medico {
  id: string;
  nome: string;
  especialidade: string;
  fotoUrl?: string;
}

// Os campos de nome podem variar entre as coleções; aceita os nomes mais prováveis.
export const lerNome = (d: any): string => d.nomeCompleto ?? d.nome ?? '(sem nome)';

// ---------------------------------------------------------------
// Datas
// ---------------------------------------------------------------
const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const doisDigitos = (n: number) => String(n).padStart(2, '0');
export const formatarData = (d: Date) =>
  `${doisDigitos(d.getDate())}/${doisDigitos(d.getMonth() + 1)}/${d.getFullYear()}`;
export const inicioDoDia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** "05/10/2023" -> Date (ou null se o texto não for uma data válida) */
export function lerData(texto: string | undefined): Date | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto ?? '');
  if (!m) return null;
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
}

const mesmaData = (a: Date | null, b: Date) => !!a && a.getTime() === b.getTime();

/** Horário de hoje que já passou não pode ser marcado. */
export function horarioJaPassou(horario: string, data: Date | null): boolean {
  if (!data || !mesmaData(data, inicioDoDia(new Date()))) return false;
  const [hh, mm] = horario.split(':').map(Number);
  const agora = new Date();
  return hh * 60 + mm <= agora.getHours() * 60 + agora.getMinutes();
}

// ---------------------------------------------------------------
// Firestore: horários já ocupados de um médico em um dia
// (consulta cancelada libera o horário)
// ---------------------------------------------------------------
export async function buscarHorariosOcupados(
  medicoId: string,
  data: Date,
  ignorarConsultaId?: string,
): Promise<string[]> {
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
  return snap.docs
    .filter((d) => d.id !== ignorarConsultaId)
    .map((d) => d.data() as any)
    .filter((c) => c.status !== 'cancelada')
    .map((c) => c.horario as string);
}

/** Mantém a lista de horários ocupados atualizada quando muda o médico ou o dia. */
export function useHorariosOcupados(
  medico: Medico | null,
  data: Date | null,
  ignorarConsultaId?: string,
) {
  const [ocupados, setOcupados] = useState<string[]>([]);

  useEffect(() => {
    let ativo = true;
    if (!medico || !data) {
      setOcupados([]);
      return;
    }
    buscarHorariosOcupados(medico.id, data, ignorarConsultaId)
      .then((lista) => ativo && setOcupados(lista))
      .catch(() => ativo && setOcupados([]));
    return () => {
      ativo = false;
    };
  }, [medico, data, ignorarConsultaId]);

  return [ocupados, setOcupados] as const;
}

// ---------------------------------------------------------------
// Cabeçalho (seta de voltar + título centralizado)
// ---------------------------------------------------------------
export function CabecalhoTela({
  titulo,
  onVoltar,
  desabilitado,
}: {
  titulo: string;
  onVoltar: () => void;
  desabilitado?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[st.cabecalho, { paddingTop: insets.top }]}>
      <View style={st.cabecalhoLinha}>
        <TouchableOpacity style={st.voltar} onPress={onVoltar} disabled={desabilitado} hitSlop={12}>
          <MaterialIcons name="arrow-back" size={24} color={COR.escuro} />
        </TouchableOpacity>
        <Text style={st.cabecalhoTitulo}>{titulo}</Text>
      </View>
    </View>
  );
}

/** Rótulo pequeno acima de cada campo. */
export function Rotulo({ children, primeiro }: { children: React.ReactNode; primeiro?: boolean }) {
  return <Text style={[st.rotulo, primeiro && { marginTop: 0 }]}>{children}</Text>;
}

// ---------------------------------------------------------------
// Avatar do médico (foto ou iniciais)
// ---------------------------------------------------------------
const iniciais = (nome: string) =>
  nome
    .replace(/^(dr\.?|dra\.?)\s+/i, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

function Avatar({ medico, tamanho }: { medico: Medico; tamanho: number }) {
  const caixa = { width: tamanho, height: tamanho, borderRadius: tamanho / 2 };
  if (medico.fotoUrl) {
    return <Image source={{ uri: medico.fotoUrl }} style={[st.avatarFoto, caixa]} />;
  }
  return (
    <View style={[st.avatarIniciais, caixa]}>
      <Text style={st.avatarTexto}>{iniciais(medico.nome)}</Text>
    </View>
  );
}

// ---------------------------------------------------------------
// Paciente (Nova Consulta: busca na lista / Reagendar: só leitura)
// ---------------------------------------------------------------
export function CampoPaciente({
  pessoa,
  pacientes,
  aberto,
  busca,
  onAlternar,
  onBusca,
  onSelecionar,
}: {
  pessoa: Pessoa | null;
  pacientes: Pessoa[];
  aberto: boolean;
  busca: string;
  onAlternar: () => void;
  onBusca: (t: string) => void;
  onSelecionar: (p: Pessoa) => void;
}) {
  const filtrados = useMemo(
    () => pacientes.filter((p) => p.nome.toLowerCase().includes(busca.toLowerCase())),
    [pacientes, busca],
  );

  return (
    <View>
      <TouchableOpacity style={[st.campo, st.campoPaciente]} activeOpacity={0.7} onPress={onAlternar}>
        <MaterialIcons name="search" size={24} color={COR.placeholder} />
        <Text
          style={[st.campoTexto, !pessoa && { color: COR.placeholder }]}
          numberOfLines={1}
        >
          {pessoa ? pessoa.nome : 'Buscar paciente'}
        </Text>
        <MaterialIcons name="arrow-drop-down" size={24} color={COR.placeholder} style={{ marginRight: 5 }} />
      </TouchableOpacity>

      {aberto && (
        <View style={st.painel}>
          <TextInput
            style={st.painelBusca}
            placeholder="Digite o nome"
            placeholderTextColor={COR.placeholder}
            value={busca}
            onChangeText={onBusca}
            autoFocus
          />
          <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
            {filtrados.length === 0 ? (
              <Text style={st.vazio}>Nenhum paciente encontrado.</Text>
            ) : (
              filtrados.map((p) => (
                <TouchableOpacity key={p.id} style={st.painelItem} onPress={() => onSelecionar(p)}>
                  <Text style={st.painelItemTexto}>{p.nome}</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

export function CampoPacienteLeitura({ nome }: { nome: string }) {
  return (
    <View style={[st.campo, st.campoPaciente, { paddingLeft: 19 }]}>
      <Text style={[st.campoTexto, { marginLeft: 0 }]} numberOfLines={1}>
        {nome}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------
// Especialista (foto + nome + especialidade, abre lista ao tocar)
// ---------------------------------------------------------------
export function CampoEspecialista({
  medico,
  medicos,
  aberto,
  onAlternar,
  onSelecionar,
}: {
  medico: Medico | null;
  medicos: Medico[];
  aberto: boolean;
  onAlternar: () => void;
  onSelecionar: (m: Medico) => void;
}) {
  return (
    <View>
      <TouchableOpacity style={[st.campo, st.campoMedico]} activeOpacity={0.7} onPress={onAlternar}>
        {medico ? (
          <>
            <Avatar medico={medico} tamanho={39} />
            <View style={st.medicoTextos}>
              <Text style={st.medicoNome} numberOfLines={1}>
                {medico.nome}
              </Text>
              <Text style={st.medicoEsp} numberOfLines={1}>
                {medico.especialidade}
              </Text>
            </View>
          </>
        ) : (
          <Text style={[st.campoTexto, { color: COR.placeholder, marginLeft: 8 }]}>
            Selecionar especialista
          </Text>
        )}
        <MaterialIcons name="keyboard-arrow-down" size={24} color={COR.placeholder} style={{ marginRight: 7 }} />
      </TouchableOpacity>

      {aberto && (
        <View style={st.painel}>
          <ScrollView style={{ maxHeight: 240 }} nestedScrollEnabled>
            {medicos.length === 0 ? (
              <Text style={st.vazio}>Nenhum médico cadastrado.</Text>
            ) : (
              medicos.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={[st.painelItem, { flexDirection: 'row', alignItems: 'center' }]}
                  onPress={() => onSelecionar(m)}
                >
                  <Avatar medico={m} tamanho={36} />
                  <View style={[st.medicoTextos, { marginLeft: 12 }]}>
                    <Text style={st.medicoNome} numberOfLines={1}>
                      {m.nome}
                    </Text>
                    <Text style={st.medicoEsp} numberOfLines={1}>
                      {m.especialidade}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------
// Calendário
// ---------------------------------------------------------------
export function CalendarioConsulta({
  mesVisivel,
  onMudarMes,
  dataSelecionada,
  onSelecionar,
}: {
  mesVisivel: Date;
  onMudarMes: (delta: number) => void;
  dataSelecionada: Date | null;
  onSelecionar: (d: Date) => void;
}) {
  const hoje = inicioDoDia(new Date());

  const celulas = useMemo(() => {
    const ano = mesVisivel.getFullYear();
    const mes = mesVisivel.getMonth();
    const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();
    const diasMesAnterior = new Date(ano, mes, 0).getDate();
    const lista: { dia: number; data: Date; doMes: boolean }[] = [];
    for (let i = primeiroDiaSemana - 1; i >= 0; i--) {
      const dia = diasMesAnterior - i;
      lista.push({ dia, data: new Date(ano, mes - 1, dia), doMes: false });
    }
    for (let dia = 1; dia <= diasNoMes; dia++) {
      lista.push({ dia, data: new Date(ano, mes, dia), doMes: true });
    }
    return lista;
  }, [mesVisivel]);

  const podeVoltar =
    mesVisivel.getFullYear() > hoje.getFullYear() ||
    (mesVisivel.getFullYear() === hoje.getFullYear() && mesVisivel.getMonth() > hoje.getMonth());

  return (
    <View style={st.calendario}>
      <View style={st.calCabecalho}>
        <TouchableOpacity style={st.calSeta} onPress={() => onMudarMes(-1)} disabled={!podeVoltar} hitSlop={10}>
          <MaterialIcons name="chevron-left" size={24} color={podeVoltar ? COR.suave : COR.borda} />
        </TouchableOpacity>
        <Text style={st.calMes}>
          {MESES[mesVisivel.getMonth()]} {mesVisivel.getFullYear()}
        </Text>
        <TouchableOpacity style={st.calSeta} onPress={() => onMudarMes(1)} hitSlop={10}>
          <MaterialIcons name="chevron-right" size={24} color={COR.suave} />
        </TouchableOpacity>
      </View>

      <View style={st.calSemana}>
        {DIAS_SEMANA.map((d, i) => (
          <Text key={i} style={st.calSemanaTexto}>
            {d}
          </Text>
        ))}
      </View>

      <View style={st.calGrade}>
        {celulas.map((c, i) => {
          const desabilitado = !c.doMes || c.data < hoje;
          const selecionado = c.doMes && mesmaData(dataSelecionada, c.data);
          return (
            <View key={i} style={st.calCelula}>
              <TouchableOpacity
                disabled={desabilitado}
                onPress={() => onSelecionar(c.data)}
                style={[st.calDia, selecionado && st.calDiaSelecionado]}
              >
                <Text
                  style={[
                    st.calDiaTexto,
                    desabilitado && { color: COR.borda },
                    selecionado && st.calDiaTextoSelecionado,
                  ]}
                >
                  {c.dia}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------
// Horários disponíveis
// ---------------------------------------------------------------
export function GradeHorarios({
  periodo,
  onPeriodo,
  pronto,
  dataSelecionada,
  ocupados,
  horario,
  onSelecionar,
}: {
  periodo: Periodo;
  onPeriodo: (p: Periodo) => void;
  pronto: boolean; // já escolheu médico e data?
  dataSelecionada: Date | null;
  ocupados: string[];
  horario: string | null;
  onSelecionar: (h: string) => void;
}) {
  const { width } = useWindowDimensions();
  const larguraSlot = (width - 40 - 24) / 4; // 4 por linha, 20 de margem de cada lado, 8 de espaço

  return (
    <View>
      <View style={st.horariosTopo}>
        <Text style={[st.rotulo, { marginTop: 0, marginBottom: 0 }]}>Horários Disponíveis</Text>
        <View style={{ flexDirection: 'row' }}>
          {(Object.keys(HORARIOS) as Periodo[]).map((p) => (
            <TouchableOpacity key={p} onPress={() => onPeriodo(p)} hitSlop={8}>
              <Text style={[st.periodo, periodo === p ? st.periodoAtivo : st.periodoInativo]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {!pronto ? (
        <Text style={st.dica}>Escolha o especialista e a data para ver os horários.</Text>
      ) : (
        <View style={st.horariosGrade}>
          {HORARIOS[periodo].map((h) => {
            const indisponivel = ocupados.includes(h) || horarioJaPassou(h, dataSelecionada);
            const selecionado = horario === h;
            return (
              <TouchableOpacity
                key={h}
                disabled={indisponivel}
                onPress={() => onSelecionar(h)}
                style={[
                  st.horario,
                  { width: larguraSlot },
                  indisponivel && { opacity: 0.5 },
                  selecionado && st.horarioSelecionado,
                ]}
              >
                <Text style={[st.horarioTexto, selecionado && { color: COR.branco }]}>{h}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------
// Tipo de consulta (chips)
// ---------------------------------------------------------------
export function ChipsTipoConsulta({
  valor,
  onSelecionar,
}: {
  valor: string | null;
  onSelecionar: (t: string) => void;
}) {
  return (
    <View style={st.chips}>
      {TIPOS_CONSULTA.map((t) => {
        const ativo = valor === t;
        return (
          <TouchableOpacity key={t} style={[st.chip, ativo && st.chipAtivo]} onPress={() => onSelecionar(t)}>
            <Text style={[st.chipTexto, ativo && { color: COR.destaqueTexto }]}>{t}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------
// Botão fixo no rodapé
// ---------------------------------------------------------------
export function RodapeConfirmar({
  texto,
  pronto,
  salvando,
  onPress,
}: {
  texto: string;
  pronto: boolean; // formulário completo? (só deixa o botão mais apagado, o toque continua avisando o que falta)
  salvando: boolean;
  onPress: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[st.rodape, { paddingBottom: Math.max(insets.bottom, 20) }]}>
      <TouchableOpacity
        style={[st.botao, (!pronto || salvando) && { opacity: 0.55 }]}
        onPress={onPress}
        disabled={salvando}
      >
        {salvando ? <ActivityIndicator color="#fff" /> : <Text style={st.botaoTexto}>{texto}</Text>}
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------
// Estilos
// ---------------------------------------------------------------
const sombra = {
  shadowColor: '#000',
  shadowOpacity: 0.05,
  shadowRadius: 2,
  shadowOffset: { width: 0, height: 1 },
  elevation: 1,
};

const st = StyleSheet.create({
  // cabeçalho
  cabecalho: { backgroundColor: COR.branco, borderBottomWidth: 1, borderBottomColor: COR.borda },
  cabecalhoLinha: { height: 63, paddingTop: 1, alignItems: 'center', justifyContent: 'center' },
  voltar: { position: 'absolute', left: 24, top: 16 },
  cabecalhoTitulo: { fontFamily: FONT.semibold, fontSize: 20, lineHeight: 28, color: COR.escuro },

  rotulo: {
    fontFamily: FONT.regular,
    fontSize: 12,
    lineHeight: 16,
    color: COR.texto,
    marginTop: 25,
    marginBottom: 7,
  },

  // campos (paciente / especialista)
  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COR.branco,
    borderWidth: 1,
    borderColor: COR.borda,
    borderRadius: 8,
    ...sombra,
  },
  campoPaciente: { height: 48, paddingLeft: 9 },
  campoMedico: { height: 66, paddingLeft: 12 },
  campoTexto: { flex: 1, marginLeft: 9, fontFamily: FONT.regular, fontSize: 14, color: COR.texto },

  medicoTextos: { flex: 1, marginLeft: 13, paddingTop: 2 },
  medicoNome: { fontFamily: FONT.bold, fontSize: 12, lineHeight: 16, letterSpacing: 0.5, color: COR.texto },
  medicoEsp: { fontFamily: FONT.regular, fontSize: 12, lineHeight: 16, color: COR.suave },

  avatarFoto: { borderWidth: 1, borderColor: COR.borda },
  avatarIniciais: {
    backgroundColor: '#D3E4FE',
    borderWidth: 1,
    borderColor: COR.borda,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTexto: { fontFamily: FONT.semibold, fontSize: 13, color: COR.escuro },

  // lista que abre embaixo do campo
  painel: {
    backgroundColor: COR.branco,
    borderWidth: 1,
    borderColor: COR.borda,
    borderRadius: 8,
    marginTop: 6,
    overflow: 'hidden',
  },
  painelBusca: {
    padding: 14,
    fontFamily: FONT.regular,
    fontSize: 14,
    color: COR.texto,
    borderBottomWidth: 1,
    borderBottomColor: '#E5EAEC',
  },
  painelItem: { paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#F0F3F4' },
  painelItemTexto: { fontFamily: FONT.regular, fontSize: 14, color: COR.texto },
  vazio: { padding: 16, fontFamily: FONT.regular, fontSize: 14, color: COR.suave, textAlign: 'center' },

  // calendário
  calendario: {
    backgroundColor: COR.branco,
    borderWidth: 1,
    borderColor: COR.borda,
    borderRadius: 8,
    paddingTop: 18,
    paddingBottom: 14,
    paddingHorizontal: 15,
    ...sombra,
  },
  calCabecalho: {
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: -3,
  },
  calSeta: { marginTop: -10 }, // as setas ficam 5px acima do título no protótipo
  calMes: { fontFamily: FONT.bold, fontSize: 12, letterSpacing: 0.5, color: COR.texto },
  calSemana: { flexDirection: 'row', marginTop: 16, height: 20, alignItems: 'center' },
  calSemanaTexto: {
    width: '14.2857%',
    textAlign: 'center',
    fontFamily: FONT.medium,
    fontSize: 12,
    color: COR.suave,
  },
  calGrade: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 3 },
  calCelula: { width: '14.2857%', height: 40, alignItems: 'center', justifyContent: 'center' },
  calDia: { width: 42, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  calDiaSelecionado: { backgroundColor: COR.destaque },
  calDiaTexto: { fontFamily: FONT.regular, fontSize: 14, color: COR.texto },
  calDiaTextoSelecionado: { fontFamily: FONT.bold, color: COR.destaqueTexto },

  // horários
  horariosTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 25,
    marginBottom: 7,
  },
  periodo: { fontFamily: FONT.regular, fontSize: 12, lineHeight: 16, marginLeft: 14 },
  periodoAtivo: { color: COR.suave },
  periodoInativo: { color: COR.borda },
  dica: { fontFamily: FONT.regular, fontSize: 12, lineHeight: 16, color: COR.suave },
  horariosGrade: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  horario: {
    height: 38,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COR.borda,
    alignItems: 'center',
    justifyContent: 'center',
  },
  horarioSelecionado: { backgroundColor: COR.escuro, borderColor: COR.escuro },
  horarioTexto: { fontFamily: FONT.regular, fontSize: 14, color: COR.texto },

  // chips
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    height: 34,
    paddingHorizontal: 17,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: COR.borda,
    backgroundColor: COR.branco,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipAtivo: { backgroundColor: COR.destaque, borderColor: COR.destaque },
  chipTexto: { fontFamily: FONT.regular, fontSize: 12, color: COR.suave },

  // rodapé
  rodape: {
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: COR.branco,
    borderTopWidth: 1,
    borderTopColor: COR.borda,
  },
  botao: {
    height: 56,
    borderRadius: 8,
    backgroundColor: COR.botao,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoTexto: { fontFamily: FONT.bold, fontSize: 12, letterSpacing: 0.55, color: COR.branco },
});