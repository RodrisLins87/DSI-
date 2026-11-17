import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import {
  BAIRROS_MAPEADOS,
  MIN_CONSULTAS,
  TODOS_BAIRROS,
  corDaTaxa,
  diametroDoCirculo,
  nomeBonito,
  pct,
  taxaDeFalta,
} from '../../Mapa/utils';

/**
 * Mini mapa de faltas por bairro para a Home (só visualização).
 * Tocar em qualquer parte abre a tela completa (MapaFaltas).
 */

// Círculos menores que na tela cheia, porque o mapa aqui tem só ~220px de altura.
const ESCALA_CIRCULO = 0.6;
const MAIOR_N = Math.max(1, ...BAIRROS_MAPEADOS.map((b) => b.consultas));

// Região que enquadra todos os bairros, com uma folga nas bordas.
const REGIAO = (() => {
  const lats = BAIRROS_MAPEADOS.map((b) => b.lat as number);
  const lngs = BAIRROS_MAPEADOS.map((b) => b.lng as number);
  if (lats.length === 0) {
    return { latitude: -20.29, longitude: -40.31, latitudeDelta: 0.14, longitudeDelta: 0.14 };
  }
  const [minLat, maxLat] = [Math.min(...lats), Math.max(...lats)];
  const [minLng, maxLng] = [Math.min(...lngs), Math.max(...lngs)];
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: (maxLat - minLat) * 1.3,
    longitudeDelta: (maxLng - minLng) * 1.3,
  };
})();

// As 3 maiores taxas de falta entre os bairros com MIN_CONSULTAS+ consultas.
const TOP_3 = TODOS_BAIRROS.filter((b) => b.consultas >= MIN_CONSULTAS)
  .sort((a, b) => taxaDeFalta(b) - taxaDeFalta(a))
  .slice(0, 3);

export default function MapaFaltasResumo() {
  const navigation = useNavigation<any>();

  return (
    <Pressable style={styles.card} onPress={() => navigation.navigate('MapaFaltas')}>
      <Text style={styles.titulo}>Faltas por bairro</Text>
      <Text style={styles.legenda}>Toque para ver detalhes · dados públicos (Kaggle, Vitória-ES, 2016)</Text>

      {/* pointerEvents="none": o toque passa direto para o Pressable em vez de ficar no mapa */}
      <View style={styles.mapaBox} pointerEvents="none">
        <MapView
          style={StyleSheet.absoluteFill}
          initialRegion={REGIAO}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          toolbarEnabled={false}
        >
          {BAIRROS_MAPEADOS.map((b) => {
            const d = diametroDoCirculo(b.consultas, MAIOR_N, ESCALA_CIRCULO);
            return (
              <Marker
                key={b.nome}
                coordinate={{ latitude: b.lat as number, longitude: b.lng as number }}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={false}
                zIndex={Math.round(100 - d)} // círculos menores ficam por cima dos grandes
              >
                <View
                  style={{
                    width: d,
                    height: d,
                    borderRadius: d / 2,
                    backgroundColor: corDaTaxa(taxaDeFalta(b)),
                    opacity: 0.9,
                    borderWidth: 1,
                    borderColor: '#FFFFFF',
                  }}
                />
              </Marker>
            );
          })}
        </MapView>
      </View>

      {TOP_3.map((b) => (
        <Text key={b.nome} style={styles.topLinha}>
          {nomeBonito(b.nome)} · {pct(taxaDeFalta(b))}%
        </Text>
      ))}
    </Pressable>
  );
}

// Mesmas cores dos cards da HomeScreen.
const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E5E9',
    padding: 18,
    marginBottom: 12,
  },
  titulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0E3D3A',
  },
  legenda: {
    fontSize: 12,
    color: '#5A6B69',
    marginTop: 2,
    marginBottom: 12,
  },
  mapaBox: {
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  topLinha: {
    fontSize: 14,
    color: '#0E3D3A',
    marginTop: 4,
  },
});
