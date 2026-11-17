import {StyleSheet, Dimensions} from 'react-native';
import { Manrope_400Regular, Manrope_700Bold } from '@expo-google-fonts/manrope';

export const estilos = StyleSheet.create({
    container: {
        flex: 1,
    alignItems: 'center',
    width: '100%',
    },

    MidBox: {
    width:'100%',
    flex: 1,
    backgroundColor: '#F8F9FF',
    paddingHorizontal: 25,

    },
    BottomBox: {
        paddingTop: 21,
        height: Dimensions.get('window').height/6,
        width:'100%',
        backgroundColor: '#FFFFFFE5',
        paddingHorizontal: 25,
        borderTopWidth: 1,
        borderTopColor: '#BFC8CB',


    },

    MedicalReportBox: {
        width: '100%',
        borderRadius: 12,
        borderWidth: 1,
        borderColor:'#BFC8CB',
        backgroundColor: 'white',
        marginBottom: 10,
        padding: 16


    },

    horizontalline: {
    width: '100%',
    height: 0,
    borderWidth: 1,
    borderColor: '#D3E4FE',
    marginTop: 40

  },

    BackGroundBox: {
        flexDirection: 'column',
        width: '100%',
        borderWidth: 1,
        borderRadius: 8,
        borderColor: '#BFC8CB',
        backgroundColor: 'white',
        padding: 16,
        marginTop: 16
    },

    InputBoxes: {
        flexDirection: 'row',
        marginTop: 5,
        marginBottom: 7,
        width: '100%',
        height: 46,
        borderRadius: 6,
        borderWidth: 1,
        backgroundColor: '#F8F9FF',
        borderColor: '#BFC8CB',
        alignItems: 'center',
        paddingLeft: 10
    },

    icon: {
        marginRight: 10,
    },

    inputText: {
        flex: 1,
        fontFamily: 'Manrope_400Regular',
        fontSize: 12,
        lineHeight: 16,
        letterSpacing: 0,
        textAlignVertical: 'center',
    },

    SaveButton: {
        width: '100%',
        height: 56,
        borderRadius: 8,
        backgroundColor: '#004D5B',
        justifyContent: 'center',
        alignItems: 'center',
        fontWeight: 'bold'

    },

    SaveButtonText: {
        fontFamily: 'Manrope_700Bold',
        fontSize: 12,
        color: 'white'
    },

    header: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: '#F8F9FF',
  },

  headerTitle: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#006A66',
    marginLeft: 15,
  },

  uploadBox: {
  borderWidth: 2,
  borderStyle: 'dashed',
  borderColor: '#BFC8CB',
  height: 152,
  borderRadius: 8,
  backgroundColor: '#EEF4FF',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 28,
  marginTop: 5,
  marginBottom: 7,
},

AdditionalNotes: {
    width: '100%',
    height: 86,
    marginTop: 5,
    marginBottom: 7,
    borderWidth: 1,
    borderColor: '#BFC8CB',
    borderRadius: 6,
    backgroundColor: '#F8F9FF',
    textAlignVertical: 'top',
    paddingLeft: 16,
    paddingTop: 12,
    paddingRight: 16,
    paddingBottom: 12
},

Circle: {
    height: 48,
    width: 48,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#95D0E033',
    verticalAlign: 'top',
    marginBottom: 10
},

uploadTitle: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
    color: '#004D5B',
},

uploadSub: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    paddingHorizontal: 16,
},

modalOverlay: { 
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end' 
},

modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
},

modalTitle: { 
    fontFamily: 'Manrope_700Bold',
    fontSize: 16, 
    color: '#0B1C30', 
    marginBottom: 10 
},

modalItem: { 
    paddingVertical: 14, 
    borderBottomWidth: 1, 
    borderBottomColor: '#EEF1F4' 
},

modalItemText: { 
    fontFamily: 'Manrope_400Regular', 
    fontSize: 14, 
    color: '#0B1C30' 
},

modalVazio: { 
    textAlign: 'center', 
    color: '#6B7280', 
    marginTop: 20 
},
modalItemSub: { 
    fontFamily: 'Manrope_400Regular', 
    fontSize: 12, 
    color: '#6B7280', 
    marginTop: 2 
},

telaLista: { 
    flex: 1, 
    backgroundColor: '#F8F9FF' 
},

conteudoLista: { 
    flex: 1, 
    paddingHorizontal: 20, 
    paddingTop: 60 
},

headerLista: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
},

tituloLista: { 
    fontFamily: 'Manrope_700Bold', 
    fontSize: 24, 
    color: '#00353F' 
},

botaoAdd: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#004D5B',
    alignItems: 'center',
    justifyContent: 'center',
},

buscaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderWidth: 1,
    borderColor: '#BFC8CB',
    borderRadius: 8,
    backgroundColor: 'white',
    paddingHorizontal: 12,
    marginBottom: 16,
},

buscaInput: { 
    flex: 1, 
    fontFamily: 'Manrope_400Regular', 
    fontSize: 14, 
    color: '#0B1C30' 
},

cardTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
},

tag: { 
    paddingHorizontal: 8, 
    paddingVertical: 3, 
    borderRadius: 4 
},

tagTexto: { 
    fontFamily: 'Manrope_700Bold', 
    fontSize: 10, 
    letterSpacing: 0.5 
},

cardData: { 
    fontFamily: 'Manrope_400Regular', 
    fontSize: 12, 
    color: '#40484B' 
},

cardNome: { 
    fontFamily: 'Manrope_700Bold', 
    fontSize: 16, 
    color: '#0B1C30', 
    marginBottom: 8 
},

cardMedicoLinha: { 
    flexDirection: 'row', 
    alignItems: 'center' 
},

cardMedicoTexto: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    color: '#40484B',
    marginLeft: 6,
    flex: 1,
},

vazio: { 
    textAlign: 'center', 
    color: '#8A9599', 
    marginTop: 40 
},

cardCampo: {
    width: '100%',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#BFC8CB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
},

labelCampo: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 11,
    color: '#40484B',
    marginBottom: 4,
},

valorCampo: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    color: '#0B1C30',
    padding: 0,
},

tituloSecao: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    color: '#40484B',
    marginTop: 8,
    marginBottom: 8,
    letterSpacing: 0.5,
},

linhaPaciente: { 
    flexDirection: 'row', 
    alignItems: 'center' 
},

avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#004D5B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
},

avatarTexto: { 
    fontFamily: 'Manrope_700Bold', 
    fontSize: 11, 
    color: '#FFFFFF' 
},

arquivoLinha: { 
    flexDirection: 'row', 
    alignItems: 'center' 
},

arquivoIcone: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#FFDAD6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
},

arquivoNome: { 
    fontFamily: 'Manrope_700Bold', 
    fontSize: 13, 
    color: '#0B1C30' 
},

arquivoInfo: { 
    fontFamily: 'Manrope_400Regular', 
    fontSize: 12, 
    color: '#6B7280', 
    marginTop: 2 
},

botaoVisualizar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 8,
    backgroundColor: '#006A66',
    marginTop: 12,
},

botaoVisualizarTexto: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: '#FFFFFF',
    marginLeft: 8,
},

botaoTrocar: { 
    alignSelf: 'center', 
    marginTop: 12 
},

botaoTrocarTexto: { 
    fontFamily: 'Manrope_700Bold', 
    fontSize: 12, 
    color: '#006A66' 
},


})

