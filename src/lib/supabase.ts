import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
    },
});

export const BUCKET_LAUDOS = 'laudos';

// O Supabase recusa nomes com acento e alguns símbolos
export function nomeSeguro(nome: string): string {
    return nome
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function enviarArquivo(caminho: string, uri: string, tipo?: string | null): Promise<void> {
    const resposta = await fetch(uri);
    const buffer = await resposta.arrayBuffer();
    const { error } = await supabase.storage.from(BUCKET_LAUDOS).upload(caminho, buffer, {
        contentType: tipo ?? 'application/octet-stream',
        upsert: false,
    });
    if (error) throw error;
}

export async function urlDoArquivo(caminho: string): Promise<string> {
    const { data, error } = await supabase.storage.from(BUCKET_LAUDOS).createSignedUrl(caminho, 3600);
    if (error) throw error;
    return data.signedUrl;
}

export async function apagarArquivo(caminho: string): Promise<void> {
    const { error } = await supabase.storage.from(BUCKET_LAUDOS).remove([caminho]);
    if (error) throw error;
}
