import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { collection, addDoc, doc, getDoc, getDocs, updateDoc, query, where, serverTimestamp } from 'firebase/firestore';import { auth, db } from '../../lib/firebase';
import { maskCPF, maskPhone, maskDate, isValidDate  } from '../../utils/masks';

// Mesma paleta usada em NovaConsultaScreen.tsx
const COR = {
  fundo: '#F8F9FF',
  escuro: '#00353F',
  botao: '#004D5B',
  borda: '#BFC8CB',
  texto: '#1A2E35',
  suave: '#5B6B70',
  desabilitado: '#B8C0C4',
};

// remove acentos e deixa minúsculo para a busca (igual às outras telas)
const normalizar = (s: string): string =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

// "15/05/2010" -> idade em anos. Retorna null se a data for inválida ou estiver incompleta.
function calcularIdade(dataNascimento: string): number | null {
  if (!isValidDate(dataNascimento)) return null;
  const [dia, mes, ano] = dataNascimento.split('/').map(Number);
  const hoje = new Date();
  let idade = hoje.getFullYear() - ano;
  const jaFezAniversario =
    hoje.getMonth() + 1 > mes || (hoje.getMonth() + 1 === mes && hoje.getDate() >= dia);
  if (!jaFezAniversario) idade -= 1;
  return idade;
}

/**
 * Tela única de formulário de paciente (cadastro + edição).
 *
 * Como ela decide o modo:
 *  - navigation.navigate('FormularioPaciente')                     -> CADASTRO
 *  - navigation.navigate('FormularioPaciente', { pacienteId })     -> EDIÇÃO
 *
 * No modo edição, os dados são carregados do Firestore e o topo da tela
 * mostra avatar + nome (como no protótipo). No modo cadastro, os campos
 * começam vazios.
 */
export default function FormularioPacienteScreen({ navigation, route }: { navigation: any; route: any }) {
  const insets = useSafeAreaInsets();

  const pacienteId: string | undefined = route.params?.pacienteId;
  const modoEdicao = pacienteId !== undefined;

  const [carregando, setCarregando] = useState<boolean>(modoEdicao);
  const [salvando, setSalvando] = useState<boolean>(false);

  const [nomeCompleto, setNomeCompleto] = useState('');
  const [cpf, setCpf] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [genero, setGenero] = useState('');
  const [raca, setRaca] = useState('');
    // Responsável (obrigatório só para menores de 18 anos)
  const [responsavelId, setResponsavelId] = useState<string | null>(null);
  const [responsaveis, setResponsaveis] = useState<{ id: string; nome: string }[]>([]);
  const [abrirResponsavel, setAbrirResponsavel] = useState<boolean>(false);
  const [buscaResponsavel, setBuscaResponsavel] = useState<string>('');

  // Só no modo edição: busca os dados atuais do paciente
  useEffect(() => {
    if (!pacienteId) return;

    async function carregar() {
      try {
        const snap = await getDoc(doc(db, 'pacientes', pacienteId as string));
        if (snap.exists()) {
          const dados: any = snap.data();
          setNomeCompleto(dados.nomeCompleto ?? '');
          setCpf(dados.cpf ?? '');
          setDataNascimento(dados.dataNascimento ?? '');
          setTelefone(dados.telefone ?? '');
          setEmail(dados.email ?? '');
          setGenero(dados.genero ?? '');
          setRaca(dados.raca ?? '');
          setResponsavelId(dados.responsavelId ?? null);
        } else {
          Alert.alert('Erro', 'Paciente não encontrado.');
          navigation.goBack();
        }
      } catch {
        Alert.alert('Erro', 'Não foi possível carregar os dados do paciente.');
        navigation.goBack();
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, [pacienteId]);

    // Busca os responsáveis cadastrados na clínica para o seletor
  useEffect(() => {
    async function carregarResponsaveis() {
      const clinicaId = auth.currentUser?.uid;
      if (!clinicaId) return;
      try {
        const snap = await getDocs(
          query(collection(db, 'responsaveis'), where('clinicaId', '==', clinicaId)),
        );
        const lista = snap.docs.map((d) => ({ id: d.id, nome: (d.data() as any).nome ?? '(sem nome)' }));
        lista.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
        setResponsaveis(lista);
      } catch {
        Alert.alert('Erro', 'Não foi possível carregar os responsáveis.');
      }
    }
    carregarResponsaveis();
  }, []);

  const idade = calcularIdade(dataNascimento);
  const menorDeIdade = idade !== null && idade < 18;
  const faltaResponsavel = menorDeIdade && !responsavelId;

  // Só usado para deixar o botão SALVAR mais apagado enquanto o formulário não está pronto
  const formularioCompleto =
    nomeCompleto.trim().length > 0 && cpf.trim().length > 0 && idade !== null && !faltaResponsavel;

  const responsavelSelecionado = responsaveis.find((r) => r.id === responsavelId) ?? null;
  const responsaveisFiltrados = responsaveis.filter((r) =>
    normalizar(r.nome).includes(normalizar(buscaResponsavel.trim())),
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

  async function salvar(): Promise<void> {
    if (nomeCompleto.trim().length === 0 || cpf.trim().length === 0) {
      Alert.alert('Atenção', 'Preencha ao menos o nome completo e o CPF.');
      return;
    }
    if (idade === null) {
      Alert.alert('Atenção', 'Informe uma data de nascimento válida (DD/MM/AAAA).');
      return;
    }
    if (menorDeIdade && !responsavelId) {
      Alert.alert('Responsável obrigatório', 'Pacientes menores de 18 anos precisam ter um responsável associado.');
      return;
    }
    if (!auth.currentUser) return;

    setSalvando(true);
    try {
      const dados = {
        nomeCompleto: nomeCompleto.trim(),
        cpf,
        dataNascimento,
        telefone,
        email: email.trim(),
        genero,
        raca,
        responsavelId: responsavelId ?? null,
      };

      if (modoEdicao) {
        await updateDoc(doc(db, 'pacientes', pacienteId as string), dados);
      } else {
        await addDoc(collection(db, 'pacientes'), {
          clinicaId: auth.currentUser.uid,
          ...dados,
          criadoEm: serverTimestamp(),
        });
      }
      navigation.goBack();
    } catch {
      Alert.alert('Erro', modoEdicao ? 'Não foi possível salvar as alterações.' : 'Não foi possível cadastrar o paciente.');
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <View style={[styles.container, styles.centralizado]}>
        <ActivityIndicator color={COR.botao} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color={COR.escuro} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{modoEdicao ? 'Paciente' : 'Cadastrar Paciente'}</Text>
        <View style={styles.back} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Avatar + nome (só na edição, como no protótipo) */}
        {modoEdicao && (
          <View style={styles.perfilTopo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarTexto}>{iniciais(nomeCompleto)}</Text>
            </View>
            <Text style={styles.perfilNome}>{nomeCompleto}</Text>
          </View>
        )}

        <Campo label={modoEdicao ? 'Nome Completo' : 'Nome completo'}>
          <TextInput
            style={styles.input}
            placeholder="Ex: Maria Silva"
            placeholderTextColor={COR.desabilitado}
            value={nomeCompleto}
            onChangeText={setNomeCompleto}
          />
        </Campo>

        <Campo label="CPF">
          <TextInput
            style={styles.input}
            placeholder="000.000.000-00"
            placeholderTextColor={COR.desabilitado}
            keyboardType="number-pad"
            value={cpf}
            onChangeText={(v) => setCpf(maskCPF(v))}
          />
        </Campo>

        <Campo label={modoEdicao ? 'Data de Nascimento' : 'Data de nascimento'}>
          <View style={styles.inputComIcone}>
            <TextInput
              style={styles.inputFlex}
              placeholder="DD/MM/AAAA"
              placeholderTextColor={COR.desabilitado}
              keyboardType="number-pad"
              value={dataNascimento}
              onChangeText={(v) => setDataNascimento(maskDate(v))}
            />
            <Ionicons name="calendar-outline" size={20} color={COR.suave} />
          </View>
        </Campo>

        <Campo label="Telefone">
          <TextInput
            style={styles.input}
            placeholder="(00) 00000-0000"
            placeholderTextColor={COR.desabilitado}
            keyboardType="phone-pad"
            value={telefone}
            onChangeText={(v) => setTelefone(maskPhone(v))}
          />
        </Campo>

        <Campo label="E-mail">
          <TextInput
            style={styles.input}
            placeholder="exemplo@email.com"
            placeholderTextColor={COR.desabilitado}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </Campo>

        <Campo label="Gênero">
          <TextInput
            style={styles.input}
            placeholder="Ex: Feminino"
            placeholderTextColor={COR.desabilitado}
            value={genero}
            onChangeText={setGenero}
          />
        </Campo>

        <Campo label="Raça">
          <TextInput
            style={styles.input}
            placeholder="Ex: Branco"
            placeholderTextColor={COR.desabilitado}
            value={raca}
            onChangeText={setRaca}
          />
        </Campo>
        <Campo label={menorDeIdade ? 'Responsável (obrigatório)' : 'Responsável (opcional)'}>
          <TouchableOpacity
            style={[styles.inputComIcone, faltaResponsavel && styles.inputErro]}
            onPress={() => setAbrirResponsavel(!abrirResponsavel)}
          >
            <Text
              style={[styles.inputFlex, !responsavelSelecionado && { color: COR.desabilitado }]}
              numberOfLines={1}
            >
              {responsavelSelecionado ? responsavelSelecionado.nome : 'Selecionar responsável'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={COR.suave} />
          </TouchableOpacity>

          {abrirResponsavel && (
            <View style={styles.painel}>
              <TextInput
                style={styles.painelBusca}
                placeholder="Digite o nome"
                placeholderTextColor={COR.desabilitado}
                value={buscaResponsavel}
                onChangeText={setBuscaResponsavel}
              />
              <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                {!menorDeIdade && responsavelSelecionado && (
                  <TouchableOpacity
                    style={styles.painelItem}
                    onPress={() => {
                      setResponsavelId(null);
                      setAbrirResponsavel(false);
                      setBuscaResponsavel('');
                    }}
                  >
                    <Text style={[styles.painelItemTexto, { color: COR.suave }]}>Remover responsável</Text>
                  </TouchableOpacity>
                )}
                {responsaveisFiltrados.length === 0 ? (
                  <Text style={styles.vazio}>
                    {responsaveis.length === 0 ? 'Nenhum responsável cadastrado.' : 'Nenhum responsável encontrado.'}
                  </Text>
                ) : (
                  responsaveisFiltrados.map((r) => (
                    <TouchableOpacity
                      key={r.id}
                      style={styles.painelItem}
                      onPress={() => {
                        setResponsavelId(r.id);
                        setAbrirResponsavel(false);
                        setBuscaResponsavel('');
                      }}
                    >
                      <Text style={styles.painelItemTexto}>{r.nome}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          )}

          {faltaResponsavel && (
            <Text style={styles.erroTexto}>Paciente menor de 18 anos: selecione um responsável.</Text>
          )}
        </Campo>
      </ScrollView>

      {/* Botão fixo no rodapé */}
      <View style={[styles.rodape, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={[styles.botao, (!formularioCompleto || salvando) && { opacity: 0.55 }]}
          onPress={salvar}
          disabled={salvando}
        >
          {salvando ? <ActivityIndicator color="#fff" /> : <Text style={styles.botaoTexto}>SALVAR</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 4 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COR.fundo },
  centralizado: { alignItems: 'center', justifyContent: 'center' },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFFFFF' },
  back: { width: 32 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COR.escuro },

  scroll: { padding: 20, paddingBottom: 32 },

  perfilTopo: { alignItems: 'center', marginBottom: 12 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#D3E4FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarTexto: { fontWeight: '700', fontSize: 20, color: COR.escuro },
  perfilNome: { fontSize: 18, fontWeight: '700', color: COR.texto },

  label: { fontSize: 14, color: COR.texto, marginTop: 20, marginBottom: 8 },

  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COR.borda,
    borderRadius: 12,
    paddingHorizontal: 16,
    minHeight: 56,
    fontSize: 16,
    color: COR.texto,
  },
  inputComIcone: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COR.borda,
    borderRadius: 12,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  inputFlex: { flex: 1, fontSize: 16, color: COR.texto },
  inputErro: { borderColor: '#BA1A1A' },
  erroTexto: { color: '#BA1A1A', fontSize: 12, marginTop: 6 },

  painel: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: COR.borda, borderRadius: 12, marginTop: 6, overflow: 'hidden' },
  painelBusca: { padding: 14, fontSize: 16, color: COR.texto, borderBottomWidth: 1, borderBottomColor: '#E5EAEC' },
  painelItem: { paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F0F3F4' },
  painelItemTexto: { fontSize: 16, color: COR.texto },
  vazio: { padding: 16, color: COR.suave, textAlign: 'center' },

  rodape: { paddingHorizontal: 20, paddingTop: 14, backgroundColor: COR.fundo, borderTopWidth: 1, borderTopColor: COR.borda },
  botao: { backgroundColor: COR.botao, borderRadius: 12, height: 56, alignItems: 'center', justifyContent: 'center' },
  botaoTexto: { color: '#FFFFFF', fontWeight: '700', fontSize: 14, letterSpacing: 0.6 },
});
