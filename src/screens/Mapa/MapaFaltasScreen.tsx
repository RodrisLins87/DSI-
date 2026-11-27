import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COR, CabecalhoTela } from '../Consultas/components/AgendamentoCampos';
import { FONT } from '../../global/fonts';
import {
  BAIRROS_MAPEADOS,
  FAIXAS,
  MIN_CONSULTAS,
  TODOS_BAIRROS,
  corDaConcentracao,
  corDaTaxa,
  diametroDoCirculo,
  faixasDaConcentracao,
  nomeBonito,
  pct,
} from './utils';
import useConcentracaoPacientes from './useConcentracaoPacientes';

type Camada = 'pacientes' | 'faltas';

const OPCOES: { valor: Camada; rotulo: string }[] = [
  { valor: 'pacientes', rotulo: 'Pacientes da clínica' },
  { valor: 'faltas', rotulo: 'Faltas (dataset)' },
];

// Zoom usado quando a camada tem um ponto só (fitToCoordinates num ponto daria zoom máximo).
const DELTA_UM_PONTO = 0.03;
const MARGEM_MAPA = { top: 40, right: 40, bottom: 260, left: 40 };

/**
 * Mapa de faltas por bairro.
 * Fonte: base pública "Medical Appointment No Shows" (Kaggle, consultas de Vitória-ES, 2016),
 * a mesma usada no artigo e no dashboard. Não são dados da clínica logada.
 *
 * - Cada círculo é um bairro: o tamanho é o nº de consultas e a cor é a taxa de falta.
 * - Bairros com poucas consultas (< MIN_CONSULTAS) ficam de fora, porque a taxa deles
 *   oscila por acaso (ex.: 2 consultas, 100% de falta).
 * - As coordenadas vêm de src/data/bairrosFaltas.json, preenchido por
 *   `node scripts/geocodificarBairros.mjs`.
 * - Faixas de cor, filtro e formatação ficam em ./utils (o mini mapa da Home usa os mesmos).
 *
 * Camada "Pacientes da clínica" (padrão): um círculo por bairro com o TOTAL de pacientes
 * cadastrados (useConcentracaoPacientes). Só totais por bairro, nenhum dado individual (LGPD).
 */
export default function MapaFaltasScreen({ navigation }: { navigation: any }) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const [camada, setCamada] = useState<Camada>('pacientes');
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [mapaPronto, setMapaPronto] = useState(false);
  const jaAjustou = useRef(false);

  const { dados: pacientesBairro, carregando } = useConcentracaoPacientes();
  const maiorPacientes = Math.max(1, ...pacientesBairro.map((b) => b.total));
  const totalPacientes = pacientesBairro.reduce((s, b) => s + b.total, 0);
  const chaveBairro = (b: { bairro: string; cidade: string }) => `${b.bairro}|${b.cidade}`;
  const bairroAtual =
    camada === 'pacientes' ? pacientesBairro.find((b) => chaveBairro(b) === selecionado) ?? null : null;

  const { mediaGeral, mapeados, cobertura } = useMemo(() => {
    const totalConsultas = TODOS_BAIRROS.reduce((s, b) => s + b.consultas, 0);
    const totalFaltas = TODOS_BAIRROS.reduce((s, b) => s + b.faltas, 0);
    const mapeados = BAIRROS_MAPEADOS;
    const consultasMapeadas = mapeados.reduce((s, b) => s + b.consultas, 0);
    return {
      mediaGeral: (totalFaltas / totalConsultas) * 100,
      mapeados,
      cobertura: (consultasMapeadas / totalConsultas) * 100,
    };
  }, []);

  const maiorN = Math.max(1, ...mapeados.map((b) => b.consultas));
  const diametro = (n: number) => diametroDoCirculo(n, maiorN);
  const atual = camada === 'faltas' ? mapeados.find((b) => b.nome === selecionado) ?? null : null;

  // Enquadra os pontos da camada atual. Lista vazia: não mexe no mapa.
  function ajustarMapa() {
    const pontos =
      camada === 'pacientes'
        ? pacientesBairro.map((b) => ({ latitude: b.lat, longitude: b.lng }))
        : mapeados.map((b) => ({ latitude: b.lat as number, longitude: b.lng as number }));
    if (pontos.length === 0) return;
    const animado = jaAjustou.current; // a primeira vez (ao abrir a tela) é sem animação, como antes
    jaAjustou.current = true;
    if (pontos.length === 1) {
      mapRef.current?.animateToRegion(
        { ...pontos[0], latitudeDelta: DELTA_UM_PONTO, longitudeDelta: DELTA_UM_PONTO },
        animado ? 500 : 0,
      );
      return;
    }
    mapRef.current?.fitToCoordinates(pontos, { edgePadding: MARGEM_MAPA, animated: animado });
  }

  // Ao abrir, ao trocar de camada e quando os dados de pacientes chegam.
  useEffect(() => {
    if (mapaPronto) ajustarMapa();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapaPronto, camada, pacientesBairro]);

  function trocarCamada(nova: Camada) {
    if (nova === camada) return;
    setSelecionado(null);
    setCamada(nova);
  }

  return (
    <View style={st.container}>
      <CabecalhoTela titulo="Mapa de Faltas" onVoltar={() => navigation.goBack()} />

      <View style={st.seletor}>
        {OPCOES.map((o) => {
          const ativa = o.valor === camada;
          return (
            <TouchableOpacity
              key={o.valor}
              style={[st.seletorOpcao, ativa && st.seletorOpcaoAtiva]}
              onPress={() => trocarCamada(o.valor)}
              activeOpacity={0.8}
            >
              <Text style={[st.seletorTexto, ativa && st.seletorTextoAtivo]}>{o.rotulo}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={st.mapaArea}>
      <MapView
        ref={mapRef}
        style={st.mapa}
        initialRegion={{ latitude: -20.29, longitude: -40.31, latitudeDelta: 0.14, longitudeDelta: 0.14 }}
        onMapReady={() => setMapaPronto(true)}
        onPress={() => setSelecionado(null)}
        toolbarEnabled={false}
      >
        {camada === 'pacientes' &&
          pacientesBairro.map((b) => {
            const d = diametroDoCirculo(b.total, maiorPacientes);
            const ativo = chaveBairro(b) === selecionado;
            return (
              <Marker
                key={`${chaveBairro(b)}-${ativo}`} // recria o marcador quando muda a seleção
                coordinate={{ latitude: b.lat, longitude: b.lng }}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={false}
                zIndex={ativo ? 10 : Math.round(100 - d)} // círculos menores ficam por cima dos grandes
                onPress={(e: any) => {
                  e.stopPropagation?.();
                  setSelecionado(chaveBairro(b));
                }}
              >
                <View
                  style={[
                    st.circulo,
                    {
                      width: d,
                      height: d,
                      borderRadius: d / 2,
                      backgroundColor: corDaConcentracao(b.total, maiorPacientes),
                      borderWidth: ativo ? 3 : 1.5,
                      borderColor: ativo ? COR.escuro : COR.branco,
                    },
                  ]}
                />
              </Marker>
            );
          })}

        {camada === 'faltas' && mapeados.map((b) => {
          const taxa = (b.faltas / b.consultas) * 100;
          const d = diametro(b.consultas);
          const ativo = b.nome === selecionado;
          return (
            <Marker
              key={`${b.nome}-${ativo}`} // recria o marcador quando muda a seleção
              coordinate={{ latitude: b.lat as number, longitude: b.lng as number }}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
              zIndex={ativo ? 10 : Math.round(100 - d)} // círculos menores ficam por cima dos grandes
              onPress={(e: any) => {
                e.stopPropagation?.();
                setSelecionado(b.nome);
              }}
            >
              <View
                style={{
                  width: d,
                  height: d,
                  borderRadius: d / 2,
                  backgroundColor: corDaTaxa(taxa),
                  opacity: 0.9,
                  borderWidth: ativo ? 3 : 1.5,
                  borderColor: ativo ? COR.escuro : COR.branco,
                }}
              />
            </Marker>
          );
        })}
      </MapView>

      {camada === 'pacientes' && !carregando && pacientesBairro.length === 0 && (
        <View style={st.aviso}>
          <Text style={st.avisoTitulo}>Nenhum paciente com localização ainda</Text>
          <Text style={st.avisoTexto}>
            O mapa aparece quando houver pacientes com endereço cadastrado.
          </Text>
        </View>
      )}

      {camada === 'faltas' && mapeados.length === 0 && (
        <View style={st.aviso}>
          <Text style={st.avisoTitulo}>Coordenadas dos bairros ainda não geradas</Text>
          <Text style={st.avisoTexto}>
            Na pasta do projeto, rode:{'\n'}node scripts/geocodificarBairros.mjs
          </Text>
        </View>
      )}
      </View>

      {camada === 'pacientes' && (
        <View style={[st.painel, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
          {bairroAtual ? (
            <>
              <Text style={st.nome}>{bairroAtual.bairro}</Text>
              <Text style={st.detalhe}>{bairroAtual.cidade}</Text>
              <View style={st.linhaTaxa}>
                <Text style={st.taxa}>{bairroAtual.total.toLocaleString('pt-BR')}</Text>
                <Text style={st.taxaRotulo}>{bairroAtual.total === 1 ? 'paciente' : 'pacientes'}</Text>
              </View>
              <Text style={st.detalhe}>
                {pct((bairroAtual.total / Math.max(1, totalPacientes)) * 100)}% dos pacientes com localização
              </Text>
            </>
          ) : (
            <>
              <Text style={st.nome}>Pacientes por bairro</Text>
              <Text style={st.detalhe}>
                {carregando
                  ? 'Carregando pacientes…'
                  : 'Toque em um círculo. Tamanho e cor = nº de pacientes cadastrados.'}
              </Text>
            </>
          )}

          {pacientesBairro.length > 0 && (
            <View style={st.legenda}>
              {faixasDaConcentracao(maiorPacientes).map((f) => (
                <View key={f.cor} style={st.legendaItem}>
                  <View style={[st.legendaCor, { backgroundColor: f.cor }]} />
                  <Text style={st.legendaTexto}>{f.rotulo}</Text>
                </View>
              ))}
            </View>
          )}

          <Text style={st.fonte}>Somente totais por bairro. Nenhum endereço individual é exibido.</Text>
        </View>
      )}

      {camada === 'faltas' && (
      <View style={[st.painel, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
        {atual ? (
          <>
            <Text style={st.nome}>{nomeBonito(atual.nome)}</Text>
            <View style={st.linhaTaxa}>
              <Text style={st.taxa}>{pct((atual.faltas / atual.consultas) * 100)}%</Text>
              <Text style={st.taxaRotulo}>de falta</Text>
            </View>
            <Text style={st.detalhe}>
              {atual.faltas.toLocaleString('pt-BR')} faltas em {atual.consultas.toLocaleString('pt-BR')} consultas
            </Text>
            <Text style={st.detalhe}>
              {(() => {
                const dif = (atual.faltas / atual.consultas) * 100 - mediaGeral;
                return `${dif >= 0 ? '+' : '−'}${pct(Math.abs(dif))} p.p. em relação à média geral (${pct(mediaGeral)}%)`;
              })()}
            </Text>
          </>
        ) : (
          <>
            <Text style={st.nome}>Taxa de falta por bairro</Text>
            <Text style={st.detalhe}>
              Toque em um círculo. Tamanho = nº de consultas · Cor = taxa de falta (média geral {pct(mediaGeral)}%).
            </Text>
          </>
        )}

        <View style={st.legenda}>
          {FAIXAS.map((f) => (
            <View key={f.rotulo} style={st.legendaItem}>
              <View style={[st.legendaCor, { backgroundColor: f.cor }]} />
              <Text style={st.legendaTexto}>{f.rotulo}</Text>
            </View>
          ))}
        </View>

        <Text style={st.fonte}>
          Dados públicos (Kaggle, Vitória-ES, 2016), não da clínica. {mapeados.length} bairros com {MIN_CONSULTAS}+ consultas (
          {pct(cobertura, 0)}% das consultas). Em bairros pequenos a taxa varia por acaso.
        </Text>
      </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: COR.fundo },
  seletor: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 12,
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COR.borda,
    backgroundColor: COR.branco,
  },
  seletorOpcao: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  seletorOpcaoAtiva: { backgroundColor: COR.destaque },
  seletorTexto: { fontFamily: FONT.medium, fontSize: 13, color: COR.suave },
  seletorTextoAtivo: { fontFamily: FONT.semibold, color: COR.destaqueTexto },
  mapaArea: { flex: 1 },
  mapa: { flex: 1 },
  circulo: { opacity: 0.9 },
  painel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COR.branco,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    borderColor: COR.borda,
    paddingTop: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },
  nome: { fontFamily: FONT.semibold, fontSize: 18, lineHeight: 26, color: COR.escuro },
  linhaTaxa: { flexDirection: 'row', alignItems: 'baseline', marginTop: 2 },
  taxa: { fontFamily: FONT.bold, fontSize: 32, lineHeight: 40, color: COR.texto },
  taxaRotulo: { fontFamily: FONT.medium, fontSize: 14, color: COR.suave, marginLeft: 8 },
  detalhe: { fontFamily: FONT.regular, fontSize: 14, lineHeight: 22, color: COR.suave, marginTop: 2 },
  legenda: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 },
  legendaItem: { flexDirection: 'row', alignItems: 'center', marginRight: 14, marginBottom: 4 },
  legendaCor: { width: 12, height: 12, borderRadius: 6, marginRight: 6, borderWidth: 1, borderColor: COR.borda },
  legendaTexto: { fontFamily: FONT.medium, fontSize: 12, color: COR.suave },
  fonte: { fontFamily: FONT.regular, fontSize: 11, lineHeight: 16, color: COR.placeholder, marginTop: 8 },
  aviso: {
    position: 'absolute',
    top: 16, // relativo à área do mapa (abaixo do seletor)
    left: 20,
    right: 20,
    backgroundColor: COR.branco,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COR.borda,
    padding: 16,
  },
  avisoTitulo: { fontFamily: FONT.semibold, fontSize: 14, color: COR.escuro },
  avisoTexto: { fontFamily: FONT.regular, fontSize: 13, lineHeight: 20, color: COR.suave, marginTop: 4 },
});
