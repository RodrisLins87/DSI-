import {
    View, ScrollView, Text, TextInput, TouchableOpacity, Modal, FlatList, ActivityIndicator, Linking,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { estilos } from './estilo_laudo';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useFonts, Manrope_400Regular, Manrope_700Bold } from '@expo-google-fonts/manrope';
import * as DocumentPicker from 'expo-document-picker';
import * as mascaras from '../../utils/masks';
import { auth, db, storage } from '../../lib/firebase';
import {
    collection, doc, getDoc, getDocs, updateDoc, serverTimestamp, query, where,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

type Item = { id: string; nome: string; especialidade?: string };

type Anexo = {
    nome: string;
    url: string;
    caminho: string;
    tamanho: number | null;
    tipo: string | null;
};

function formatarTamanho(bytes: number | null): string {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function LaudoEditScreen({ navigation, route }: { navigation: any; route: any }) {
    const [fontsLoaded] = useFonts({ Manrope_400Regular, Manrope_700Bold });

    const clinicaID = auth.currentUser?.uid;
    const laudoId: string | undefined = route.params?.laudoId;

    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);

    const [pacientes, setPacientes] = useState<Item[]>([]);
    const [medicos, setMedicos] = useState<Item[]>([]);
    const [pacienteSel, setPacienteSel] = useState<Item | null>(null);
    const [medicoSel, setMedicoSel] = useState<Item | null>(null);
    const [seletor, setSeletor] = useState<'paciente' | 'medico' | null>(null);
    const [busca, setBusca] = useState('');

    const [tipoExame, setTipoExame] = useState('');
    const [dataExame, setDataExame] = useState('');
    const [observacoes, setObservacoes] = useState('');

    const [anexo, setAnexo] = useState<Anexo | null>(null);
    const [novoArquivo, setNovoArquivo] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

    useEffect(() => {
        async function carregar() {
            if (!clinicaID || !laudoId) return;
            try {
                const snap = await getDoc(doc(db, 'clinicas', clinicaID, 'laudos', laudoId));
                if (!snap.exists()) {
                    alert('Laudo não encontrado.');
                    navigation.goBack();
                    return;
                }
                const d = snap.data();

                setPacienteSel({ id: d.pacienteId, nome: d.pacienteNome });
                setMedicoSel({
                    id: d.medicoId,
                    nome: d.medicoNome,
                    especialidade: d.medicoEspecialidade ?? '',
                });
                setTipoExame(d.tipoExame ?? '');
                setObservacoes(d.observacoes ?? '');

                const data = d.dataExame?.toDate?.();
                if (data) {
                    const dd = String(data.getDate()).padStart(2, '0');
                    const mm = String(data.getMonth() + 1).padStart(2, '0');
                    setDataExame(`${dd}/${mm}/${data.getFullYear()}`);
                }

                if (d.arquivoUrl) {
                    setAnexo({
                        nome: d.nomeArquivo ?? 'arquivo',
                        url: d.arquivoUrl,
                        caminho: d.arquivoCaminho,
                        tamanho: d.arquivoTamanho ?? null,
                        tipo: d.arquivoTipo ?? null,
                    });
                }

                const snapMed = await getDocs(
                    query(collection(db, 'medicos'), where('clinicaId', '==', clinicaID))
                );
                setMedicos(
                    snapMed.docs
                        .map((m) => ({
                            id: m.id,
                            nome: (m.data().nome ?? '') as string,
                            especialidade: m.data().especialidade as string,
                        }))
                        .sort((a, b) => a.nome.localeCompare(b.nome))
                );

                const snapPac = await getDocs(
                    query(collection(db, 'pacientes'), where('clinicaId', '==', clinicaID))
                );
                setPacientes(
                    snapPac.docs
                        .map((p) => ({ id: p.id, nome: (p.data().nomeCompleto ?? '') as string }))
                        .sort((a, b) => a.nome.localeCompare(b.nome))
                );
            } catch (erro) {
                console.log(erro);
                alert('Não foi possível carregar o laudo.');
                navigation.goBack();
            } finally {
                setCarregando(false);
            }
        }
        carregar();
    }, []);

    async function escolherArquivo() {
        const resultado = await DocumentPicker.getDocumentAsync({
            type: ['application/pdf', 'image/*'],
            copyToCacheDirectory: true,
        });
        if (!resultado.canceled) {
            setNovoArquivo(resultado.assets[0]);
        }
    }

    function visualizar() {
        if (anexo?.url) Linking.openURL(anexo.url);
    }

    function fecharSeletor() {
        setSeletor(null);
        setBusca('');
    }

    function escolher(item: Item) {
        if (seletor === 'paciente') setPacienteSel(item);
        if (seletor === 'medico') setMedicoSel(item);
        fecharSeletor();
    }

    const lista = seletor === 'paciente' ? pacientes : medicos;
    const listaFiltrada = lista.filter((i) =>
        i.nome.toLowerCase().includes(busca.toLowerCase())
    );

    async function salvar() {
        if (!clinicaID || !laudoId) {
            alert('Não foi possível identificar a clínica.');
            return;
        }
        if (!pacienteSel || !tipoExame.trim() || !medicoSel) {
            alert('Preencha todos os campos obrigatórios!');
            return;
        }
        if (!mascaras.isValidDate(dataExame)) {
            alert('Digite uma data válida (dd/mm/aaaa).');
            return;
        }

        const [dia, mes, ano] = dataExame.split('/').map(Number);

        setSalvando(true);
        try {
            let dadosArquivo = {};
            const caminhoAntigo = anexo?.caminho ?? null;

            if (novoArquivo) {
                const caminho = `clinicas/${clinicaID}/laudos/${Date.now()}_${novoArquivo.name}`;
                const resposta = await fetch(novoArquivo.uri);
                const blob = await resposta.blob();
                const arquivoRef = ref(storage, caminho);
                await uploadBytes(arquivoRef, blob);

                dadosArquivo = {
                    nomeArquivo: novoArquivo.name,
                    arquivoUrl: await getDownloadURL(arquivoRef),
                    arquivoCaminho: caminho,
                    arquivoTamanho: novoArquivo.size ?? null,
                    arquivoTipo: novoArquivo.mimeType ?? null,
                };
            }

            await updateDoc(doc(db, 'clinicas', clinicaID, 'laudos', laudoId), {
                pacienteId: pacienteSel.id,
                pacienteNome: pacienteSel.nome,
                medicoId: medicoSel.id,
                medicoNome: medicoSel.nome,
                medicoEspecialidade: medicoSel.especialidade ?? '',
                tipoExame: tipoExame.trim(),
                dataExame: new Date(ano, mes - 1, dia),
                observacoes,
                ...dadosArquivo,
                atualizadoEm: serverTimestamp(),
            });

            if (novoArquivo && caminhoAntigo) {
                try {
                    await deleteObject(ref(storage, caminhoAntigo));
                } catch (e) {
                    console.log('Não foi possível apagar o arquivo antigo', e);
                }
            }

            alert('Laudo atualizado com sucesso!');
            navigation.goBack();
        } catch (erro) {
            console.log(erro);
            alert('Erro ao atualizar o laudo.');
        } finally {
            setSalvando(false);
        }
    }

    if (!fontsLoaded) return null;

    if (carregando) {
        return (
            <View style={[estilos.container, { justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color="#006A66" />
            </View>
        );
    }

    const ehPdf = (anexo?.tipo ?? anexo?.nome ?? '').toLowerCase().includes('pdf');
    const infoArquivo = [ehPdf ? 'PDF' : 'Imagem', formatarTamanho(anexo?.tamanho ?? null)]
        .filter(Boolean)
        .join(' • ');

    return (
        <View style={estilos.container}>
            <View style={estilos.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} disabled={salvando}>
                    <Ionicons name="arrow-back" size={24} color="#40484B" />
                </TouchableOpacity>
                <Text style={estilos.headerTitle}>Laudo/Exame</Text>
            </View>

            <ScrollView
                style={estilos.MidBox}
                contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
                keyboardShouldPersistTaps="handled"
            >
                <View style={estilos.cardCampo}>
                    <Text style={estilos.labelCampo}>TIPO DE EXAME</Text>
                    <TextInput
                        style={estilos.valorCampo}
                        value={tipoExame}
                        onChangeText={setTipoExame}
                        placeholder="Ex: Raio-X, Hemograma..."
                        placeholderTextColor="#6B7280"
                    />
                </View>

                <TouchableOpacity style={estilos.cardCampo} onPress={() => setSeletor('paciente')}>
                    <Text style={estilos.labelCampo}>PACIENTE</Text>
                    <View style={estilos.linhaPaciente}>
                        <View style={estilos.avatar}>
                            <Text style={estilos.avatarTexto}>
                                {mascaras.getInitials(pacienteSel?.nome ?? '')}
                            </Text>
                        </View>
                        <Text style={[estilos.valorCampo, { flex: 1 }]}>{pacienteSel?.nome}</Text>
                        <Ionicons name="chevron-down" size={20} color="#70787B" />
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={estilos.cardCampo} onPress={() => setSeletor('medico')}>
                    <Text style={estilos.labelCampo}>MÉDICO RESPONSÁVEL</Text>
                    <View style={estilos.linhaPaciente}>
                        <Text style={[estilos.valorCampo, { flex: 1 }]}>{medicoSel?.nome}</Text>
                        <Ionicons name="chevron-down" size={20} color="#70787B" />
                    </View>
                </TouchableOpacity>

                <View style={estilos.cardCampo}>
                    <Text style={estilos.labelCampo}>DATA DO EXAME</Text>
                    <TextInput
                        style={estilos.valorCampo}
                        value={dataExame}
                        onChangeText={(t) => setDataExame(mascaras.maskDate(t))}
                        placeholder="dd/mm/aaaa"
                        placeholderTextColor="#6B7280"
                        keyboardType="numeric"
                        maxLength={10}
                    />
                </View>

                <Text style={estilos.tituloSecao}>ARQUIVO ANEXO</Text>
                <View style={estilos.cardCampo}>
                    {novoArquivo ? (
                        <View style={estilos.arquivoLinha}>
                            <View style={estilos.arquivoIcone}>
                                <MaterialCommunityIcons name="file-upload-outline" size={24} color="#006A66" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={estilos.arquivoNome} numberOfLines={1}>{novoArquivo.name}</Text>
                                <Text style={estilos.arquivoInfo}>
                                    Novo arquivo — será enviado ao salvar
                                </Text>
                            </View>
                        </View>
                    ) : anexo ? (
                        <>
                            <View style={estilos.arquivoLinha}>
                                <View style={estilos.arquivoIcone}>
                                    <MaterialCommunityIcons
                                        name={ehPdf ? 'file-pdf-box' : 'file-image-outline'}
                                        size={28}
                                        color="#BA1A1A"
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={estilos.arquivoNome} numberOfLines={1}>{anexo.nome}</Text>
                                    <Text style={estilos.arquivoInfo}>{infoArquivo}</Text>
                                </View>
                            </View>
                            <TouchableOpacity style={estilos.botaoVisualizar} onPress={visualizar}>
                                <Feather name="download" size={16} color="#FFFFFF" />
                                <Text style={estilos.botaoVisualizarTexto}>Visualizar</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <Text style={estilos.arquivoInfo}>Nenhum arquivo anexado.</Text>
                    )}

                    <TouchableOpacity style={estilos.botaoTrocar} onPress={escolherArquivo}>
                        <Text style={estilos.botaoTrocarTexto}>
                            {anexo || novoArquivo ? 'Trocar arquivo' : 'Anexar arquivo'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <Text style={estilos.tituloSecao}>OBSERVAÇÕES</Text>
                <View style={estilos.cardCampo}>
                    <TextInput
                        style={[estilos.valorCampo, { minHeight: 60, textAlignVertical: 'top' }]}
                        value={observacoes}
                        onChangeText={setObservacoes}
                        multiline
                        placeholder="Digite observações relevantes..."
                        placeholderTextColor="#6B7280"
                    />
                </View>
            </ScrollView>

            <View style={estilos.BottomBox}>
                <TouchableOpacity
                    style={[estilos.SaveButton, salvando && { opacity: 0.6 }]}
                    onPress={salvar}
                    disabled={salvando}
                >
                    <Text style={estilos.SaveButtonText}>{salvando ? 'SALVANDO...' : 'SALVAR'}</Text>
                </TouchableOpacity>
            </View>

            <Modal visible={seletor !== null} transparent animationType="slide" onRequestClose={fecharSeletor}>
                <TouchableOpacity style={estilos.modalOverlay} activeOpacity={1} onPress={fecharSeletor}>
                    <View style={estilos.modalSheet} onStartShouldSetResponder={() => true}>
                        <Text style={estilos.modalTitle}>
                            {seletor === 'paciente' ? 'Selecione o paciente' : 'Selecione o médico'}
                        </Text>

                        <View style={estilos.InputBoxes}>
                            <Ionicons style={estilos.icon} name="search" size={20} color="#70787B" />
                            <TextInput
                                style={estilos.inputText}
                                value={busca}
                                onChangeText={setBusca}
                                placeholder="Digite o nome..."
                                placeholderTextColor="#6B7280"
                            />
                        </View>

                        <FlatList
                            data={listaFiltrada}
                            keyExtractor={(item) => item.id}
                            keyboardShouldPersistTaps="handled"
                            ListEmptyComponent={
                                <Text style={estilos.modalVazio}>Nenhum resultado encontrado.</Text>
                            }
                            renderItem={({ item }) => (
                                <TouchableOpacity style={estilos.modalItem} onPress={() => escolher(item)}>
                                    <Text style={estilos.modalItemText}>{item.nome}</Text>
                                    {item.especialidade ? (
                                        <Text style={estilos.modalItemSub}>{item.especialidade}</Text>
                                    ) : null}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}