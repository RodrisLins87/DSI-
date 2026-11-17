import React from 'react';
import { Modal, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

/**
 * Modal de confirmação de exclusão ("Danger Modal/Card" do protótipo).
 * Reutilizável por qualquer CRUD: quem usa define o título e a mensagem.
 *
 * Ex: <ConfirmDeleteModal
 *       visible={responsavelParaExcluir !== null}
 *       title="Excluir Responsável?"
 *       message="Esta ação é irreversível. Todas as informações vinculadas
 *                a este responsável serão removidas permanentemente do sistema."
 *       onCancel={...}
 *       onConfirm={...}
 *     />
 */
interface ConfirmDeleteModalProps {
  visible: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export default function ConfirmDeleteModal({
  visible,
  title,
  message,
  onCancel,
  onConfirm,
  loading = false,
}: ConfirmDeleteModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="delete-forever" size={32} color="#BA1A1A" />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <TouchableOpacity
            style={[styles.botaoExcluir, loading && { opacity: 0.6 }]}
            onPress={onConfirm}
            disabled={loading}
          >
            {!loading && (
              <Ionicons
                name="warning-outline"
                size={18}
                color="#FFFFFF"
                style={styles.botaoIcone}
              />
            )}

            <Text style={styles.botaoExcluirTexto}>
              {loading ? 'EXCLUINDO...' : 'EXCLUIR PERMANENTEMENTE'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.botaoCancelar, loading && { opacity: 0.6 }]}
            onPress={onCancel}
            disabled={loading}
          >
            <Text style={styles.botaoCancelarTexto}>CANCELAR</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 24, 26, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 354,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFC8CB',
    paddingTop: 24,
    paddingBottom: 26,
    paddingHorizontal: 26,
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFDAD6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0B1C30',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: '#40484B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 26,
  },
  botaoExcluir: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: '#BA1A1A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  botaoIcone: {
    marginRight: 8,
  },
  botaoExcluirTexto: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  botaoCancelar: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#004D5B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoCancelarTexto: {
    color: '#004D5B',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.5,
  },
});
