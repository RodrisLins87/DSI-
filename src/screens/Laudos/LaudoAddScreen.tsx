import { View, ScrollView, Text, TextInput, TouchableOpacity, Modal, FlatList} from 'react-native';
import React, {useState, useEffect} from 'react';
import { estilos } from './estilo_laudo';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useFonts, Manrope_400Regular, Manrope_700Bold } from '@expo-google-fonts/manrope';
import * as DocumentPicker from 'expo-document-picker';
import * as mascaras from '../../utils/masks';
import { auth, db, storage } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

type Item = { id: string; nome: string; especialidade?: string};


export default function LaudoAddScreen(){

    useFonts({ Manrope_400Regular, Manrope_700Bold });

    const clinicaID = auth.currentUser?.uid;
    const [salvando, setSalvando] = useState(false);
    
    const [pacientes, setPacientes] = useState<Item[]>([]);
    const [medicos, setMedicos] = useState<Item[]>([]);
    const [pacienteSel, setPacienteSel] = useState<Item | null>(null);
    const [medicoSel, setMedicoSel] = useState<Item | null>(null);
    const [seletor, setSeletor] = useState<'paciente' | 'medico' | null>(null);
    const [busca, setBusca] = useState('');
    const [tipo_exame, setTipoexame] = useState('');
    const [data_exame, setDataexame] = useState('');
    const [observacoes_adicionais, setObsadicional] = useState('');
    const [arquivo, setArquivo] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

async function escolherArquivo() {
    const resultado = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
    });
    if (!resultado.canceled) {
        setArquivo(resultado.assets[0]);
    }
}

async function salvar() {
    if (!clinicaID) {
        alert('Não foi possível identificar a clínica.');
        return;
    }
    if (!pacienteSel || !tipo_exame || !medicoSel) {
        alert('Preencha todos os campos obrigatórios!');
        return;
    }

    if (!mascaras.isValidDate(data_exame)) {
        alert('Digite uma data válida (dd/mm/aaaa).');
        return;
    }

    const [dia, mes, ano] = data_exame.split('/').map(Number);

    setSalvando(true);

    try {
        let arquivoUrl: string | null = null;
        let caminho : string | null = null;

        if (arquivo) {
            
            caminho = `clinicas/${clinicaID}/laudos/${Date.now()}_${arquivo.name}`;

            const resposta = await fetch(arquivo.uri);
            const blob = await resposta.blob();

            
            const arquivoRef = ref(storage, caminho);

            await uploadBytes(arquivoRef, blob);
            arquivoUrl = await getDownloadURL(arquivoRef);
        }

        await addDoc(collection(db, 'clinicas', clinicaID, 'laudos'), {
            pacienteId: pacienteSel.id,
            pacienteNome: pacienteSel.nome,
            medicoId: medicoSel.id,
            medicoNome: medicoSel.nome,
            medicoEspecialidade: medicoSel.especialidade ?? '',
            tipoExame: tipo_exame,
            dataExame: new Date(ano, mes - 1, dia),
            observacoes: observacoes_adicionais,
            nomeArquivo: arquivo?.name ?? null,
            arquivoUrl,
            arquivoCaminho: caminho,
            criadoEm: serverTimestamp(),
        });
        alert('Laudo salvo com sucesso!');
    } catch (erro) {
        console.log(erro);
        alert('Erro ao salvar o laudo.');
    } finally {
        setSalvando(false);
    }
}

useEffect(() => {
    async function carregar() {
        if (!clinicaID) return;
        try {
            const qMed = query(collection(db, 'medicos'), where('clinicaId', '==', clinicaID));
            const snapMed = await getDocs(qMed);
            setMedicos(
                snapMed.docs
                    .map((d) => ({
                        id: d.id,
                        nome: (d.data().nome ?? '') as string,
                        especialidade: d.data().especialidade as string,
                    }))
                    .sort((a, b) => a.nome.localeCompare(b.nome))
            );

            const qPac = query(collection(db, 'pacientes'), where('clinicaId', '==', clinicaID));
            const snapPac = await getDocs(qPac);
            setPacientes(
               snapPac.docs
                    .map((d) => ({ id: d.id, nome: (d.data().nomeCompleto ?? '') as string }))
                    .sort((a, b) => a.nome.localeCompare(b.nome)) 
            );
        } catch (erro) {
            console.log(erro);
            alert('Não foi possível carregar pacientes e médicos.');
        }
    }
    carregar();
}, []);

function escolher(item: Item) {
    if (seletor === 'paciente') setPacienteSel(item);
    if (seletor === 'medico') setMedicoSel(item);
    fecharSeletor();
}

function fecharSeletor() {
    setSeletor(null);
    setBusca('');
}

const lista = seletor === 'paciente' ? pacientes : medicos;
const listaFiltrada = lista.filter((i) =>
    i.nome.toLowerCase().includes(busca.toLowerCase())
);
    
    return (
        <View style={estilos.container}>
            <View style={estilos.header}>
                <TouchableOpacity >
                    <Ionicons name="arrow-back" size={24} color='#40484B' />
                </TouchableOpacity>
                <Text style={estilos.headerTitle}>Novo Laudo/Exame</Text>

            </View>
            <ScrollView style={estilos.MidBox}>
                <View style={estilos.BackGroundBox}>
                    <Text>Paciente</Text>
                        <TouchableOpacity style={estilos.InputBoxes} onPress={() => setSeletor('paciente')}>
                            <Ionicons style={estilos.icon} name="search" size={22} color='#70787B' />
                            <Text style={[estilos.inputText, { color: pacienteSel ? '#0B1C30' : '#6B7280' }]}>
                                {pacienteSel?.nome ?? 'Buscar paciente...'}
                            </Text>
                        </TouchableOpacity>
                    <Text>Tipo de Exame</Text>
                    <View style={estilos.InputBoxes}>
                        <TextInput 
                            style={estilos.inputText}
                            value={tipo_exame}
                            onChangeText={setTipoexame}
                            placeholder='Ex: Raio-X, Hemograma...'
                            placeholderTextColor='#6B7280'
                        >
                        </TextInput>
                    </View>
                    <Text>Médico Responsável</Text>
                        <TouchableOpacity
                            style={[estilos.InputBoxes, { paddingRight: 10 }]}
                            onPress={() => setSeletor('medico')}
                        >
                            <Text style={[estilos.inputText, { color: medicoSel ? '#0B1C30' : '#6B7280' }]}>
                                {medicoSel?.nome ?? 'Selecione o médico'}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#70787B" />
                        </TouchableOpacity>
                    <Text>Data do Exame</Text>
                    <View style={estilos.InputBoxes}>
                        <TextInput
                            style={estilos.inputText}
                            value={data_exame}
                            onChangeText={(texto) => setDataexame(mascaras.maskDate(texto))}
                            placeholder='dd/mm/aaaa'
                            placeholderTextColor='#6B7280'
                            keyboardType='numeric'
                            maxLength={10}
                        ></TextInput>
                    </View> 
                    <Text>Anexar Laudo (PDF/Imagem)</Text>
                    <TouchableOpacity style={estilos.uploadBox} onPress={escolherArquivo}>
                        <View style={estilos.Circle}>
                            <Feather name="upload" size={22} color="#004D5B" />
                        </View>
                        <Text style={estilos.uploadTitle}>Toque para selecionar um arquivo </Text>
                        <Text style={estilos.uploadSub} numberOfLines={1}>
                            {arquivo?.name ?? 'Nenhum arquivo selecionado'}
                        </Text>
                    </TouchableOpacity>
                    <Text>Observações Adicionais</Text>
                    <View style={estilos.AdditionalNotes}
                    >
                        <TextInput
                        style={estilos.inputText}
                        value={observacoes_adicionais}
                        onChangeText={setObsadicional}
                        multiline
                        placeholder='Digite observações relevantes...'
                        placeholderTextColor='#6B7280'
                    ></TextInput>
                    </View>

                </View>
            </ScrollView>

            <View style={estilos.BottomBox}>
                    <TouchableOpacity style={estilos.SaveButton} onPress={salvar}>
                        <Text style={estilos.SaveButtonText}>SALVAR </Text>
                    </TouchableOpacity>
                
                </View>

                    <Modal visible={seletor !== null} transparent animationType="slide" onRequestClose={fecharSeletor}>
                        <TouchableOpacity style={estilos.modalOverlay} activeOpacity={1} onPress={fecharSeletor}>
                            <View style={estilos.modalSheet} onStartShouldSetResponder={() => true}>
                                <Text style={estilos.modalTitle}>
                                    {seletor === 'paciente' ? 'Selecione o paciente' : 'Selecione o médico'}
                                </Text>

                                <View style={estilos.InputBoxes}>
                                    <Ionicons style={estilos.icon} name="search" size={20} color='#70787B' />
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
    )
}