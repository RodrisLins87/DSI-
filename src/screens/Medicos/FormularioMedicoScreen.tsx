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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#00353F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditMode ? 'Perfil do Médico' : 'Cadastrar Médico'}
        </Text>
        <View style={{ width: 24 }} />
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
            <Text style={[styles.inputText, !form.especialidade && { color: '#8A9599' }]}>
              {form.especialidade || 'Selecione uma especialidade'}
            </Text>
            <Feather name="chevron-down" size={18} color="#1A2E35" />
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
          <View style={{ flexDirection: 'row', gap: 10 }}>
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
          placeholderTextColor="#8A9599"
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E3E8F0',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#00353F' },
  scroll: { padding: 20, paddingBottom: 30 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFC8CB',
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#00353F', marginBottom: 14 },
  fieldContainer: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#1A2E35', marginBottom: 6 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#BFC8CB',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    backgroundColor: '#FFFFFF',
  },
  input: { flex: 1, fontSize: 15, color: '#1A2E35' },
  inputText: { fontSize: 15, color: '#1A2E35' },
  inputError: { borderColor: '#BA1A1A' },
  errorText: { color: '#BA1A1A', fontSize: 12, marginTop: 4 },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E3E8F0',
  },
  primaryButton: {
    backgroundColor: '#004D5B',
    height: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14, letterSpacing: 0.5 },
  cancelButton: {
    height: 50,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFC8CB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: { color: '#5B6B70', fontWeight: '700', fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#00353F', marginBottom: 14 },
  modalItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F4F8' },
  modalItemText: { fontSize: 15, color: '#1A2E35' },
});