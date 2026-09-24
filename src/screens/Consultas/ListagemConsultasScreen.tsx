import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { STATUS_STYLES } from '../../utils/statusStyles';

interface Consulta {
  id: string;
  pacienteId: string;
  medicoId: string;
  data: string;
  horario: string;
  status: string;
}

export default function ListagemConsultasScreen({ navigation }: { navigation: any }) {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [busca, setBusca] = useState('');

  async function fetchConsultas(): Promise<void> {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'consultas'), where('clinicaId', '==', auth.currentUser.uid));
    const snap = await getDocs(q);
    setConsultas(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Consulta)));
  }

  useFocusEffect(useCallback(() => { fetchConsultas(); }, []));

  const filtradas = consultas.filter((c) =>
    c.pacienteId.toLowerCase().includes(busca.toLowerCase()) ||
    c.medicoId.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Consultas</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('NovaConsulta')}>
            <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <TextInput style={styles.searchInput} placeholder="Buscar paciente ou médico" value={busca} onChangeText={setBusca} />
      </View>

      <FlatList
        data={filtradas}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const s = STATUS_STYLES[item.status] ?? STATUS_STYLES.pendente;
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('DetalhesConsulta', { consultaId: item.id })}
            >
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle}>{item.pacienteId}</Text>
                <View style={[styles.badge, { backgroundColor: s.bg }]}>
                  <Text style={[styles.badgeText, { color: s.text }]}>{s.label}</Text>
                </View>
              </View>
              <Text style={styles.cardSubtitle}>{item.medicoId}</Text>
              <Text style={styles.cardSubtitle}>{item.data} · {item.horario}</Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>Nenhuma consulta encontrada.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: '#F8F9FF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1A2E35' },
  addButton: {   width: 40, height: 40, borderRadius: 10, backgroundColor: '#0F4C4A', alignItems: 'center', justifyContent: 'center', },
  addButtonText: { fontSize: 22, fontWeight: '600', color: '#FFFFFF', lineHeight: 24, },
  searchBox: { marginBottom: 14 },
  searchInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#DDE3E6', borderRadius: 12, padding: 12, color: '#1A2E35' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A2E35' },
  cardSubtitle: { color: '#5B6B70', marginTop: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  empty: { textAlign: 'center', color: '#8A9599', marginTop: 40 },
});