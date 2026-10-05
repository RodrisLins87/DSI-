import React, { useMemo, useState, ReactNode } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  KeyboardTypeOptions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, Feather } from '@expo/vector-icons';
import {
  collection,
  addDoc,
  getDocs,
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
import { ESPECIALIDADES } from '../../utils/especialidades';

type FormKeys =
  | 'nome'
  | 'dataNascimento'
  | 'genero'
  | 'raca'
  | 'cpf'
  | 'crm'
  | 'especialidade'
  | 'telefone'
  | 'email';

type FormData = Record<FormKeys, string>;
type Errors = Partial<Record<FormKeys, string>>;
type Touched = Partial<Record<FormKeys, boolean>>;

const EMPTY_FORM: FormData = {
  nome: '',
  dataNascimento: '',
  genero: '',
  raca: '',
  cpf: '',
  crm: '',
  especialidade: '',
  telefone: '',
  email: '',
};

const ALL_KEYS = Object.keys(EMPTY_FORM) as FormKeys[];

// ---------- Validação (todos os campos são obrigatórios) ----------
function validate(f: FormData): Errors {
  const e: Errors = {};
  if (!f.nome.trim()) e.nome = 'Informe o nome completo.';
  else if (f.nome.trim().split(/\s+/).length < 2) e.nome = 'Informe nome e sobrenome.';

  if (!f.dataNascimento) e.dataNascimento = 'Informe a data de nascimento.';
  else if (!isValidDate(f.dataNascimento)) e.dataNascimento = 'Data inválida (DD/MM/AAAA).';

  if (!f.genero.trim()) e.genero = 'Informe o gênero.';
  if (!f.raca.trim()) e.raca = 'Informe a raça.';

  if (!f.cpf) e.cpf = 'Informe o CPF.';
  else if (!isValidCPF(f.cpf)) e.cpf = 'CPF inválido.';

  if (!f.crm.trim()) {
    e.crm = 'Informe o CRM.';
  } else if (f.crm.trim().length > 6) {
    e.crm = 'O CRM deve ter no máximo 6 caracteres.';
  }
  if (!f.especialidade) e.especialidade = 'Selecione uma especialidade.';

  if (!f.telefone) e.telefone = 'Informe o telefone.';
  else if (onlyDigits(f.telefone).length < 10) e.telefone = 'Telefone incompleto.';

  if (!f.email.trim()) e.email = 'Informe o e-mail.';
  else if (!isValidEmail(f.email.trim())) e.email = 'E-mail inválido.';

  return e;
}

// ---------- Campo reutilizável ----------
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
}: FieldProps) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputContainer, !!error && styles.inputError]}>
        {icon}
        <TextInput
          style={styles.inputText}
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          placeholder={placeholder}
          placeholderTextColor="#8A9599"
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
        />
      </View>
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

// ---------- Tela ----------
export default function FormularioMedicoScreen() {
  const navigation = useNavigation<any>();

  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [touched, setTouched] = useState<Touched>({});
  const [saving, setSaving] = useState<boolean>(false);
  const [pickerVisible, setPickerVisible] = useState<boolean>(false);

  const errors = useMemo(() => validate(form), [form]);
  const isFormValid = Object.keys(errors).length === 0;

  // ---------- Helpers de formulário ----------
  function setField(key: FormKeys, value: string): void {
    let v = value;
    if (key === 'cpf') v = maskCPF(value);
    if (key === 'dataNascimento') v = maskDate(value);
    if (key === 'telefone') v = maskPhone(value);
    if (key === 'crm') v = value.toUpperCase();
    setForm((prev) => ({ ...prev, [key]: v }));
  }

  function markTouched(key: FormKeys): void {
    setTouched((prev) => ({ ...prev, [key]: true }));
  }

  const err = (key: FormKeys): string | undefined => (touched[key] ? errors[key] : undefined);

  // ---------- Cadastro de Médico ----------
  async function handleSave(): Promise<void> {
    setTouched(ALL_KEYS.reduce((acc, k) => ({ ...acc, [k]: true }), {} as Touched));
    if (!isFormValid) return;

    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Erro', 'Sessão expirada. Faça login novamente.');
      return;
    }

    setSaving(true);
    try {
      // 1. Regra de negócio: CRM único dentro da clínica
      const crmQuery = query(
        collection(db, 'medicos'),
        where('clinicaId', '==', user.uid),
        where('crm', '==', form.crm.trim())
      );
      const crmSnap = await getDocs(crmQuery);

      if (!crmSnap.empty) {
        Alert.alert('CRM já cadastrado', 'Já existe um médico com este CRM na sua clínica.');
        return;
      }

      // 2. Regra de negócio: CPF único dentro da clínica
      const cpfQuery = query(
        collection(db, 'medicos'),
        where('clinicaId', '==', user.uid),
        where('cpf', '==', form.cpf.trim())
      );
      const cpfSnap = await getDocs(cpfQuery);

      if (!cpfSnap.empty) {
        Alert.alert('CPF já cadastrado', 'Já existe um médico com este CPF na sua clínica.');
        return;
      }

      const payload = {
        nome: form.nome.trim(),
        dataNascimento: form.dataNascimento,
        genero: form.genero.trim(),
        raca: form.raca.trim(),
        cpf: form.cpf.trim(),
        crm: form.crm.trim(),
        especialidade: form.especialidade,
        telefone: form.telefone,
        email: form.email.trim().toLowerCase(),
      };

      await addDoc(collection(db, 'medicos'), {
        ...payload,
        clinicaId: user.uid,
        createdAt: serverTimestamp(),
      });

      Alert.alert(
        'Sucesso',
        'Médico cadastrado com sucesso!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert('Erro ao salvar', error.message);
    } finally {
      setSaving(false);
    }
  }

  const saveDisabled = !isFormValid || saving;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Cabeçalho */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} disabled={saving}>
          <Ionicons name="arrow-back" size={24} color="#1A2E35" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cadastrar Médico</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Informações Pessoais */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Informações Pessoais</Text>

          <Field
            label="Nome completo"
            placeholder="Dr. João da Silva"
            value={form.nome}
            onChangeText={(t) => setField('nome', t)}
            onBlur={() => markTouched('nome')}
            error={err('nome')}
            autoCapitalize="words"
          />
          <Field
            label="Data de Nascimento"
            placeholder="DD/MM/AAAA"
            value={form.dataNascimento}
            onChangeText={(t) => setField('dataNascimento', t)}
            onBlur={() => markTouched('dataNascimento')}
            error={err('dataNascimento')}
            keyboardType="numeric"
            maxLength={10}
            icon={<Feather name="calendar" size={18} color="#8A9599" style={styles.icon} />}
          />
          <Field
            label="Gênero"
            placeholder="Ex: Feminino"
            value={form.genero}
            onChangeText={(t) => setField('genero', t)}
            onBlur={() => markTouched('genero')}
            error={err('genero')}
            autoCapitalize="words"
          />
          <Field
            label="Raça"
            placeholder="Ex: Branco"
            value={form.raca}
            onChangeText={(t) => setField('raca', t)}
            onBlur={() => markTouched('raca')}
            error={err('raca')}
            autoCapitalize="words"
          />
          <Field
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
            label="CRM"
            placeholder="123456"
            value={form.crm}
            onChangeText={(t) => setField('crm', t)}
            onBlur={() => markTouched('crm')}
            error={err('crm')}
            autoCapitalize="characters"
            maxLength={6}
          />
        </View>

        {/* Contato e Especialidade */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contato e Especialidade</Text>

          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Especialidade</Text>
            <TouchableOpacity
              style={[
                styles.inputContainer,
                !!err('especialidade') && styles.inputError,
              ]}
              activeOpacity={0.7}
              onPress={() => setPickerVisible(true)}
            >
              <Text
                style={[
                  styles.inputText,
                  styles.selectText,
                  !form.especialidade && { color: '#8A9599' },
                ]}
              >
                {form.especialidade || 'Selecione uma especialidade'}
              </Text>
              <Feather name="chevrons-down" size={18} color="#1A2E35" />
            </TouchableOpacity>
            {!!err('especialidade') && <Text style={styles.errorText}>{err('especialidade')}</Text>}
          </View>

          <Field
            label="Telefone/Contato"
            placeholder="(11) 90000-0000"
            value={form.telefone}
            onChangeText={(t) => setField('telefone', t)}
            onBlur={() => markTouched('telefone')}
            error={err('telefone')}
            keyboardType="phone-pad"
            maxLength={15}
            icon={<Feather name="phone" size={18} color="#8A9599" style={styles.icon} />}
          />
          <Field
            label="Email"
            placeholder="exemplo@email.com"
            value={form.email}
            onChangeText={(t) => setField('email', t)}
            onBlur={() => markTouched('email')}
            error={err('email')}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      </ScrollView>

      {/* Rodapé fixo */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.primaryButton, saveDisabled && styles.buttonDisabled]}
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

      {/* Seletor de especialidade */}
      <Modal
        visible={pickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setPickerVisible(false);
            markTouched('especialidade');
          }}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Selecione uma especialidade</Text>
            <FlatList
              data={ESPECIALIDADES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setField('especialidade', item);
                    markTouched('especialidade');
                    setPickerVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      item === form.especialidade && { color: '#006A66', fontWeight: '700' },
                    ]}
                  >
                    {item}
                  </Text>
                  {item === form.especialidade && <Feather name="check" size={18} color="#006A66" />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FF' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: '#F8F9FF',
    borderBottomWidth: 1,
    borderBottomColor: '#E3E8F0',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#006A66' },

  scroll: { padding: 20, paddingBottom: 30 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E3E8F0',
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#0F4C4A', marginBottom: 6 },

  fieldWrap: { marginTop: 14 },
  label: { fontSize: 12, fontWeight: '600', color: '#1A2E35', marginBottom: 6 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: '#BFC8CB',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  inputError: { borderColor: '#BA1A1A' },
  icon: { marginRight: 10 },
  inputText: { flex: 1, fontSize: 14, color: '#1A2E35' },
  selectText: { paddingVertical: 14 },
  errorText: { color: '#BA1A1A', fontSize: 12, marginTop: 4 },

  footer: {
    padding: 20,
    paddingBottom: 30,
    backgroundColor: '#F8F9FF',
    borderTopWidth: 1,
    borderTopColor: '#E3E8F0',
  },
  primaryButton: {
    height: 56,
    borderRadius: 12,
    backgroundColor: '#0F4C4A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 1 },
  buttonDisabled: { opacity: 0.5 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '60%',
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#1A2E35', marginBottom: 10 },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1F4',
  },
  modalItemText: { fontSize: 15, color: '#1A2E35' },
});