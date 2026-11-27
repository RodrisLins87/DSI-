/**
 * Concentração dos pacientes da clínica por bairro, para o mapa.
 *
 * Devolve só TOTAIS por bairro (nunca nome, endereço, CPF ou outro dado individual: LGPD).
 * Formato igual ao de agruparPorBairro() de src/lib/concentracaoPacientes.ts:
 * lista ordenada do maior para o menor total.
 *
 * Por enquanto devolve uma lista de TESTE fixa (bairros de Recife-PE).
 * Quando os dados reais chegarem, só este arquivo muda.
 */

// TROCAR pelo real quando src/lib/concentracaoPacientes.ts existir:
// trocar esta interface pelo tipo exportado de lá, se houver.
export interface ConcentracaoBairro {
  bairro: string;
  cidade: string;
  total: number;
  lat: number;
  lng: number;
}

// Lista de TESTE: coordenadas aproximadas do centro de cada bairro. Já ordenada do maior para o menor.
const DADOS_TESTE: ConcentracaoBairro[] = [
  { bairro: 'Boa Viagem', cidade: 'Recife', total: 40, lat: -8.127, lng: -34.902 },
  { bairro: 'Casa Amarela', cidade: 'Recife', total: 23, lat: -8.027, lng: -34.918 },
  { bairro: 'Graças', cidade: 'Recife', total: 15, lat: -8.047, lng: -34.901 },
  { bairro: 'Madalena', cidade: 'Recife', total: 9, lat: -8.054, lng: -34.908 },
  { bairro: 'Espinheiro', cidade: 'Recife', total: 4, lat: -8.042, lng: -34.895 },
  { bairro: 'Várzea', cidade: 'Recife', total: 1, lat: -8.045, lng: -34.96 },
];

export default function useConcentracaoPacientes(): { dados: ConcentracaoBairro[]; carregando: boolean } {
  return { dados: DADOS_TESTE, carregando: false };
}

/*
// TROCAR pelo real quando src/lib/concentracaoPacientes.ts existir.
// Substitua a função acima por esta e acrescente os imports no topo do arquivo:
//
// import { useCallback, useState } from 'react';
// import { useFocusEffect } from '@react-navigation/native';
// import { collection, query, where, getDocs } from 'firebase/firestore';
// import { auth, db } from '../../lib/firebase';
// import { agruparPorBairro } from '../../lib/concentracaoPacientes';

export default function useConcentracaoPacientes(): { dados: ConcentracaoBairro[]; carregando: boolean } {
  const [dados, setDados] = useState<ConcentracaoBairro[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Mesmo padrão da ListagemPacientesScreen: busca os pacientes da clínica logada ao focar a tela.
  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      (async () => {
        const clinicaId = auth.currentUser?.uid;
        if (!clinicaId) {
          setCarregando(false);
          return;
        }
        try {
          const q = query(collection(db, 'pacientes'), where('clinicaId', '==', clinicaId));
          const snap = await getDocs(q);
          // Os documentos só são usados aqui dentro para agrupar; a tela recebe apenas os totais.
          const agrupado = agruparPorBairro(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
          if (ativo) setDados(agrupado);
        } catch (e) {
          console.warn('Erro ao buscar pacientes para o mapa', e);
          if (ativo) setDados([]);
        } finally {
          if (ativo) setCarregando(false);
        }
      })();
      return () => {
        ativo = false;
      };
    }, []),
  );

  return { dados, carregando };
}
*/
