
import React, { useEffect, useMemo, useState, ReactNode } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  KeyboardTypeOptions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, Feather } from '@expo/vector-icons';
import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  doc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import {
  maskCPF,
  maskDate,
  maskPhone,
  onlyDigits,
  isValidCPF,
  isValidDate,
  isValidEmail,
} from '../../utils/masks';

type FormKeys =
  | 'nome'
  | 'cpf'
  | 'dataNascimento'
  | 'telefone'
  | 'email'
  | 'genero'
  | 'raca';

type FormData = Record<FormKeys, string>;
type Errors = Partial<Record<FormKeys, string>>;
type Touched = Partial<Record<FormKeys, boolean>>;

const EMPTY_FORM: FormData = {
  nome: '',
  cpf: '',
  dataNascimento: '',
  telefone: '',
  email: '',
  genero: '',
  raca: '',
};

const ALL_KEYS = Object.keys(EMPTY_FORM) as FormKeys[];

function validate(f: FormData): Errors {
  const e: Errors = {};

  if (!f.nome.trim()) e.nome = 'Informe o nome completo.';
  else if (f.nome.trim().split(/\s+/).length < 2) {
    e.nome = 'Informe nome e sobrenome.';
  }

  if (!f.cpf) e.cpf = 'Informe o CPF.';
  else if (!isValidCPF(f.cpf)) e.cpf = 'CPF inválido.';

  if (!f.dataNascimento) {
    e.dataNascimento = 'Informe a data de nascimento.';
  } else if (!isValidDate(f.dataNascimento)) {
    e.dataNascimento = 'Data inválida (DD/MM/AAAA).';
  }

  if (!f.telefone) e.telefone = 'Informe o telefone.';
  else if (onlyDigits(f.telefone).length < 10) {
    e.telefone = 'Telefone incompleto.';
  }

  if (!f.email.trim()) e.email = 'Informe o e-mail.';
  else if (!isValidEmail(f.email.trim())) e.email = 'E-mail inválido.';

  if (!f.genero.trim()) e.genero = 'Informe o gênero.';
  if (!f.raca.trim()) e.raca = 'Informe a raça.';

  return e;
}

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  onBlur: () => void;
  error?: string;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  icon?: ReactNode;
  maxLength?: number;
  editando: boolean;
}

function Field({
  label,
  value,
  onChangeText,
  onBlur,
  error,
  placeholder,
  keyboardType,
  autoCapitalize = 'sentences',
  icon,
  maxLength,
  editando,
}: FieldProps) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={editando ? styles.labelEdicao : styles.label}>
        {label}
      </Text>

      <View
        style={[
          styles.inputContainer,
          editando && styles.inputContainerEdicao,
          !!error && styles.inputError,
        ]}
      >
        <TextInput
          style={styles.inputText}
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          placeholder={placeholder}
          placeholderTextColor="#70787B"
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
        />
        {icon}
      </View>

      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

export default function FormularioResponsavelScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const responsavelId: string | undefined = route.params?.responsavelId;
  const editando = !!responsavelId;

  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [touched, setTouched] = useState<Touched>({});
  const [saving, setSaving] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(editando);

  const errors = useMemo(() => validate(form), [form]);
  const isFormValid = Object.keys(errors).length === 0;

  useEffect(() => {
    if (!responsavelId) return;

    async function carregar(): Promise<void> {
      try {
        const snap = await getDoc(
          doc(db, 'responsaveis', responsavelId as string)
        );
        const dados = snap.data();

        if (
          !snap.exists() ||
          !dados ||
          dados.clinicaId !== auth.currentUser?.uid
        ) {
          Alert.alert('Erro', 'Responsável não encontrado.', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
          return;
        }

        setForm({
          nome: dados.nome ?? '',
          cpf: dados.cpf ?? '',
          dataNascimento: dados.dataNascimento ?? '',
          telefone: dados.telefone ?? '',
          email: dados.email ?? '',
          genero: dados.genero ?? '',
          raca: dados.raca ?? '',
        });
      } catch (error: any) {
        Alert.alert('Erro ao carregar', error.message, [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, [responsavelId, navigation]);

  function setField(key: FormKeys, value: string): void {
    let v = value;

    if (key === 'cpf') v = maskCPF(value);
    if (key === 'dataNascimento') v = maskDate(value);
    if (key === 'telefone') v = maskPhone(value);

    setForm((prev) => ({ ...prev, [key]: v }));
  }

  function markTouched(key: FormKeys): void {
    setTouched((prev) => ({ ...prev, [key]: true }));
  }

  const err = (key: FormKeys): string | undefined =>
    touched[key] ? errors[key] : undefined;

  async function handleSave(): Promise<void> {
    setTouched(
      ALL_KEYS.reduce(
        (acc, k) => ({ ...acc, [k]: true }),
        {} as Touched
      )
    );

    if (!isFormValid) return;

    const user = auth.currentUser;

    if (!user) {
      Alert.alert('Erro', 'Sessão expirada. Faça login novamente.');
      return;
    }

    setSaving(true);

    try {
      const cpfQuery = query(
        collection(db, 'responsaveis'),
        where('clinicaId', '==', user.uid),
        where('cpf', '==', form.cpf.trim())
      );

      const cpfSnap = await getDocs(cpfQuery);
      const duplicado = cpfSnap.docs.some(
        (d) => d.id !== responsavelId
      );

      if (duplicado) {
        Alert.alert(
          'CPF já cadastrado',
          'Já existe um responsável com este CPF na sua clínica.'
        );
        return;
      }

      const payload = {
        nome: form.nome.trim(),
        cpf: form.cpf.trim(),
        dataNascimento: form.dataNascimento,
        telefone: form.telefone,
        email: form.email.trim().toLowerCase(),
        genero: form.genero.trim(),
        raca: form.raca.trim(),
      };

      if (responsavelId) {
        await updateDoc(doc(db, 'responsaveis', responsavelId), {
          ...payload,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, 'responsaveis'), {
          ...payload,
          clinicaId: user.uid,
          createdAt: serverTimestamp(),
        });
      }

      Alert.alert(
        'Sucesso',
        editando
          ? 'Responsável atualizado com sucesso!'
          : 'Responsável cadastrado com sucesso!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert('Erro ao salvar', error.message);
    } finally {
      setSaving(false);
    }
  }

  const saveDisabled = !isFormValid || saving || loading;

  const campos = (
    <>
      <Field
        editando={editando}
        label={editando ? 'Nome Completo' : 'Nome completo'}
        placeholder="Ex: Maria Silva"
        value={form.nome}
        onChangeText={(t) => setField('nome', t)}
        onBlur={() => markTouched('nome')}
        error={err('nome')}
        autoCapitalize="words"
      />

      <Field
        editando={editando}
        label="CPF"
        placeholder="000.000.000-00"
        value={form.cpf}
        onChangeText={(t) => setField('cpf', t)}
        onBlur={() => markTouched('cpf')}
        error={err('cpf')}
        keyboardType="numeric"
        maxLength={14}
      />

      <Field
        editando={editando}
        label={editando ? 'Data de Nascimento' : 'Data de nascimento'}
        placeholder="DD/MM/AAAA"
        value={form.dataNascimento}
        onChangeText={(t) => setField('dataNascimento', t)}
        onBlur={() => markTouched('dataNascimento')}
        error={err('dataNascimento')}
        keyboardType="numeric"
        maxLength={10}
        icon={
          !editando ? (
            <Feather name="calendar" size={22} color="#40484B" />
          ) : undefined
        }
      />

      <Field
        editando={editando}
        label="Telefone"
        placeholder="(00) 00000-0000"
        value={form.telefone}
        onChangeText={(t) => setField('telefone', t)}
        onBlur={() => markTouched('telefone')}
        error={err('telefone')}
        keyboardType="phone-pad"
        maxLength={15}
      />

      <Field
        editando={editando}
        label="E-mail"
        placeholder="exemplo@email.com"
        value={form.email}
        onChangeText={(t) => setField('email', t)}
        onBlur={() => markTouched('email')}
        error={err('email')}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Field
        editando={editando}
        label="Gênero"
        placeholder="Ex: Feminino"
        value={form.genero}
        onChangeText={(t) => setField('genero', t)}
        onBlur={() => markTouched('genero')}
        error={err('genero')}
        autoCapitalize="words"
      />

      <Field
        editando={editando}
        label="Raça"
        placeholder="Ex: Branco"
        value={form.raca}
        onChangeText={(t) => setField('raca', t)}
        onBlur={() => markTouched('raca')}
        error={err('raca')}
        autoCapitalize="words"
      />
    </>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          disabled={saving}
          hitSlop={12}
        >
          <Ionicons name="arrow-back" size={24} color="#00353F" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {editando ? 'Responsável' : 'Cadastrar Responsável'}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#006A66"
          style={{ marginTop: 40 }}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {editando ? (
            <View style={styles.card}>
              <View style={styles.cardTopo}>
                <View style={styles.avatar}>
                  <Ionicons
                    name="person-outline"
                    size={30}
                    color="#00353F"
                  />
                </View>

                <Text style={styles.cardNome} numberOfLines={2}>
                  {form.nome.trim() || 'Responsável'}
                </Text>
              </View>

              <View style={styles.divisor} />
              {campos}
            </View>
          ) : (
            campos
          )}
        </ScrollView>
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.primaryButton,
            saveDisabled && styles.buttonDisabled,
          ]}
          onPress={handleSave}
          disabled={saveDisabled}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>SALVAR</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FF' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 14,
    backgroundColor: '#F8F9FF',
    borderBottomWidth: 1,
    borderBottomColor: '#BFC8CB',
  },
  headerTitle: {
    marginLeft: 24,
    fontSize: 20,
    fontWeight: '600',
    color: '#00353F',
  },

  scroll: { padding: 20, paddingBottom: 30 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 17,
    paddingBottom: 28,
    borderWidth: 1,
    borderColor: '#BFC8CB',
  },
  cardTopo: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 63,
    height: 63,
    borderRadius: 32,
    backgroundColor: '#EFF4FF',
    borderWidth: 1,
    borderColor: '#BFC8CB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardNome: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#00353F',
  },
  divisor: {
    height: 1,
    backgroundColor: '#BFC8CB',
    marginTop: 16,
    marginBottom: 4,
  },

  fieldWrap: { marginTop: 18 },
  label: { fontSize: 14, color: '#40484B', marginBottom: 8 },
  labelEdicao: {
    fontSize: 12,
    fontWeight: '600',
    color: '#40484B',
    marginBottom: 6,
    letterSpacing: 0.4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#BFC8CB',
    borderRadius: 8,
    backgroundColor: '#F8F9FF',
  },
  inputContainerEdicao: {
    height: 50,
    backgroundColor: '#E5EEFF',
  },
  inputError: { borderColor: '#BA1A1A' },
  inputText: { flex: 1, fontSize: 16, color: '#0B1C30' },
  errorText: { color: '#BA1A1A', fontSize: 12, marginTop: 4 },

  footer: {
    padding: 20,
    paddingBottom: 30,
    backgroundColor: '#F8F9FF',
    borderTopWidth: 1,
    borderTopColor: '#BFC8CB',
  },
  primaryButton: {
    height: 56,
    borderRadius: 12,
    backgroundColor: '#004D5B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  buttonDisabled: { opacity: 0.5 },
});