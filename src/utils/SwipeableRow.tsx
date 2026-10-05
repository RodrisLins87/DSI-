import React from 'react';
import { Animated, StyleSheet, TouchableOpacity } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';

/**
 * Componente reutilizável para "arrastar e excluir" em listagens (CRUDs).
 *
 * Como usar: envolva o card/linha da lista com <SwipeableRow onDelete={...}>.
 * Ele não exclui nada sozinho — só revela um botão de lixeira ao arrastar
 * e chama onDelete quando o usuário toca nele. Quem decide o que fazer com
 * isso (abrir um modal de confirmação, chamar o Firestore, etc.) é a tela
 * que está usando o componente.
 *
 * Depende da lib `react-native-gesture-handler`. Se ainda não estiver
 * instalada no projeto, rode: npx expo install react-native-gesture-handler
 * E envolva a raiz do app (App.tsx) com <GestureHandlerRootView> — ver
 * instruções no final da entrega.
 */
interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete: () => void;
}

export default function SwipeableRow({ children, onDelete }: SwipeableRowProps) {
  function renderAcaoExcluir(progress: Animated.AnimatedInterpolation<number>) {
    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [80, 0],
    });

    return (
      <TouchableOpacity style={styles.botaoExcluir} onPress={onDelete} activeOpacity={0.85}>
        <Animated.View style={{ transform: [{ translateX }] }}>
          <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <Swipeable renderRightActions={renderAcaoExcluir} overshootRight={false} rightThreshold={40}>
      {children}
    </Swipeable>
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
