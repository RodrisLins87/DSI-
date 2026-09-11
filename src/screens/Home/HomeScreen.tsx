import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, collection, query, where, getCountFromServer } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';

interface Contadores {
  pacientes: number;
  dependentes: number;
  medicos: number;
  laudos: number;
  consultasHoje: number;
}

export default function HomeScreen({ navigation }: { navigation: any }) {
  const [nomeClinica, setNomeClinica] = useState<string>('Clínica');
  const [contadores, setContadores] = useState<Contadores>({
    pacientes: 0,
    dependentes: 0,
    medicos: 0,
    laudos: 0,
    consultasHoje: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function carregarDados(): Promise<void> {
      const clinicaId = auth.currentUser?.uid;
      if (!clinicaId) return;

      try {
        // 1. Nome da clínica
        const clinicaSnap = await getDoc(doc(db, 'clinicas', clinicaId));
        if (clinicaSnap.exists()) {
          setNomeClinica(clinicaSnap.data().nome ?? 'Clínica');
        }

        // 2. Contagens de cada coleção, filtradas pela clínica logada
        // OBS: isso pressupõe que cada documento em 'pacientes', 'dependentes' etc.
        // tem um campo 'clinicaId' salvo. Ajuste o nome do campo se o time
        // combinou outro nome.
        const [pacientesSnap, dependentesSnap, medicosSnap, laudosSnap] = await Promise.all([
          getCountFromServer(query(collection(db, 'pacientes'), where('clinicaId', '==', clinicaId))),
          getCountFromServer(query(collection(db, 'dependentes'), where('clinicaId', '==', clinicaId))),
          getCountFromServer(query(collection(db, 'medicos'), where('clinicaId', '==', clinicaId))),
          getCountFromServer(query(collection(db, 'laudos'), where('clinicaId', '==', clinicaId))),
        ]);

        setContadores({
          pacientes: pacientesSnap.data().count,
          dependentes: dependentesSnap.data().count,
          medicos: medicosSnap.data().count,
          laudos: laudosSnap.data().count,
          consultasHoje: 0, // TODO: somar quando a coleção 'consultas' existir com campo de data
        });
      } catch (error) {
        // Se as coleções ainda não existem, o Firestore não quebra, só retorna 0.
        // Esse catch cobre outros erros (ex: falta de permissão nas regras do Firestore).
        console.log('Erro ao carregar dados da Home:', error);
      } finally {
        setLoading(false);
      }
    }

    carregarDados();
  }, []);

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="business" size={22} color="#0E3D3A" />
          <Text style={styles.headerTitle} numberOfLines={1}>
            Olá, {nomeClinica}
          </Text>
        </View>
        <Ionicons name="notifications-outline" size={24} color="#0E3D3A" />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Card grande: Pacientes */}
        <View style={styles.cardFull}>
          <View style={[styles.iconCircle, { backgroundColor: '#0E3D3A' }]}>
            <Ionicons name="person" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.cardLabel}>Pacientes</Text>
          <Text style={styles.cardValue}>{contadores.pacientes.toLocaleString('pt-BR')}</Text>
        </View>

        {/* Linha com dois cards menores */}
        <View style={styles.row}>
          <View style={styles.cardHalf}>
            <View style={[styles.iconCircle, { backgroundColor: '#3FD9C4' }]}>
              <Ionicons name="people" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.cardLabel}>Dependentes</Text>
            <Text style={styles.cardValue}>{contadores.dependentes.toLocaleString('pt-BR')}</Text>
          </View>

          <View style={styles.cardHalf}>
            <View style={[styles.iconCircle, { backgroundColor: '#B0342A' }]}>
              <Ionicons name="medkit" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.cardLabel}>Médicos</Text>
            <Text style={styles.cardValue}>{contadores.medicos}</Text>
          </View>
        </View>

        {/* Card Laudos/Exames com barra de progresso */}
        <View style={styles.cardFull}>
          <View style={[styles.iconCircle, { backgroundColor: '#DCE7F5' }]}>
            <Ionicons name="document-text" size={20} color="#3E5C76" />
          </View>
          <Text style={styles.cardLabel}>Laudos/Exames</Text>
          <Text style={styles.cardValue}>{contadores.laudos}</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '75%' }]} />
          </View>
          <Text style={styles.progressText}>75% processados hoje</Text>
        </View>

        {/* Card escuro: Consultas do Dia */}
        <TouchableOpacity
          style={styles.cardDark}
          onPress={() => navigation.navigate('Consultas')}
        >
          <View style={[styles.iconCircle, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <Ionicons name="calendar" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.cardLabelDark}>Consultas do Dia</Text>
          <Text style={styles.cardValueDark}>{contadores.consultasHoje}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Rodapé de navegação */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="home" size={22} color="#0E6B5C" />
          <Text style={[styles.tabLabel, { color: '#0E6B5C' }]}>Início</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Perfil')}>
          <Ionicons name="person-outline" size={22} color="#5A6B69" />
          <Text style={styles.tabLabel}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E5E9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0E3D3A',
    marginLeft: 8,
    flexShrink: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardFull: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E5E9',
    padding: 18,
    marginBottom: 12,
  },
  cardHalf: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E5E9',
    padding: 18,
    marginBottom: 12,
    width: '48%',
  },
  cardDark: {
    backgroundColor: '#0E3D3A',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  cardLabel: {
    fontSize: 14,
    color: '#5A6B69',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0E3D3A',
  },
  cardLabelDark: {
    fontSize: 14,
    color: '#C8D6D3',
    marginBottom: 4,
  },
  cardValueDark: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E2E5E9',
    borderRadius: 3,
    marginTop: 12,
    marginBottom: 8,
  },
  progressBarFill: {
    height: 6,
    backgroundColor: '#0E3D3A',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    color: '#5A6B69',
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E5E9',
    backgroundColor: '#FFFFFF',
  },
  tabItem: {
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 12,
    color: '#5A6B69',
    marginTop: 2,
  },
});