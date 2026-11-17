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
  return (
    <View style={styles.wrapper}>
      <FlatList
        ref={listaRef}
        data={propagandas}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={largura}
        decelerationRate="fast"
        onScrollBeginDrag={() => {
          arrastando.current = true;
        }}
        onMomentumScrollEnd={aoTerminarScroll}
        getItemLayout={(_, i) => ({ length: largura, offset: largura * i, index: i })}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={item.link ? 0.85 : 1}
            onPress={() => abrirLink(item.link)}
            style={{ width: largura, height: altura }}
          >
            <ImageBackground
              source={item.imagem}
              style={styles.imagem}
              imageStyle={styles.imagemRadius}
              resizeMode="cover"
            >
              <View style={styles.overlay} />

              <View style={styles.tag}>
                <Text style={styles.tagTexto}>Publicidade</Text>
              </View>

              <View style={styles.conteudo}>
                {!!item.titulo && <Text style={styles.titulo}>{item.titulo}</Text>}
                {!!item.subtitulo && <Text style={styles.subtitulo}>{item.subtitulo}</Text>}
                {!!item.textoBotao && (
                  <View style={styles.botao}>
                    <Text style={styles.botaoTexto}>{item.textoBotao}</Text>
                  </View>
                )}
              </View>
            </ImageBackground>
          </TouchableOpacity>
        )}
      />

      {/* Indicadores (bolinhas) */}
      {propagandas.length > 1 && (
        <View style={styles.dots}>
          {propagandas.map((p, i) => (
            <View key={p.id} style={[styles.dot, i === indice && styles.dotAtivo]} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  imagem: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  imagemRadius: {
    borderRadius: 16,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(14,61,58,0.45)',
    borderRadius: 16,
  },
  tag: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tagTexto: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  conteudo: {
    padding: 16,
  },
  titulo: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitulo: {
    color: '#E6F0EE',
    fontSize: 13,
    marginTop: 2,
  },
  botao: {
    alignSelf: 'flex-start',
    backgroundColor: '#3FD9C4',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginTop: 10,
  },
  botaoTexto: {
    color: '#0E3D3A',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#C9CFD4',
  },
  dotAtivo: {
    width: 18,
    backgroundColor: '#0E3D3A',
  },
});