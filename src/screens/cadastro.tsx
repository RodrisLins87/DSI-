import React from "react";
import { Text, StyleSheet, TextComponent, View, Image, TextInput, Dimensions, ScrollView } from 'react-native';
import Logo from '../assets/logo3.png'
import { useFonts, Manrope_400Regular } from '@expo-google-fonts/manrope';
import { themas } from "../global/themes";

type text_box = {
    altura: number;
};

export default function Cadastro (){
  useFonts({Manrope_400Regular,});
  return (
      <View style={styles.container}>
          
          <ScrollView >
            <View style={styles.TopBox}>
              <Image 
              source={Logo}
              style={styles.imagem}
              resizeMode="contain"
              />
            </View>
            <View style={styles.MidBox}>
                <Text style={styles.titleinput}>Nome da Clínica</Text>
                <TextInput style={[styles.inputContainer, styles.inputText]} />
                <Text style={styles.titleinput}>CNPJ</Text>
                <TextInput style={[styles.inputContainer, styles.inputText]} />
                <Text style={styles.titleinput}>Endereço</Text>
                <TextInput style={[styles.inputContainer, styles.inputText]} />
                <Text style={styles.titleinput}>E-mail</Text>
                <TextInput style={[styles.inputContainer, styles.inputText]} />
                <Text style={styles.titleinput}>Senha</Text>
                <TextInput style={[styles.inputContainer, styles.inputText]} />
                <Text style={styles.titleinput}>Confirmar senha</Text>
                <TextInput style={[styles.inputContainer, styles.inputText]} />
            </View>
            <View style={styles.horizontalline}></View>
            <View style={styles.BottomBox}>
              <Text style={styles.CreateAccountButton}>Criar Conta</Text>
            </View>
          </ScrollView>
          
          


      </View>
  )
}

const styles = StyleSheet.create({
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
    color: themas.colors.black,
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