import React, { useRef } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ReanimatedSwipeable, {
  SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import Reanimated, {
  SharedValue,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';

/**
 * Card que mostra uma ação (lixeira) ao ser arrastado para a esquerda.
 * Substitui o antigo Swipeable do gesture-handler, que não existe no SDK 58.
 * Usado nas telas de Médicos e de Consultas.
 */
interface Props {
  children: React.ReactNode;
  onAcao: () => void;
  icone?: keyof typeof Ionicons.glyphMap;
}

function Acao({
  progress,
  icone,
  onPress,
}: {
  progress: SharedValue<number>;
  icone: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  const estiloIcone = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(progress.value, [0, 1], [72, 0]) }],
  }));

  return (
    <TouchableOpacity style={styles.acao} activeOpacity={0.85} onPress={onPress}>
      <Reanimated.View style={estiloIcone}>
        <Ionicons name={icone} size={24} color="#FFFFFF" />
      </Reanimated.View>
    </TouchableOpacity>
  );
}

export default function CartaoArrastavel({
  children,
  onAcao,
  icone = 'trash-outline',
}: Props) {
  const ref = useRef<SwipeableMethods>(null);

  return (
    <View style={styles.espacoEntreCards}>
      <ReanimatedSwipeable
        ref={ref}
        overshootRight={false}
        rightThreshold={40}
        renderRightActions={(progress) => (
          <Acao
            progress={progress}
            icone={icone}
            onPress={() => {
              ref.current?.close();
              onAcao();
            }}
          />
        )}
      >
        {children}
      </ReanimatedSwipeable>
    </View>
  );
}

const styles = StyleSheet.create({
  espacoEntreCards: { marginBottom: 16 },
  acao: {
    width: 72,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#BA1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
});