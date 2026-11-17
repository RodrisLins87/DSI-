import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import {
  COR,
  Medico,
  Pessoa,
  Periodo,
  lerNome,
  formatarData,
  inicioDoDia,
  buscarHorariosOcupados,
  useHorariosOcupados,
  CabecalhoTela,
  Rotulo,
  CampoPaciente,
  CampoEspecialista,
  CalendarioConsulta,
  GradeHorarios,
  ChipsTipoConsulta,
  RodapeConfirmar,
} from './components/AgendamentoCampos';

export default function NovaConsultaScreen({ navigation }: { navigation: any }) {
  const [pacientes, setPacientes] = useState<Pessoa[]>([]);
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
  const [tipoConsulta, setTipoConsulta] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [ocupados, setOcupados] = useHorariosOcupados(medico, dataSelecionada);

  // ---------------- carregar pacientes e médicos da clínica ----------------
  useEffect(() => {
    async function carregar() {
      const clinicaId = auth.currentUser?.uid;
      if (!clinicaId) return;
      try {
        const buscar = (nome: string) =>
          getDocs(query(collection(db, nome), where('clinicaId', '==', clinicaId)));
        const [p, m] = await Promise.all([buscar('pacientes'), buscar('medicos')]);
        const ordenar = (a: Pessoa, b: Pessoa) => a.nome.localeCompare(b.nome, 'pt-BR');
        setPacientes(p.docs.map((x) => ({ id: x.id, nome: lerNome(x.data()) })).sort(ordenar));
        setMedicos(
          m.docs
            .map((x) => {
              const d: any = x.data();
              return { id: x.id, nome: lerNome(d), especialidade: d.especialidade ?? '', fotoUrl: d.fotoUrl };
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

  // ---------------- escolhas (trocar médico ou dia limpa o horário já marcado) ----------------
  function escolherMedico(m: Medico) {
    setMedico(m);
    setAbrirMedico(false);
    setHorario(null);
  }

  function escolherData(d: Date) {
    setDataSelecionada(d);
    setHorario(null);
  }

  function mudarMes(delta: number) {
    setMesVisivel(new Date(mesVisivel.getFullYear(), mesVisivel.getMonth() + delta, 1));
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
      const agoraOcupados = await buscarHorariosOcupados(medico.id, dataSelecionada);
      if (agoraOcupados.includes(horario)) {
        setOcupados(agoraOcupados);
        setHorario(null);
        Alert.alert('Horário indisponível', 'Esse horário acabou de ser ocupado. Escolha outro.');
        return;
      }
      await addDoc(collection(db, 'consultas'), {
        clinicaId: auth.currentUser.uid,
        pacienteId: pessoa.id,
        pacienteNome: pessoa.nome,
        medicoId: medico.id,
        medicoNome: medico.nome,
        medicoEspecialidade: medico.especialidade,
        data: formatarData(dataSelecionada),
        horario,
        tipoConsulta,
        status: 'pendente',
        criadaEm: serverTimestamp(),
      });
      Alert.alert('Sucesso', 'Consulta agendada!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch {
      Alert.alert('Erro', 'Não foi possível agendar a consulta.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <View style={styles.container}>
      <CabecalhoTela titulo="Nova Consulta" onVoltar={() => navigation.goBack()} desabilitado={salvando} />

      {carregando ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={COR.botao} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Rotulo primeiro>Selecionar Paciente</Rotulo>
          <CampoPaciente
            pessoa={pessoa}
            pacientes={pacientes}
            aberto={abrirPessoa}
            busca={buscaPessoa}
            onAlternar={() => {
              setAbrirPessoa(!abrirPessoa);
              setAbrirMedico(false);
            }}
            onBusca={setBuscaPessoa}
            onSelecionar={(p) => {
              setPessoa(p);
              setAbrirPessoa(false);
              setBuscaPessoa('');
            }}
          />

          <Rotulo>Especialista</Rotulo>
          <CampoEspecialista
            medico={medico}
            medicos={medicos}
            aberto={abrirMedico}
            onAlternar={() => {
              setAbrirMedico(!abrirMedico);
              setAbrirPessoa(false);
            }}
            onSelecionar={escolherMedico}
          />

          <Rotulo>Data da Consulta</Rotulo>
          <CalendarioConsulta
            mesVisivel={mesVisivel}
            onMudarMes={mudarMes}
            dataSelecionada={dataSelecionada}
            onSelecionar={escolherData}
          />

          <GradeHorarios
            periodo={periodo}
            onPeriodo={setPeriodo}
            pronto={!!medico && !!dataSelecionada}
            dataSelecionada={dataSelecionada}
            ocupados={ocupados}
            horario={horario}
            onSelecionar={setHorario}
          />

          <Rotulo>Tipo de Consulta</Rotulo>
          <ChipsTipoConsulta valor={tipoConsulta} onSelecionar={setTipoConsulta} />
        </ScrollView>
      )}

      <RodapeConfirmar
        texto="CONFIRMAR AGENDAMENTO"
        pronto={formularioCompleto}
        salvando={salvando}
        onPress={confirmar}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COR.fundo },
  scroll: { paddingHorizontal: 20, paddingTop: 17, paddingBottom: 28 },
});