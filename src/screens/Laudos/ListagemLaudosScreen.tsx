import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Alert, Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { collection, query, orderBy, getDocs, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { auth, db, storage } from '../../lib/firebase';
import SwipeableRow from '../../utils/SwipeableRow';
import ConfirmDeleteModal from '../../utils/ConfirmDeleteModal';
import BarraNavegacao from '../../utils/BarraNavegacao';
import { estilos } from './estilo_laudo';

interface Laudo {
  id: string;
  pacienteNome: string;
  medicoNome: string;
  medicoEspecialidade?: string;
  tipoExame: string;
  dataExame: Timestamp;
  criadoEm?: Timestamp;
  arquivoUrl: string | null;
  arquivoCaminho: string | null;
}

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const normalizar = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function formatarData(t?: Timestamp): string {
  if (!t) return '';
  const d = t.toDate();
  const hoje = new Date();
  const ontem = new Date();
  ontem.setDate(hoje.getDate() - 1);

  const hora = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

  if (d.toDateString() === hoje.toDateString()) return `Hoje, ${hora}`;
  if (d.toDateString() === ontem.toDateString()) return `Ontem, ${hora}`;
  return `${String(d.getDate()).padStart(2, '0')} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

function corTag(tipo: string) {
  if (normalizar(tipo).includes('cardio')) return { bg: '#FFDAD6', texto: '#93000A' };
  return { bg: '#D3E4FE', texto: '#00497A' };
}

export default function ListagemLaudosScreen({ navigation }: { navigation: any }) {
  const [laudos, setLaudos] = useState<Laudo[]>([]);
  const [busca, setBusca] = useState('');
  const [laudoParaExcluir, setLaudoParaExcluir] = useState<Laudo | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  async function fetchLaudos(): Promise<void> {
    const clinicaId = auth.currentUser?.uid;
    if (!clinicaId) return;
    try {
      const q = query(
        collection(db, 'clinicas', clinicaId, 'laudos'),
        orderBy('criadoEm', 'desc'),
      );
      const snap = await getDocs(q);
      setLaudos(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Laudo)));
    } catch (erro) {
      console.log(erro);
      Alert.alert('Erro', 'Não foi possível carregar os laudos.');
    }
  }

  useFocusEffect(
    useCallback(() => {
      fetchLaudos();
    }, []),
  );

  const termo = normalizar(busca.trim());
  const filtrados = laudos.filter(
    (l) =>
      normalizar(l.pacienteNome ?? '').includes(termo) ||
      normalizar(l.tipoExame ?? '').includes(termo) ||
      normalizar(l.medicoNome ?? '').includes(termo),
  );

  function abrirArquivo(l: Laudo) {
    if (l.arquivoUrl) Linking.openURL(l.arquivoUrl);
    else Alert.alert('Sem anexo', 'Este laudo não possui arquivo anexado.');
  }

  async function confirmarExclusao(): Promise<void> {
    const clinicaId = auth.currentUser?.uid;
    if (!laudoParaExcluir || !clinicaId) return;
    setExcluindo(true);
    try {
      if (laudoParaExcluir.arquivoCaminho) {
        await deleteObject(ref(storage, laudoParaExcluir.arquivoCaminho));
      }
      await deleteDoc(doc(db, 'clinicas', clinicaId, 'laudos', laudoParaExcluir.id));
      setLaudos((atuais) => atuais.filter((l) => l.id !== laudoParaExcluir.id));
      setLaudoParaExcluir(null);
    } catch (erro) {
      console.log(erro);
      Alert.alert('Erro', 'Não foi possível excluir o laudo.');
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <View style={estilos.telaLista}>
      <View style={estilos.conteudoLista}>
        <View style={estilos.headerLista}>
          <Text style={estilos.tituloLista}>Laudos e Exames</Text>
          <TouchableOpacity style={estilos.botaoAdd} onPress={() => navigation.navigate('LaudoAdd')}>
            <Ionicons name="add" size={26} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={estilos.buscaBox}>
          <Ionicons name="search" size={20} color="#70787B" style={estilos.icon} />
          <TextInput
            style={estilos.buscaInput}
            placeholder="Buscar paciente..."
            placeholderTextColor="#6B7280"
            value={busca}
            onChangeText={setBusca}
          />
        </View>

        <FlatList
          data={filtrados}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const cor = corTag(item.tipoExame ?? '');
            const medico = item.medicoEspecialidade
              ? `${item.medicoNome} (${item.medicoEspecialidade})`
              : item.medicoNome;

            return (
              <SwipeableRow onDelete={() => setLaudoParaExcluir(item)}>
                <TouchableOpacity
                  style={estilos.MedicalReportBox}
                  activeOpacity={0.8}
                  onPress={() => abrirArquivo(item)}
                >
                  <View style={estilos.cardTopo}>
                    <View style={[estilos.tag, { backgroundColor: cor.bg }]}>
                      <Text style={[estilos.tagTexto, { color: cor.texto }]}>
                        {(item.tipoExame ?? '').toUpperCase()}
                      </Text>
                    </View>
                    <Text style={estilos.cardData}>{formatarData(item.criadoEm)}</Text>
                  </View>

                  <Text style={estilos.cardNome} numberOfLines={1}>
                    {item.pacienteNome}
                  </Text>

                  <View style={estilos.cardMedicoLinha}>
                    <MaterialCommunityIcons name="stethoscope" size={16} color="#40484B" />
                    <Text style={estilos.cardMedicoTexto} numberOfLines={1}>
                      {medico}
                    </Text>
                  </View>
                </TouchableOpacity>
              </SwipeableRow>
            );
          }}
          ListEmptyComponent={<Text style={estilos.vazio}>Nenhum laudo encontrado.</Text>}
        />
      </View>

      <BarraNavegacao ativa="inicio" />

      <ConfirmDeleteModal
        visible={laudoParaExcluir !== null}
        title="Excluir Laudo?"
        message="O laudo e o arquivo anexado serão removidos permanentemente. Esta ação não pode ser desfeita."
        onCancel={() => setLaudoParaExcluir(null)}
        onConfirm={confirmarExclusao}
        loading={excluindo}
      />
    </View>
  );
}