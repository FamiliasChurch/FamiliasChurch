# 🏛️ Famílias Church Web Platform

Plataforma web oficial da **Famílias Church**, desenvolvida para conectar membros, gerenciar eventos, ministérios e facilitar a administração eclesiástica. O sistema inclui um painel administrativo robusto com controle de acesso baseado em cargos (RBAC).

![Status](https://img.shields.io/badge/Status-Em_Produção-green)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)

## 🚀 Funcionalidades

### 🌐 Área Pública
- **Home Page:** Apresentação da igreja, horários de cultos e localização (Maps).
- **Devocionais:** Blog para estudos bíblicos e palavras do dia.
- **Agenda:** Listagem de eventos futuros com detalhes.
- **Doações:** Página informativa para dízimos e ofertas.
- **Login Social:** Autenticação via Google.

### 🔒 Painel Administrativo (RBAC)
O sistema possui níveis de acesso granulares:
- **Dev/Apóstolo:** Acesso total (God Mode).
- **Secretaria:** Gestão de membros e financeiro (sem permissão de alterar cargos de liderança).
- **Mídia:** Gestão de eventos, ministérios e galeria.
- **Pastor:** Visualização de intercessões e estudos.

### 🛠️ Módulos de Gestão
- **Membresia:** Cadastro, edição e controle de cargos.
- **Financeiro:** Auditoria de dízimos e ofertas com gráficos.
- **Intercessão:** Sistema de pedidos de oração com contador de intercessores.
- **Eventos:** CRUD completo com upload de capas e links de inscrição.
- **Push Notifications:** Sistema de notificações para engajamento via Firebase Cloud Messaging.

## 💻 Tecnologias Utilizadas

- **Front-end:** React.js, TypeScript, Vite.
- **Estilização:** Tailwind CSS.
- **Banco de Dados & Auth:** Firebase (Firestore, Authentication).
- **Armazenamento:** Firebase Storage & Cloudinary (Otimização de Imagens).
- **Deploy:** Vercel.
- **Ícones:** Lucide React.

## ⚙️ Instalação e Configuração

1. **Clone o repositório**
   ```bash
   git clone [https://github.com/FamiliasChurch/FamiliasChurch](https://github.com/FamiliasChurch/FamiliasChurch)
   cd FamiliasChurch