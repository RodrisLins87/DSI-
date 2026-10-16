
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import ListagemPacientesScreen from '../screens/Pacientes/ListagemPacientesScreen';
import FormularioPacienteScreen from '../screens/Pacientes/FormularioPacienteScreen';
import GerenciarAgendaScreen from '../screens/Medicos/GerenciarAgendaScreen';

import LoginScreen from '../screens/Auth/LoginScreen';
import CadastroScreen from '../screens/Auth/CadastroScreen';
import HomeScreen from '../screens/Home/HomeScreen';
import RecuperarSenhaScreen from '../screens/Auth/RecuperarSenhaScreen';
import ListagemConsultasScreen from '../screens/Consultas/ListagemConsultasScreen';
import NovaConsultaScreen from '../screens/Consultas/NovaConsultaScreen';
import ReagendarConsultaScreen from '../screens/Consultas/ReagendarConsultaScreen';
import FormularioMedicoScreen from '../screens/Medicos/FormularioMedicoScreen'; 
import ListagemMedicosScreen from '../screens/Medicos/ListagemMedicosScreen';
import ListagemResponsaveisScreen from '../screens/Responsaveis/ListagemResponsaveisScreen';
import FormularioResponsavelScreen from '../screens/Responsaveis/FormularioResponsavelScreen';
import PerfilClinicaScreen from '../screens/Perfil/PerfilClinicaScreen';
import EditarPerfilScreen from '../screens/Perfil/EditarPerfilScreen';
import ConfirmarExclusaoScreen from '../screens/Perfil/ConfirmarExclusaoScreen';
import AgendaMedicoScreen from '../screens/Medicos/AgendaMedicoScreen';
import MapaFaltasScreen from '../screens/Mapa/MapaFaltasScreen';



const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Perfil" component={PerfilClinicaScreen} />
            <Stack.Screen name="EditarPerfil" component={EditarPerfilScreen} />
            <Stack.Screen name="ConfirmarExclusao" component={ConfirmarExclusaoScreen} />

            <Stack.Screen name="Consultas" component={ListagemConsultasScreen} />
            <Stack.Screen name="NovaConsulta" component={NovaConsultaScreen} />
            <Stack.Screen name="ReagendarConsulta" component={ReagendarConsultaScreen} />
            
            <Stack.Screen name="Pacientes" component={ListagemPacientesScreen} />
            <Stack.Screen name="FormularioPaciente" component={FormularioPacienteScreen} />
            
            <Stack.Screen name="ListagemMedicos" component={ListagemMedicosScreen} />
            
            {/* Ecrãs de Responsáveis */}
            <Stack.Screen name="ListagemResponsaveis" component={ListagemResponsaveisScreen} />
            <Stack.Screen name="FormularioResponsavel" component={FormularioResponsavelScreen} />
            
            <Stack.Screen name="GerenciarAgenda" component={GerenciarAgendaScreen} />
            <Stack.Screen name="FormularioMedico" component={FormularioMedicoScreen} />
            <Stack.Screen name="AgendaMedico" component={AgendaMedicoScreen} />
            <Stack.Screen name="MapaFaltas" component={MapaFaltasScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Cadastro" component={CadastroScreen} />
            <Stack.Screen
              name="RecuperarSenha"
              component={RecuperarSenhaScreen}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}