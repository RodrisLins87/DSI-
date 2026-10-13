import {StyleSheet, Dimensions} from 'react-native';
import { Manrope_400Regular, Manrope_700Bold } from '@expo-google-fonts/manrope';

export const estilos = StyleSheet.create({
    container: {
        flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
        width: 350,
        height: 117,
        borderRadius: 12,
        borderWidth: 1,
        borderColor:'#BFC8CB',
        backgroundColor: 'white',


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

})

