import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';

interface Clinica {
  nome: string;
  cnpj: string;
  endereco: string;
  email: string;
  telefone: string;
}

export default function PerfilClinicaScreen({ navigation }: { navigation: any }) {
  const [clinica, setClinica] = useState<Clinica | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Recarrega sempre que a tela volta ao foco (útil depois de editar)
  useFocusEffect(
    useCallback(() => {
      async function carregar(): Promise<void> {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        try {
          const snap = await getDoc(doc(db, 'clinicas', uid));
          if (snap.exists()) {
            setClinica(snap.data() as Clinica);
          }
        } catch (error) {
          Alert.alert('Erro', 'Não foi possível carregar os dados da clínica.');
        } finally {
          setLoading(false);
        }
      }
      carregar();
    }, [])
  );

  if (loading) return <ActivityIndicator />;

  return (
    <View>
      <Text>Perfil da Clínica</Text>
      <Text>{clinica?.nome}</Text>
      <Text>CNPJ: {clinica?.cnpj}</Text>
      <Text>{clinica?.endereco}</Text>
      <Text>{clinica?.email}</Text>
      <Text>{clinica?.telefone || 'Não informado'}</Text>

      <TouchableOpacity onPress={() => navigation.navigate('EditarPerfil')}>
        <Text>Editar Perfil</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('ConfirmarExclusao')}>
        <Text>Excluir Conta</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Home')}>
        <Text>Voltar para o início</Text>
      </TouchableOpacity>
    </View>
  );
}