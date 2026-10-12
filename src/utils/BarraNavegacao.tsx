import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { FONT } from '../global/fonts';

/**
 * Barra de navegação inferior (Início / Perfil), igual ao Figma.
 *
 * Como usar, no fim do return de qualquer tela (depois da lista/conteúdo):
 *   <BarraNavegacao ativa="inicio" />
 *
 * Ela mesma navega: não precisa passar navigation nem onPress.
 * Para adicionar uma aba nova, é só incluir mais um item em ABAS.
 */
type Aba = 'inicio' | 'perfil';

const VERDE = '#006A66';
const CINZA = '#40484B';

// nome da rota para onde cada aba leva (o Perfil ainda não existe no AppNavigator)
const ROTAS: Record<Aba, string> = { inicio: 'Home', perfil: 'Perfil' };

export default function BarraNavegacao({ ativa }: { ativa?: Aba }) {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  function ir(aba: Aba) {
    const rota = ROTAS[aba];
    // já está nessa tela: não faz nada
    if (route.name === rota) return;
    // evita erro enquanto a tela de Perfil não foi criada
    if (!navigation.getState()?.routeNames?.includes(rota)) {
      Alert.alert('Em breve', 'Esta tela ainda não está disponível.');
      return;
    }
    navigation.navigate(rota);
  }

  const corInicio = ativa === 'perfil' ? CINZA : VERDE;
  const corPerfil = ativa === 'perfil' ? VERDE : CINZA;

  return (
    <View style={[styles.barra, { paddingBottom: 12 + Math.max(insets.bottom, 17) }]}>
      <TouchableOpacity style={styles.item} onPress={() => ir('inicio')}>
        <MaterialCommunityIcons name="home-variant-outline" size={24} color={corInicio} />
        <Text style={[styles.label, { color: corInicio }]}>Início</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.item} onPress={() => ir('perfil')}>
        <MaterialIcons name="person" size={24} color={corPerfil} />
        <Text style={[styles.label, { color: corPerfil }]}>Perfil</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#BFC8CB',
    backgroundColor: '#F8F9FF',
  },
  item: { width: 135, alignItems: 'center' },
  label: { fontFamily: FONT.medium, fontSize: 12, lineHeight: 16, marginTop: 2 },
});