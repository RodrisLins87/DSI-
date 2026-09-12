🩺 VittaFlow — Sistema de Gestão de Consultas e Mitigação de Absenteísmo

[![React Native](https://img.shields.io/badge/React%20Native-0.74+-61DAFB?style=flat&logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-51.0+-000000?style=flat&logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%26%20Firestore-FFCA28?style=flat&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📌 1. Visão Geral do Projeto

O **VittaFlow** é uma aplicação mobile voltada à gestão de consultas, exames e filas de atendimento em clínicas e unidades de saúde. Seu foco principal é modernizar processos organizacionais obsoletos e mitigar o **absenteísmo em consultas agendadas** (*no-show*) por meio da centralização de dados, acompanhamento em tempo real e, futuramente, análise preditiva por Aprendizado de Máquina.

---

## 🎯 2. Problema vs. Solução

### 🚩 O Problema
- **Taxa Global de Absenteísmo:** Estudos indicam que a taxa média global de não comparecimento a consultas é de cerca de **23%**, atingindo **27,8% na América do Sul** e podendo passar de **38%** em redes metropolitanas públicas brasileiras.
- **Impactos:**
  - Desperdício financeiro e subutilização de profissionais de saúde.
  - Aumento expressivo do tempo de espera e filas represadas para outros pacientes.
  - Estimativa da OMS de que **20% a 40% dos recursos em saúde são desperdiçados** por ineficiência de gestão.
- **Incapacidade dos Métodos Tradicionais:** Lembradores manuais (SMS, ligações, WhatsApp) atuam de forma homogênea e reativa, sem identificar antecipadamente o risco individual de falta do paciente ou tratar gargalos organizacionais (dimensão de *Acomodação* no Acesso à Saúde).

### 💡 A Solução (VittaFlow)
O **VittaFlow** atua diretamente na dimensão organizacional (*Acomodação*):
- **Centralização Administrativa:** Operado pela clínica/administrador para unificar cadastros de pacientes, dependentes, médicos e agendas.
- **Transparência e Controle:** Acompanhamento de filas de atendimento em tempo real e facilidade para agendamentos e reagendamentos.
- **Inteligência Preditiva (Em desenvolvimento):** Integração com modelos de Machine Learning (K-Means para clusterização de perfis e Random Forest / Regressão Logística para classificação do risco de falta).

---

## 👥 3. Stakeholders & Personas

| Stakeholder | Tipo | Descrição |
| :--- | :--- | :--- |
| **Administrador / Clínica** | **Usuário Direto (Login)** | Operador do aplicativo. Gerencia cadastros, consultas, médicos e filas de espera. |
| **Paciente / Dependente** | Stakeholder Indireto | Beneficiário final. Teve seus dados cadastrados pelo administrador; depende do fluxo organizado para não perder atendimentos. |
| **Profissional de Saúde** | Stakeholder Indireto | Médico/Especialista cadastrado no sistema com agenda, especialidade e disponibilidade vinculadas. |

---

## 📱 4. Módulos & Telas do Sistema

### 🟢 Telas Desenvolvidas e Funcionais (Fase Atual)

| Tela | Caminho no Código | Descrição & Funcionalidades |
| :--- | :--- | :--- |
| **Cadastro** | `src/screens/Auth/CadastroScreen.tsx` | Registro inicial da instituição/clínica com validação de dados sensíveis e credenciais. |
| **Login** | `src/screens/Auth/LoginScreen.tsx` | Autenticação segura via Firebase Auth para administradores da clínica. |
| **Recuperar Senha** | `src/screens/Auth/RecuperarSenhaScreen.tsx` | Envio de e-mail de redefinição de senha com verificação de segurança. |
| **Home (Painel Inicial)** | `src/screens/Home/HomeScreen.tsx` | Hub central de navegação com contadores em tempo real do Firestore (Pacientes, Dependentes, Médicos, Laudos e Consultas). |

### 🔄 Módulos Planejados (Em Desenvolvimento / Sitemap)
- 📋 **Pacientes & Dependentes:** Gestão completa (CRUD), histórico de atendimentos e vínculo de dependentes menores de idade.
- 👨‍⚕️ **Médicos:** Cadastro de profissionais, especialidades e controle de disponibilidade de agenda.
- 📅 **Consultas do Dia:** Listagem interativa de consultas do dia com filtros por status e médico.
- ⏳ **Fila de Atendimento:** Acompanhamento em tempo real (*Aguardando*, *Em Atendimento*, *Finalizado*) e inserção de encaixes.
- 📑 **Laudos e Exames:** Registro e anexação de laudos médicos.

---

## 🛠️ 5. Tecnologias Utilizadas

- **Mobile:** [React Native](https://reactnative.dev/) com [Expo](https://expo.dev/) (SDK 51+)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
- **Estilização & Ícones:** `StyleSheet`, `@expo/vector-icons` (Ionicons, Feather, MaterialCommunityIcons)
- **Fontes:** Google Fonts (`Manrope_400Regular` via `@expo-google-fonts/manrope`)
- **Backend / BaaS:** [Firebase](https://firebase.google.com/) (Authentication & Firestore)
- **Navegação:** React Navigation (Stack Navigation)

---

## 📖 6. Guia de Execução & Solução de Problemas

Para instruções detalhadas de como instalar o ambiente, clonar e rodar a aplicação, bem como o guia completo de **Solução de Problemas (Troubleshooting)** com os erros mais comuns na instalação e execução do projeto, consulte o manual em PDF disponível no repositório:

📄 **[Manual do Desenvolvedor: Guia de Execução (VittaFlow-Guia-de-Execucao.pdf)](./VittaFlow-Guia-de-Execucao.pdf)**

---

## 🚫 7. Escopo Negativo (O que o VittaFlow NÃO faz)
- **Acesso direto para pacientes/médicos:** Apenas administradores cadastrados possuem login na plataforma.
- **Rede Multi-clínica / Marketplace:** Cada clínica opera sua própria instância independente.
- **Processamento de Pagamentos:** O sistema não cobra nem processa pagamentos dentro do app.
- **Telemedicina:** O escopo engloba exclusivamente consultas e exames presenciais.

---

## 👥 8. Equipe do Projeto

Projetado e desenvolvido por alunos da **Universidade Federal Rural de Pernambuco (UFRPE)**[cite: 1, 2]:

* **Bruno Rodrigo Silva Lins** — [Github](https://github.com/RodrisLins87)
* **Guilherme Abraão Teixeira Bezerra** — [Github](https://github.com/teixeiraguilherme)
* **Laura Alcântara de Miranda** — [Github](https://github.com/laura-amiranda)
* **Maria Eduarda Alves de Oliveira** — [Github](https://github.com/MariaEduardaAlves835)
* **Matheus Julio da Silva** — [Github](https://github.com/MatheusJS12)
* **Thyago Murilo dos Santos** — [Github](https://github.com/ThyagomMurilo09)

---
*Projeto desenvolvido para as disciplinas de Engenharia de Software, Projetos Interdisciplinares III e Desenvolvimento de Sistema(DSI / ESSI / PISI III) - UFRPE.*
