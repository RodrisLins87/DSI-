import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';

/** Arquivos das fontes, para o useFonts() do App.tsx carregar. */
export const FONT_ASSETS = {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
};

/**
 * Nomes para usar em `fontFamily` nos estilos (o design do Figma usa Manrope).
 * Com fonte customizada NÃO se usa `fontWeight`: o peso já vem na família.
 */
export const FONT = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
} as const;