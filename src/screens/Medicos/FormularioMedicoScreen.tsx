import React, { useEffect, useState, useMemo } from 'react';
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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { doc, getDoc, setDoc, updateDoc, collection } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { maskDate, maskCPF, maskPhone, isValidDate, isValidEmail } from '../../utils/masks';
import { ESPECIALIDADES } from '../../utils/especialidades';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONT } from '../../global/fonts';

interface FormData {
  nome: string;
  dataNascimento: string;
  genero: string;
  raca: string;
  cpf: string;
  crm: string;
  especialidade: string;
  telefone: string;
  email: string;
}

type FormKeys = keyof FormData;
type Touched = Partial<Record<FormKeys, boolean>>;
type Errors = Partial<Record<FormKeys, string>>;

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

function validate(f: FormData): Errors {
  const e: Errors = {};
  if (!f.nome.trim()) e.nome = 'Informe o nome completo.';
  if (!f.dataNascimento) e.dataNascimento = 'Informe a data de nascimento.';
  else if (!isValidDate(f.dataNascimento)) e.dataNascimento = 'Data inválida (DD/MM/AAAA).';
  if (!f.genero.trim()) e.genero = 'Informe o gênero.';
  if (!f.raca.trim()) e.raca = 'Informe a raça/cor.';
  if (!f.cpf) e.cpf = 'Informe o CPF.';
  else if (f.cpf.replace(/\D/g, '').length !== 11) e.cpf = 'CPF incompleto.';
  if (!f.crm.trim()) e.crm = 'Informe o CRM.';
  if (!f.especialidade) e.especialidade = 'Selecione a especialidade.';
  if (!f.telefone) e.telefone = 'Informe o telefone.';
  else if (f.telefone.replace(/\D/g, '').length < 10) e.telefone = 'Telefone incompleto.';
  if (!f.email.trim()) e.email = 'Informe o e-mail.';
  else if (!isValidEmail(f.email.trim())) e.email = 'E-mail inválido.';
  return e;
}

export default function FormularioMedicoScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const medicoId: string | undefined = route.params?.medicoId;
  const isEditMode = !!medicoId;

  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [original, setOriginal] = useState<FormData>(EMPTY_FORM);
  const [disponibilidadeOriginal, setDisponibilidadeOriginal] = useState<any[]>([]);
  const [touched, setTouched] = useState<Touched>({});
  const [loadingData, setLoadingData] = useState<boolean>(isEditMode);
  const [saving, setSaving] = useState<boolean>(false);
  const [editing, setEditing] = useState<boolean>(!isEditMode);
  const [pickerVisible, setPickerVisible] = useState<boolean>(false);

  const errors = useMemo(() => validate(form), [form]);
  const isFormValid = Object.keys(errors).length === 0;

  useEffect(() => {
    if (!medicoId) return;
    async function loadMedico(): Promise<void> {
      try {
        const snap = await getDoc(doc(db, 'medicos', medicoId as string));
        const data = snap.data();
        if (!snap.exists() || !data || data.clinicaId !== auth.currentUser?.uid) {
          Alert.alert('Erro', 'Médico não encontrado.', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
          return;
        }
        const loaded: FormData = {
          nome: data.nome ?? '',
          dataNascimento: data.dataNascimento ?? '',
          genero: data.genero ?? '',
          raca: data.raca ?? '',
          cpf: data.cpf ?? '',
          crm: data.crm ?? '',
          especialidade: data.especialidade ?? '',
          telefone: data.telefone ?? '',
          email: data.email ?? '',
        };
        setForm(loaded);
        setOriginal(loaded);
        setDisponibilidadeOriginal(data.disponibilidade ?? []);
      } catch (error: any) {
        Alert.alert('Erro ao carregar', error.message, [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } finally {
        setLoadingData(false);
      }
    }
    loadMedico();
  }, [medicoId]);

  function setField(key: FormKeys, val: string): void {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  function markTouched(key: FormKeys): void {
    setTouched((prev) => ({ ...prev, [key]: true }));
  }

  function err(key: FormKeys): string | undefined {
    return touched[key] ? errors[key] : undefined;
  }

  function cancelEditing(): void {
    setForm(original);
    setTouched({});
    setEditing(false);
  }

  async function handleSave(): Promise<void> {
    const allTouched: Touched = {
      nome: true,
      dataNascimento: true,
      genero: true,
      raca: true,
      cpf: true,
      crm: true,
      especialidade: true,
      telefone: true,
      email: true,
    };
    setTouched(allTouched);

    if (!isFormValid) {
      Alert.alert('Atenção', 'Preencha todos os campos obrigatórios corretamente.');
      return;
    }

    setSaving(true);
    try {
      const clinicaId = auth.currentUser?.uid;
      if (!clinicaId) throw new Error('Sessão expirada. Faça login novamente.');

      const payload = {
        clinicaId,
        nome: form.nome.trim(),
        dataNascimento: form.dataNascimento,
        genero: form.genero.trim(),
        raca: form.raca.trim(),
        cpf: form.cpf.trim(),
        crm: form.crm.trim(),
        especialidade: form.especialidade,
        telefone: form.telefone,
        email: form.email.trim().toLowerCase(),
        disponibilidade: disponibilidadeOriginal,
      };

      if (isEditMode && medicoId) {
        await updateDoc(doc(db, 'medicos', medicoId), payload);
        setOriginal(form);
        setEditing(false);
        Alert.alert('Sucesso', 'Cadastro do médico atualizado com sucesso!');
      } else {
        const newRef = doc(collection(db, 'medicos'));
        await setDoc(newRef, payload);
        Alert.alert('Sucesso', 'Médico cadastrado com sucesso!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error: any) {
      Alert.alert('Erro ao salvar', error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loadingData) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#006A66" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerLinha}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#00353F" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditMode ? 'Perfil do Médico' : 'Cadastrar Médico'}
          </Text>
          <View style={styles.backBtn} />
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* INFORMAÇÕES PESSOAIS */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Informações Pessoais</Text>

          <Field
            label="Nome completo"
            placeholder="Dr. João da Silva"
            value={form.nome}
            onChangeText={(t) => setField('nome', t)}
            onBlur={() => markTouched('nome')}
            error={err('nome')}
            editable={editing}
          />

          <Field
            label="Data de Nascimento"
            placeholder="DD/MM/AAAA"
            value={form.dataNascimento}
            onChangeText={(t) => setField('dataNascimento', maskDate(t))}
            onBlur={() => markTouched('dataNascimento')}
            error={err('dataNascimento')}
            editable={editing}
            keyboardType="numeric"
            maxLength={10}
          />

          <Field
            label="Gênero"
            placeholder="Ex: Masculino / Feminino"
            value={form.genero}
            onChangeText={(t) => setField('genero', t)}
            onBlur={() => markTouched('genero')}
            error={err('genero')}
            editable={editing}
          />

          <Field
            label="Raça"
            placeholder="Ex: Branco / Pardo"
            value={form.raca}
            onChangeText={(t) => setField('raca', t)}
            onBlur={() => markTouched('raca')}
            error={err('raca')}
            editable={editing}
          />

          <Field
            label="CPF"
            placeholder="000.000.000-00"
            value={form.cpf}
            onChangeText={(t) => setField('cpf', maskCPF(t))}
            onBlur={() => markTouched('cpf')}
            error={err('cpf')}
            editable={editing}
            keyboardType="numeric"
            maxLength={14}
          />

          <Field
            label="CRM"
            placeholder="CRM-SP 123456"
            value={form.crm}
            onChangeText={(t) => setField('crm', t)}
            onBlur={() => markTouched('crm')}
            error={err('crm')}
            editable={editing}
          />
        </View>

        {/* CONTATO E ESPECIALIDADE */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contato e Especialidade</Text>

          <Text style={styles.label}>Especialidade</Text>
          <TouchableOpacity
            style={[styles.inputContainer, err('especialidade') ? styles.inputError : null]}
            onPress={() => editing && setPickerVisible(true)}
            disabled={!editing}
          >
            <Text style={[styles.inputText, !form.especialidade && { color: '#6B7280' }]}>
              {form.especialidade || 'Selecione uma especialidade'}
            </Text>
            <Feather name="chevron-down" size={20} color="#70787B" />
          </TouchableOpacity>
          {!!err('especialidade') && <Text style={styles.errorText}>{err('especialidade')}</Text>}

          <Field
            label="Telefone/Contato"
            placeholder="(11) 90000-0000"
            value={form.telefone}
            onChangeText={(t) => setField('telefone', maskPhone(t))}
            onBlur={() => markTouched('telefone')}
            error={err('telefone')}
            editable={editing}
            keyboardType="phone-pad"
            maxLength={15}
          />

          <Field
            label="Email"
            placeholder="exemplo@email.com"
            value={form.email}
            onChangeText={(t) => setField('email', t)}
            onBlur={() => markTouched('email')}
            error={err('email')}
            editable={editing}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      </ScrollView>

      {/* RODAPÉ */}
      <View style={styles.footer}>
        {isEditMode && !editing ? (
          <TouchableOpacity style={styles.primaryButton} onPress={() => setEditing(true)}>
            <Text style={styles.primaryButtonText}>EDITAR CADASTRO</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {isEditMode && (
              <TouchableOpacity style={styles.cancelButton} onPress={cancelEditing}>
                <Text style={styles.cancelButtonText}>CANCELAR</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.primaryButton, { flex: 1 }, saving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>SALVAR</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* MODAL ESPECIALIDADE */}
      <Modal visible={pickerVisible} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPickerVisible(false)}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Selecione a Especialidade</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {ESPECIALIDADES.map((esp) => (
                <TouchableOpacity
                  key={esp}
                  style={styles.modalItem}
                  onPress={() => {
                    setField('especialidade', esp);
                    setPickerVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{esp}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChangeText,
  onBlur,
  error,
  editable = true,
  keyboardType = 'default',
  maxLength,
  autoCapitalize,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  onBlur: () => void;
  error?: string;
  editable?: boolean;
  keyboardType?: any;
  maxLength?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputContainer, error ? styles.inputError : null]}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#6B7280"
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          editable={editable}
          keyboardType={keyboardType}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize}
        />
      </View>
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FF' },
  center: { justifyContent: 'center', alignItems: 'center' },

  // cabeçalho (igual ao das listagens)
  header: {
    backgroundColor: '#F8F9FF',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    zIndex: 1,
  },
  headerLinha: {
    height: 76,
    paddingTop: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { width: 44, height: 44, alignItems: 'flex-start', justifyContent: 'center' },
  headerTitle: { fontFamily: FONT.semibold, fontSize: 24, lineHeight: 32, color: '#00353F' },

  scroll: { paddingHorizontal: 20, paddingTop: 17, paddingBottom: 28 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFC8CB',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardTitle: {
    fontFamily: FONT.semibold,
    fontSize: 20,
    lineHeight: 28,
    color: '#0B1C30',
    marginBottom: 12,
  },

  fieldContainer: { marginBottom: 12 },
  label: {
    fontFamily: FONT.semibold,
    fontSize: 14,
    lineHeight: 20,
    color: '#0B1C30',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#BFC8CB',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 50,
    backgroundColor: '#FFFFFF',
  },
  input: { flex: 1, fontFamily: FONT.regular, fontSize: 16, color: '#0B1C30' },
  inputText: { fontFamily: FONT.regular, fontSize: 16, color: '#0B1C30' },
  inputError: { borderColor: '#BA1A1A' },
  errorText: { fontFamily: FONT.regular, fontSize: 12, lineHeight: 16, color: '#BA1A1A', marginTop: 4 },

  // rodapé e botões (48 de altura, raio 8)
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#DEE3E4',
  },
  primaryButton: {
    backgroundColor: '#006A66',
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { fontFamily: FONT.semibold, fontSize: 14, color: '#FFFFFF' },
  cancelButton: {
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#70787B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: { fontFamily: FONT.semibold, fontSize: 14, color: '#00353F' },

  // modal de especialidade
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 24, 26, 0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderWidth: 1,
    borderColor: '#BFC8CB',
    padding: 24,
  },
  modalTitle: {
    fontFamily: FONT.semibold,
    fontSize: 20,
    lineHeight: 28,
    color: '#0B1C30',
    marginBottom: 12,
  },
  modalItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#DEE3E4' },
  modalItemText: { fontFamily: FONT.regular, fontSize: 16, color: '#0B1C30' },
});