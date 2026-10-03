import React from 'react';
import { Modal, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Modal de confirmação de exclusão ("Danger Modal/Card" do protótipo).
 * Reutilizável por qualquer CRUD: quem usa define o título e a mensagem.
 *
 * Ex: <ConfirmDeleteModal
 *       visible={pacienteParaExcluir !== null}
 *       title="Excluir Paciente?"
 *       message="Ao excluir este paciente, todos os dependentes, laudos
 *                médicos e consultas vinculados também serão removidos
 *                permanentemente. Esta ação não pode ser desfeita."
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
            <Ionicons name="close" size={26} color="#C0392B" />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <TouchableOpacity
            style={[styles.botaoExcluir, loading && { opacity: 0.6 }]}
            onPress={onConfirm}
            disabled={loading}
          >
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
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FBE6E4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A2E35',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#5B6B70',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  botaoExcluir: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    backgroundColor: '#C0392B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  botaoExcluirTexto: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.4,
  },
  botaoCancelar: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#00353F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoCancelarTexto: {
    color: '#00353F',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.4,
  },
});
