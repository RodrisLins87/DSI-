// ============================================================================
//  Descobre a latitude/longitude de cada bairro de src/data/bairrosFaltas.json
//  usando o Nominatim (OpenStreetMap). Rode UMA vez, no seu computador (precisa de internet):
//
//      node scripts/geocodificarBairros.mjs
//
//  Leva ~1,5 minuto (1 consulta por segundo, que é o limite do serviço).
//  Pode ser interrompido e rodado de novo: ele pula os bairros que já têm coordenada.
//  No final mostra quais bairros não foram achados (normalmente são bairros minúsculos).
// ============================================================================
import { readFileSync, writeFileSync } from 'node:fs';

const ARQUIVO = new URL('../src/data/bairrosFaltas.json', import.meta.url);
const dados = JSON.parse(readFileSync(ARQUIVO, 'utf8'));

// Região de Vitória-ES (esquerda, topo, direita, base). Resultados fora dela são descartados.
const VIEWBOX = [-40.45, -20.2, -40.15, -20.4];
const dentro = (lat, lng) => lat <= -20.2 && lat >= -20.4 && lng >= -40.45 && lng <= -40.15;
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

async function buscar(texto) {
  const url =
    'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&bounded=1' +
    `&viewbox=${VIEWBOX.join(',')}&q=${encodeURIComponent(texto)}`;
  const resp = await fetch(url, { headers: { 'User-Agent': 'VittaFlow-projeto-academico/1.0', 'Accept-Language': 'pt-BR' } });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const lista = await resp.json();
  if (!lista.length) return null;
  const lat = Number(lista[0].lat), lng = Number(lista[0].lon);
  return dentro(lat, lng) ? { lat, lng } : null;
}

const limpo = (n) => n.replace('´', "'");
let achados = 0;
const faltando = [];

for (const b of dados) {
  if (b.lat != null && b.lng != null) { achados++; continue; }
  if (b.consultas < 100) continue; // o mapa só usa bairros com 100+ consultas
  let r = null;
  try {
    r = (await buscar(`${limpo(b.nome)}, Vitória, Espírito Santo`)) || (await buscar(`${limpo(b.nome)}, Vitória`));
  } catch (e) {
    console.log(`  ! ${b.nome}: ${e.message}`);
  }
  if (r) { b.lat = r.lat; b.lng = r.lng; achados++; console.log(`  ok  ${b.nome}  ${r.lat.toFixed(5)}, ${r.lng.toFixed(5)}`); }
  else { faltando.push(b); console.log(`  --  ${b.nome} (não encontrado)`); }
  writeFileSync(ARQUIVO, JSON.stringify(dados, null, 2) + '\n'); // salva a cada bairro
  await espera(1100);
}

const grandes = dados.filter((b) => b.consultas >= 100);
const total = dados.reduce((s, b) => s + b.consultas, 0);
const mapeadas = grandes.filter((b) => b.lat != null).reduce((s, b) => s + b.consultas, 0);
console.log(`\nBairros com coordenada: ${grandes.filter((b) => b.lat != null).length} de ${grandes.length} (com 100+ consultas)`);
console.log(`Consultas cobertas pelo mapa: ${((mapeadas / total) * 100).toFixed(1)}%`);
if (faltando.length) {
  console.log('\nNão encontrados (dá para preencher lat/lng à mão em src/data/bairrosFaltas.json, copiando do Google Maps):');
  faltando.forEach((b) => console.log(`  - ${b.nome} (${b.consultas} consultas)`));
}
