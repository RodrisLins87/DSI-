import React, { useState } from "react";
import { Text, StyleSheet, TextComponent, View, Image, TextInput, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import Logo from '../assets/logo3.png'
import { useFonts, Manrope_400Regular } from '@expo-google-fonts/manrope';
import { themas } from "../global/themes";
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';

type text_box = {
    altura: number;
};

export default function Cadastro (){
  useFonts({Manrope_400Regular,});

  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [confirmarSenhaVisivel, setConfirmarSenhaVisivel] = useState(false);

  return (
      <View style={styles.container}>

          <View style={styles.header}>
            <TouchableOpacity>
              <Ionicons name="arrow-back" size={24} color={themas.colors.black} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Cadastro</Text>
          </View>

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
                <View style={styles.inputContainer}>
                  <MaterialCommunityIcons name="hospital-box-outline" size={18} color="#8A9599" style={styles.icon} />
                  <TextInput style={styles.inputText} placeholder="Ex: Clínica Saúde Integrada" placeholderTextColor="#8A9599" />
                </View>

                <Text style={styles.titleinput}>CNPJ</Text>
                <View style={styles.inputContainer}>
                  <Feather name="briefcase" size={18} color="#8A9599" style={styles.icon} />
                  <TextInput style={styles.inputText} placeholder="00.000.000/0000-00" placeholderTextColor="#8A9599" />
                </View>

                <Text style={styles.titleinput}>Endereço</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="location-outline" size={18} color="#8A9599" style={styles.icon} />
                  <TextInput style={styles.inputText} placeholder="Rua, Número, Bairro, Cidade - UF" placeholderTextColor="#8A9599" />
                </View>

                <Text style={styles.titleinput}>E-mail</Text>
                <View style={styles.inputContainer}>
                  <Feather name="mail" size={18} color="#8A9599" style={styles.icon} />
                  <TextInput style={styles.inputText} placeholder="contato@clinica.com.br" placeholderTextColor="#8A9599" />
                </View>

                <Text style={styles.titleinput}>Senha</Text>
                <View style={styles.inputContainer}>
                  <Feather name="lock" size={18} color="#8A9599" style={styles.icon} />
                  <TextInput style={styles.inputText} placeholder="••••••••" placeholderTextColor="#8A9599" secureTextEntry={!senhaVisivel} />
                  <TouchableOpacity onPress={() => setSenhaVisivel(!senhaVisivel)}>
                    <Feather name={senhaVisivel ? "eye" : "eye-off"} size={18} color="#8A9599" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.titleinput}>Confirmar senha</Text>
                <View style={styles.inputContainer}>
                  <Feather name="lock" size={18} color="#8A9599" style={styles.icon} />
                  <TextInput style={styles.inputText} placeholder="••••••••" placeholderTextColor="#8A9599" secureTextEntry={!confirmarSenhaVisivel} />
                  <TouchableOpacity onPress={() => setConfirmarSenhaVisivel(!confirmarSenhaVisivel)}>
                    <Feather name={confirmarSenhaVisivel ? "eye" : "eye-off"} size={18} color="#8A9599" />
                  </TouchableOpacity>
                </View>
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
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 4,
  paddingHorizontal: 16,
  borderColor:'#BFC8CB',
  width: 350,
  height: 50,
  flexGrow: 0,
  flexShrink: 0,
  alignSelf: 'stretch',
  borderWidth: 2,
  borderRadius: 8,
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