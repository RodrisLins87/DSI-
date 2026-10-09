import { View, ScrollView, Text, TextInput, TouchableOpacity} from 'react-native';
import React, {useState} from 'react';
import { estilos } from './estilo';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useFonts, Manrope_400Regular, Manrope_700Bold } from '@expo-google-fonts/manrope';
import * as DocumentPicker from 'expo-document-picker';
import { Picker } from '@react-native-picker/picker';

export default function LaudoAddScreen(){

    useFonts({ Manrope_400Regular, Manrope_700Bold });

    const [paciente, setPaciente] = useState('');
    const [tipo_exame, setTipoexame] = useState('');
    const [medico, setMedico] = useState('');
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
    
    return (
        <View style={estilos.container}>
            <View style={estilos.header}>
                <TouchableOpacity>
                    <Ionicons name="arrow-back" size={24} color='#40484B' />
                </TouchableOpacity>
                <Text style={estilos.headerTitle}>Novo Laudo/Exame</Text>

            </View>
            <ScrollView style={estilos.MidBox}>
                <View style={estilos.BackGroundBox}>
                    <Text>Paciente</Text>
                    <View style={estilos.InputBoxes}>
                        <Ionicons style={estilos.icon} name="search" size={22} color='#70787B' />
                        <TextInput
                            style={estilos.inputText}
                            value={paciente}
                            onChangeText={setPaciente}
                            placeholder='Buscar paciente...'
                            placeholderTextColor='#6B7280'>
                        </TextInput>
                    </View>
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
                    <View style={estilos.InputBoxes}>
                        <TextInput
                            style={estilos.inputText}
                            value={medico}
                            onChangeText={setMedico}
                            placeholder='Selecione o médico'
                            placeholderTextColor='#0B1C30'
                        >
                        </TextInput>

                    </View>
                    <Text>Data do Exame</Text>
                    <View style={estilos.InputBoxes}>
                        <TextInput
                            style={estilos.inputText}
                            value={data_exame}
                            onChangeText={setDataexame}
                            placeholder='dd/mm/yyyy'
                            placeholderTextColor='#6B7280'
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
                        multiline
                        placeholder='Digite observações relevantes...'
                        placeholderTextColor='#6B7280'
                    ></TextInput>
                    </View>

                </View>
            </ScrollView>

            <View style={estilos.BottomBox}>
                    <TouchableOpacity style={estilos.SaveButton}>
                        <Text style={estilos.SaveButtonText}>SALVAR </Text>
                    </TouchableOpacity>
                
                </View>
            
        </View>
    )
}