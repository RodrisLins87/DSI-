import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRoute } from '@react-navigation/native';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import {
  COR,
  Medico,
  Periodo,
  lerNome,
  lerData,
  formatarData,
  inicioDoDia,
  buscarHorariosOcupados,
  useHorariosOcupados,
  CabecalhoTela,
  Rotulo,
  CampoPacienteLeitura,
  CampoEspecialista,
  CalendarioConsulta,
  GradeHorarios,
  ChipsTipoConsulta,
  RodapeConfirmar,
} from './components/AgendamentoCampos';

/**
 * Reagendar Consulta: abre com os dados da consulta já preenchidos
 * (navigate('ReagendarConsulta', { consultaId })). O paciente não muda;
 * dá para trocar especialista, data, horário e tipo.
 */
export default function ReagendarConsultaScreen({ navigation }: { navigation: any }) {
  const route = useRoute<any>();
  const consultaId: string = route.params?.consultaId;

  const [carregando, setCarregando] = useState(true);
  const [pacienteNome, setPacienteNome] = useState('');
  const [medicos, setMedicos] = useState<Medico[]>([]);

  const [medico, setMedico] = useState<Medico | null>(null);
  const [abrirMedico, setAbrirMedico] = useState(false);

  const hoje = inicioDoDia(new Date());
  const [mesVisivel, setMesVisivel] = useState(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
  const [dataSelecionada, setDataSelecionada] = useState<Date | null>(null);

  const [periodo, setPeriodo] = useState<Periodo>('Manhã');
  const [horario, setHorario] = useState<string | null>(null);
  const [tipoConsulta, setTipoConsulta] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  // a própria consulta não conta como "horário ocupado"
  const [ocupados, setOcupados] = useHorariosOcupados(medico, dataSelecionada, consultaId);

  // ---------------- carregar a consulta e os médicos ----------------
  useEffect(() => {
    async function carregar() {
      const clinicaId = auth.currentUser?.uid;
      if (!clinicaId || !consultaId) return;
      try {
        const [consultaSnap, medicosSnap] = await Promise.all([
          getDoc(doc(db, 'consultas', consultaId)),
          getDocs(query(collection(db, 'medicos'), where('clinicaId', '==', clinicaId))),
        ]);
        const c: any = consultaSnap.data();

        if (!consultaSnap.exists() || !c || c.clinicaId !== clinicaId) {
          Alert.alert('Erro', 'Consulta não encontrada.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
          return;
        }
        if (c.status === 'cancelada' || c.status === 'realizada') {
          Alert.alert('Não é possível reagendar', `Esta consulta já está ${c.status}.`, [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
          return;
        }

        const lista: Medico[] = medicosSnap.docs
          .map((x) => {
            const d: any = x.data();
            return { id: x.id, nome: lerNome(d), especialidade: d.especialidade ?? '', fotoUrl: d.fotoUrl };
          })
          .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
        setMedicos(lista);

        setPacienteNome(c.pacienteNome ?? c.pacienteId ?? '');
        // se o médico foi removido depois, usa o que ficou salvo na própria consulta
        setMedico(
          lista.find((m) => m.id === c.medicoId) ?? {
            id: c.medicoId,
            nome: c.medicoNome ?? 'Médico',
            especialidade: c.medicoEspecialidade ?? '',
          },
        );
        setTipoConsulta(c.tipoConsulta ?? null);

        // só pré-seleciona a data/horário se ainda estiverem no futuro
        const dataAtual = lerData(c.data);
        if (dataAtual && dataAtual >= inicioDoDia(new Date())) {
          setDataSelecionada(dataAtual);
          setMesVisivel(new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 1));
          setHorario(c.horario ?? null);
          if (c.horario && Number(c.horario.slice(0, 2)) >= 12) setPeriodo('Tarde');
        }
      } catch {
        Alert.alert('Erro', 'Não foi possível carregar a consulta.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, [consultaId, navigation]);

  // ---------------- escolhas ----------------
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
  const formularioCompleto = !!(medico && dataSelecionada && horario && tipoConsulta);

  async function confirmar() {
    if (!medico || !dataSelecionada || !horario || !tipoConsulta) {
      Alert.alert('Atenção', 'Preencha todos os campos para reagendar.');
      return;
    }
    setSalvando(true);
    try {
      const agoraOcupados = await buscarHorariosOcupados(medico.id, dataSelecionada, consultaId);
      if (agoraOcupados.includes(horario)) {
        setOcupados(agoraOcupados);
        setHorario(null);
        Alert.alert('Horário indisponível', 'Esse horário acabou de ser ocupado. Escolha outro.');
        return;
      }
      await updateDoc(doc(db, 'consultas', consultaId), {
        medicoId: medico.id,
        medicoNome: medico.nome,
        medicoEspecialidade: medico.especialidade,
        data: formatarData(dataSelecionada),
        horario,
        tipoConsulta,
        status: 'pendente', // mudou o horário, então precisa ser confirmada de novo
        reagendadaEm: serverTimestamp(),
      });
      Alert.alert('Sucesso', 'Consulta reagendada!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch {
      Alert.alert('Erro', 'Não foi possível reagendar a consulta.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <View style={styles.container}>
      <CabecalhoTela titulo="Consulta" onVoltar={() => navigation.goBack()} desabilitado={salvando} />

      {carregando ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={COR.botao} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Rotulo primeiro>Paciente</Rotulo>
          <CampoPacienteLeitura nome={pacienteNome} />

          <Rotulo>Especialista</Rotulo>
          <CampoEspecialista
            medico={medico}
            medicos={medicos}
            aberto={abrirMedico}
            onAlternar={() => setAbrirMedico(!abrirMedico)}
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
        texto="CONFIRMAR REAGENDAMENTO"
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