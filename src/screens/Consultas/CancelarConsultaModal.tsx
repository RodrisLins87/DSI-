import React from 'react';
import { Modal, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { FONT } from '../../global/fonts';

/**
 * Modal "Cancelar Consulta?" (Dialog - Modal Content Card do Figma).
 * Quem usa decide o que fazer em cada botão:
 *   <CancelarConsultaModal
 *     visible={consultaParaCancelar !== null}
 *     onManter={() => setConsultaParaCancelar(null)}
 *     onCancelar={cancelarConsulta}
 *   />
 */
interface CancelarConsultaModalProps {
  visible: boolean;
  onManter: () => void;
  onCancelar: () => void;
  loading?: boolean;
}

export default function CancelarConsultaModal({
  visible,
  onManter,
  onCancelar,
  loading = false,
}: CancelarConsultaModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onManter}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconeCirculo}>
            <MaterialIcons name="event-busy" size={32} color="#BA1A1A" />
          </View>

          <Text style={styles.titulo}>Cancelar Consulta?</Text>
          <Text style={styles.mensagem}>
            Esta ação é irreversível. Ao cancelar, o horário será liberado imediatamente na agenda do médico.
          </Text>

          <TouchableOpacity
            style={[styles.botaoCancelar, loading && { opacity: 0.6 }]}
            onPress={onCancelar}
            disabled={loading}
          >
            <Text style={styles.botaoCancelarTexto}>
              {loading ? 'Cancelando...' : 'Cancelar Consulta Permanentemente'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.botaoManter, loading && { opacity: 0.6 }]}
            onPress={onManter}
            disabled={loading}
          >
            <Text style={styles.botaoManterTexto}>Manter Consulta</Text>
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
    maxWidth: 358,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFC8CB',
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  iconeCirculo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFDAD6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    fontFamily: FONT.semibold,
    fontSize: 20,
    lineHeight: 28,
    color: '#0B1C30',
    marginTop: 17,
    textAlign: 'center',
  },
  mensagem: {
    fontFamily: FONT.regular,
    fontSize: 14,
    lineHeight: 22,
    color: '#40484B',
    marginTop: 8,
    marginBottom: 25,
    textAlign: 'center',
  },
  botaoCancelar: {
    width: '100%',
    height: 48,
    borderRadius: 8,
    backgroundColor: '#BA1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  botaoCancelarTexto: { fontFamily: FONT.semibold, fontSize: 14, color: '#FFFFFF' },
  botaoManter: {
    width: '100%',
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#70787B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoManterTexto: { fontFamily: FONT.semibold, fontSize: 14, color: '#00353F' },
});