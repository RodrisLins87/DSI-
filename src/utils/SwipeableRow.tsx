import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Reanimated, {
  SharedValue,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

/**
 * Componente reutilizável para "arrastar e excluir" em listagens (CRUDs).
 *
 * Como usar: envolva o card/linha da lista com <SwipeableRow onDelete={...}>.
 * Ele não exclui nada sozinho: só revela um botão de lixeira ao arrastar
 * e chama onDelete quando o usuário toca nele. Quem decide o que fazer com
 * isso (abrir um modal de confirmação, chamar o Firestore, etc.) é a tela
 * que está usando o componente.
 *
 * No SDK 58 o Swipeable antigo do gesture-handler não existe mais, então
 * este componente usa o ReanimatedSwipeable. Depende de
 * react-native-gesture-handler, react-native-reanimated e
 * react-native-worklets, e a raiz do app (App.tsx) precisa estar envolvida
 * por <GestureHandlerRootView>.
 */
interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete: () => void;
}

function AcaoExcluir({
  progress,
  onPress,
}: {
  progress: SharedValue<number>;
  onPress: () => void;
}) {
  const estiloIcone = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(progress.value, [0, 1], [80, 0]) }],
  }));

  return (
    <TouchableOpacity style={styles.botaoExcluir} onPress={onPress} activeOpacity={0.85}>
      <Reanimated.View style={estiloIcone}>
        <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
      </Reanimated.View>
    </TouchableOpacity>
  );
}

export default function SwipeableRow({ children, onDelete }: SwipeableRowProps) {
  return (
    <ReanimatedSwipeable
      renderRightActions={(progress) => (
        <AcaoExcluir progress={progress} onPress={onDelete} />
      )}
      overshootRight={false}
      rightThreshold={40}
    >
      {children}
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  botaoExcluir: {
    backgroundColor: '#C0392B',
    justifyContent: 'center',
    alignItems: 'center',
    width: 72,
    borderRadius: 12,
    marginBottom: 10, // alinhado ao marginBottom: 10 usado nos cards de Consultas
  },
});