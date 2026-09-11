import React from "react";
import { Text, StyleSheet, TextComponent, View, Image, TextInput, Dimensions, ScrollView } from 'react-native';
import Logo from '../assets/logo3.png'
import { useFonts, Manrope_400Regular } from '@expo-google-fonts/manrope';
import {styles} from './styles'

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