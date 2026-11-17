import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
  Linking,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ImageSourcePropType,
} from 'react-native';

export interface Propaganda {
  id: string;
  imagem: ImageSourcePropType; // { uri: 'https://...' } ou require('../../assets/banner1.png')
  titulo?: string;
  subtitulo?: string;
  textoBotao?: string;
  link?: string;
}

const PROPAGANDAS_PADRAO: Propaganda[] = [
  {
    id: '1',
    imagem: { uri: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200' },
    titulo: 'Cuide da sua saúde',
    subtitulo: 'Agende seus exames com desconto',
    textoBotao: 'Saiba mais',
  },
  {
    id: '2',
    imagem: { uri: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1200' },
    titulo: 'Tecnologia em diagnósticos',
    subtitulo: 'Resultados rápidos e precisos',
    textoBotao: 'Conheça',
  },
  {
    id: '3',
    imagem: { uri: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=1200' },
    titulo: 'Atendimento humanizado',
    subtitulo: 'Equipe pronta para te receber',
    textoBotao: 'Fale conosco',
  },
];

interface Props {
  propagandas?: Propaganda[];
  intervaloMs?: number;
  // Deve bater com o padding horizontal do scrollContent da Home (16 de cada lado)
  margemHorizontal?: number;
}

export default function CarrosselPropaganda({
  propagandas = PROPAGANDAS_PADRAO,
  intervaloMs = 4000,
  margemHorizontal = 16,
}: Props) {
  const { width: larguraTela } = useWindowDimensions();
  const largura = larguraTela - margemHorizontal * 2;
  const altura = Math.round(largura * 0.5);

  const listaRef = useRef<FlatList<Propaganda>>(null);
  const [indice, setIndice] = useState(0);
  const indiceRef = useRef(0);
  const arrastando = useRef(false);

  // Troca automática de slide
  useEffect(() => {
    if (propagandas.length <= 1) return;
    const timer = setInterval(() => {
      if (arrastando.current) return;
      const proximo = (indiceRef.current + 1) % propagandas.length;
      listaRef.current?.scrollToOffset({ offset: proximo * largura, animated: true });
      indiceRef.current = proximo;
      setIndice(proximo);
    }, intervaloMs);
    return () => clearInterval(timer);
  }, [propagandas.length, intervaloMs, largura]);

  function aoTerminarScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    arrastando.current = false;
    const novo = Math.round(e.nativeEvent.contentOffset.x / largura);
    indiceRef.current = novo;
    setIndice(novo);
  }

  function abrirLink(link?: string) {
    if (link) Linking.openURL(link).catch(() => {});
  }