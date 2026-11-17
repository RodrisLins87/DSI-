import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../../lib/firebase';
import { formatarData, lerData } from '../../Consultas/components/AgendamentoCampos';

/**
 * Três números da clínica logada, atualizados em tempo real:
 * consultas de hoje, consultas pendentes e consultas canceladas no mês atual.
 * Em caso de erro (ou sem consultas), mostra 0.
 */
interface Resumo {
  hoje: number;
  pendentes: number;
  canceladasMes: number;
}

const ZERADO: Resumo = { hoje: 0, pendentes: 0, canceladasMes: 0 };

// Cancelada "no mês" = cancelada neste mês (campo canceladaEm). Consultas canceladas
// antes desse campo existir não têm a data do cancelamento; nelas vale a data da consulta.
function canceladaNoMesAtual(c: any, agora: Date): boolean {
  const quando: Date | null = c.canceladaEm?.toDate?.() ?? lerData(c.data);
  return !!quando && quando.getMonth() === agora.getMonth() && quando.getFullYear() === agora.getFullYear();
}

export default function ResumoClinica() {
  const [resumo, setResumo] = useState<Resumo>(ZERADO);

  useEffect(() => {
    const clinicaId = auth.currentUser?.uid;
    if (!clinicaId) return;

    const q = query(collection(db, 'consultas'), where('clinicaId', '==', clinicaId));
    return onSnapshot(
      q,
      (snap) => {
        const agora = new Date();
        const hoje = formatarData(agora);
        const novo = { ...ZERADO };
        snap.docs.forEach((d) => {
          const c = d.data();
          if (c.data === hoje) novo.hoje++;
          if (c.status === 'pendente') novo.pendentes++;
          if (c.status === 'cancelada' && canceladaNoMesAtual(c, agora)) novo.canceladasMes++;
        });
        setResumo(novo);
      },
      (error) => {
        console.log('Erro ao carregar resumo da clínica:', error);
        setResumo(ZERADO);
      },
    );
  }, []);

  return (
    <View style={styles.row}>
      <Numero rotulo="Consultas hoje" valor={resumo.hoje} />
      <Numero rotulo="Pendentes" valor={resumo.pendentes} />
      <Numero rotulo="Canceladas no mês" valor={resumo.canceladasMes} />
    </View>
  );
}

function Numero({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <View style={styles.card}>
      <Text style={styles.valor}>{valor}</Text>
      <Text style={styles.rotulo}>{rotulo}</Text>
    </View>
  );
}

// Mesmas cores dos cards da HomeScreen.
const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E5E9',
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  valor: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0E3D3A',
  },
  rotulo: {
    fontSize: 12,
    color: '#5A6B69',
    marginTop: 2,
  },
});
