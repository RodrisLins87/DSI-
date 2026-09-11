import {StyleSheet, Dimensions} from 'react-native';
import { themas } from '../../global/themes';


export const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    
  },
  imagem: {
    width: 200,
    justifyContent: 'center',
    alignContent: 'center',
  },
  /*
  returnbox: {
    height: Dimensions.get('window').height/6,
    backgroundColor: 'purple',
    width: '100%',
  },
  */

  TopBox: {
    height: Dimensions.get('window').height/5,
    width: '100%',
    backgroundColor: '#F8F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    
  },
  MidBox: {
    width:'100%',
    backgroundColor: '#F8F9FF',
    paddingHorizontal: 25,

  },
  BottomBox: {
    marginTop: 20,
    height: Dimensions.get('window').height/6,
    width:'100%',
    backgroundColor: '#F8F9FF',
    paddingHorizontal: 25

  },
  
  inputContainer: {
  flexDirection: 'column',
  paddingVertical: 4,
  padding: 24,
  borderColor:'#BFC8CB',
  width: 350,
  height: 50,
  flexGrow: 0,
  flexShrink: 0,
  alignSelf: 'stretch',
  borderWidth: 2,
  borderRadius: 8,
  },
  
  inputText: {
  fontFamily: 'Manrope_400Regular',
  fontSize: 12,
  lineHeight: 16,
  letterSpacing: 0,
  textAlignVertical: 'center',
},

  titleinput: {
    fontFamily: 'Manrope_400Regular',
    marginLeft: 3,
    marginBottom: 4,
    color: 'black',
    marginTop: 20,
    fontSize: 12
  },

  CreateAccountButton: {
    width: 350,
    height: 56,
    backgroundColor: '#006A66',
    color: 'white',
    fontFamily: 'Manrope_400Regular',
    fontSize: 16,
    textAlignVertical: 'center',
    textAlign: 'center',
    borderRadius: 12,
  },

  horizontalline: {
    width: '100%',
    height: 0,
    borderWidth: 1,
    borderColor: '#D3E4FE',
    marginTop: 40

  },

  returnbutton: {
    
  }

});