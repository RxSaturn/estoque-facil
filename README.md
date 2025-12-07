# 📦 Estoque Fácil - Sistema de Gerenciamento de Inventário

![Estoque Fácil Logo](https://via.placeholder.com/150x50?text=Estoque+Facil)

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.2-blue?logo=react)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.x-brightgreen?logo=mongodb)](https://www.mongodb.com/)
[![Express](https://img.shields.io/badge/Express-4.x-lightgrey?logo=express)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Active-success)](https://github.com/RxSaturn/estoque-facil)

## 📋 Visão Geral

**Estoque Fácil** é um sistema completo e profissional para gerenciamento de estoque e inventário, desenvolvido para pequenas e médias empresas brasileiras. A plataforma oferece controle de produtos, movimentações, vendas e relatórios em uma interface moderna e responsiva.

### 🚀 Links Rápidos

- 📘 **[Guia de Instalação e Uso Completo](GUIA_INSTALACAO_USO.md)** - Manual passo a passo para usuários
- 📄 **[Documentação Técnica (TCC)](documentation/TCC_DOCUMENTACAO_TECNICA.md)** - Documentação completa para banca examinadora
- 🐛 **[Reportar Bug](https://github.com/RxSaturn/estoque-facil/issues)** - Abra uma issue no GitHub

### ✨ Principais Funcionalidades

- ✅ **Gestão Completa de Produtos**: Cadastro com imagens, tipos, categorias e subcategorias
- 📊 **Controle de Estoque Multi-Local**: Gerencie estoque em diversos locais (depósitos, lojas, filiais)
- 💰 **Registro de Vendas**: Sistema rápido e intuitivo para registrar vendas com atualização automática de estoque
- 🔄 **Movimentações de Estoque**: Entradas, saídas e transferências entre locais com histórico completo
- 📈 **Dashboard Inteligente**: Visão geral em tempo real com gráficos e alertas de estoque baixo
- 📄 **Relatórios Profissionais**: Geração de relatórios detalhados com exportação para PDF
- 👥 **Gerenciamento de Usuários**: Controle de acesso com perfis diferenciados (Admin/Funcionário)
- 🔒 **Segurança Robusta**: Autenticação JWT, criptografia de senhas, rate limiting e proteção contra ataques
- 📱 **Interface Responsiva**: Funciona perfeitamente em desktops, tablets e smartphones
- 🎨 **UX Moderna**: Design intuitivo com feedback visual (toasts, loaders) para melhor experiência

## 🔧 Tecnologias

### Stack MERN
Este projeto utiliza a stack **MERN** (MongoDB, Express.js, React, Node.js), escolhida por sua robustez, escalabilidade e eficiência no desenvolvimento full-stack JavaScript.

### Backend
- **Node.js** v18+ com **Express.js** para API RESTful
- **MongoDB** v7+ para armazenamento de dados NoSQL
- **Mongoose** para ODM (Object Document Mapping) e validações
- **JWT** (JSON Web Tokens) para autenticação stateless
- **Bcrypt** para criptografia segura de senhas (12 rounds)
- **Helmet** para proteção de headers HTTP
- **Express Rate Limit** para proteção contra DDoS e brute-force
- **Zod** para validação de schemas TypeScript-first
- **Multer** para upload de arquivos (imagens de produtos)
- **PDFKit** para geração de relatórios em PDF
- **Nodemailer** para envio de emails (recuperação de senha)

### Frontend
- **React** v18.2 para construção da interface SPA
- **React Router** v6 para navegação e rotas protegidas
- **React Query** (@tanstack/react-query) para cache inteligente e gerenciamento de estado do servidor
- **Axios** para requisições HTTP com interceptors
- **Chart.js** + **react-chartjs-2** para gráficos interativos
- **React Toastify** para notificações elegantes
- **React Icons** para biblioteca de ícones
- **CSS Personalizado** para estilos responsivos

## 🗂️ Estrutura do Projeto
```
estoque-facil/
├── backend/                 # Código do servidor API
│   ├── controllers/         # Controladores de rota da API
│   ├── middlewares/         # Middlewares (auth, validação)
│   ├── models/              # Modelos de dados MongoDB
│   ├── routes/              # Definições de rotas da API
│   ├── uploads/             # Diretório para arquivos enviados
│   ├── server.js            # Ponto de entrada do backend
│   └── .env                 # Variáveis de ambiente
│
└── frontend/                # Aplicação React
    ├── public/              # Arquivos estáticos
    └── src/
        ├── components/      # Componentes reutilizáveis
        ├── contexts/        # Contextos React (Auth, etc)
        ├── pages/           # Páginas/Rotas
        ├── services/        # Serviços (API, etc)
        └── App.js           # Componente principal
```

## 📦 Modelagem de Dados

### Coleções MongoDB

O sistema utiliza 6 coleções principais no MongoDB:

#### 👤 usuarios
```javascript
{
  _id: ObjectId,
  nome: String,           // Nome completo
  email: String,          // Email único (índice)
  senha: String,          // Hash bcrypt (12 rounds)
  perfil: String,         // "admin" | "funcionario"
  dataCriacao: Date,
  ativo: Boolean
}
```

#### 📦 produtos
```javascript
{
  _id: ObjectId,
  id: String,             // Código único (ex: "ABCD01")
  nome: String,
  tipo: String,
  categoria: String,
  subcategoria: String,
  imagemUrl: String,
  criadoPor: ObjectId,    // Ref: usuarios
  dataCriacao: Date
}
```

#### 📊 estoques
```javascript
{
  _id: ObjectId,
  produto: ObjectId,      // Ref: produtos
  local: ObjectId,        // Ref: locais
  quantidade: Number,
  dataRegistro: Date,
  ultimaAtualizacao: Date,
  atualizadoPor: ObjectId // Ref: usuarios
}
```

#### 🔄 movimentacoes
```javascript
{
  _id: ObjectId,
  tipo: String,           // "entrada" | "saida" | "transferencia"
  produto: ObjectId,
  quantidade: Number,
  localOrigem: ObjectId,
  localDestino: ObjectId, // Opcional (apenas transferências)
  data: Date,
  realizadoPor: ObjectId,
  observacao: String
}
```

#### 💰 vendas
```javascript
{
  _id: ObjectId,
  produto: ObjectId,
  quantidade: Number,
  local: ObjectId,
  dataVenda: Date,
  registradoPor: ObjectId
}
```

#### 📍 locais
```javascript
{
  _id: ObjectId,
  nome: String,           // Nome único
  descricao: String,
  ativo: Boolean
}
```

### Relacionamentos

- **usuarios** ← cria → **produtos**
- **produtos** ← possui → **estoques** (em múltiplos **locais**)
- **produtos** ← geram → **movimentacoes** e **vendas**
- **usuarios** ← realizam → **movimentacoes** e **vendas**

Para diagrama ER completo e detalhes de índices, consulte a **[Documentação Técnica - Seção 5](documentation/TCC_DOCUMENTACAO_TECNICA.md#5-modelagem-de-dados)**.

## 🚀 Instalação e Configuração

### ⚡ Início Rápido

Para instruções detalhadas passo a passo, consulte o **[Guia Completo de Instalação e Uso](GUIA_INSTALACAO_USO.md)**.

### Requisitos Prévios
- Node.js v14+ (recomendado: v18+)
- MongoDB v4+ (local ou MongoDB Atlas)
- NPM ou Yarn
- Git

### Instalação Resumida

#### 1. Clone o repositório
```bash
git clone https://github.com/RxSaturn/estoque-facil.git
cd estoque-facil
```

#### 2. Configure e inicie o Backend

```bash
cd backend
npm install

# Configure o .env (veja exemplo abaixo)
cp .env.example .env

# Inicie o servidor
npm run dev
```

**Exemplo de `.env`:**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/estoque-facil
JWT_SECRET=seu_secret_super_seguro_minimo_32_caracteres
FRONTEND_URL=http://localhost:3000
```

#### 3. Configure e inicie o Frontend

```bash
cd ../frontend
npm install

# Inicie a aplicação React
npm start
```

O sistema estará disponível em `http://localhost:3000`

### 🔐 Primeiro Acesso

1. Registre um novo usuário na tela de login
2. Promova o primeiro usuário a administrador via MongoDB:

```javascript
// MongoDB Atlas: use o console web
// MongoDB Local: use mongosh
use estoque-facil
db.usuarios.updateOne(
  { email: "seu_email@exemplo.com" }, 
  { $set: { perfil: "admin" } }
)
```

3. Faça login com suas credenciais

Para mais detalhes, consulte a seção **[Primeiro Acesso](GUIA_INSTALACAO_USO.md#3-primeiro-acesso)** no guia completo.

## 🚢 API Endpoints

### Resumo dos Endpoints

A API RESTful do Estoque Fácil está organizada em módulos funcionais:

| Módulo | Endpoint Base | Descrição |
|--------|---------------|-----------|
| **Autenticação** | `/api/auth` | Login, registro e verificação de tokens |
| **Produtos** | `/api/produtos` | CRUD completo de produtos |
| **Estoque** | `/api/estoque` | Verificação e transferências |
| **Vendas** | `/api/vendas` | Registro e histórico de vendas |
| **Movimentações** | `/api/movimentacoes` | Entradas, saídas e transferências |
| **Relatórios** | `/api/relatorios` | Geração de relatórios e PDFs |
| **Usuários** | `/api/usuarios` | Gerenciamento de usuários (Admin) |

### Exemplos de Requisições

#### Autenticação
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@estoque.com",
  "senha": "senha123"
}

# Response
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "_id": "65abc123...",
    "nome": "Administrador",
    "email": "admin@estoque.com",
    "perfil": "admin"
  }
}
```

#### Criar Produto
```http
POST /api/produtos
Authorization: Bearer {token}
Content-Type: application/json

{
  "nome": "Notebook Dell",
  "tipo": "Eletrônico",
  "categoria": "Informática",
  "subcategoria": "Notebooks",
  "estoqueInicial": {
    "local": "65abc456...",
    "quantidade": 50
  }
}
```

#### Registrar Venda
```http
POST /api/vendas
Authorization: Bearer {token}
Content-Type: application/json

{
  "produto": "65abc789...",
  "local": "65abc456...",
  "quantidade": 2
}
```

Para documentação completa da API, consulte a **[Documentação Técnica - Seção 6](documentation/TCC_DOCUMENTACAO_TECNICA.md#6-endpoints-da-api)**.

## 📝 Guia de Uso

### Fluxo Básico de Operação

#### 1️⃣ Cadastro de Produtos
- Acesse **Produtos** → **Adicionar Produto**
- Preencha nome, tipo, categoria e subcategoria
- Adicione uma imagem (opcional)
- Defina estoque inicial e local

#### 2️⃣ Gestão de Estoque
- **Transferências**: Mova produtos entre locais
- **Entradas**: Registre compras ou devoluções
- **Saídas**: Registre perdas, doações ou outros tipos de saída

#### 3️⃣ Registro de Vendas
- Acesse **Vendas** → **Registrar Venda**
- Selecione produto, local e quantidade
- O sistema automaticamente:
  - ✅ Reduz o estoque
  - ✅ Registra a venda no histórico
  - ✅ Cria uma movimentação de saída
  - ✅ Atualiza o dashboard

#### 4️⃣ Geração de Relatórios
- Acesse **Relatórios**
- Defina período e filtros (categoria, local)
- Visualize gráficos interativos
- Exporte para PDF

Para guia detalhado com capturas de tela e resolução de problemas, consulte o **[Guia Completo de Uso](GUIA_INSTALACAO_USO.md#4-guia-de-uso-do-sistema)**.

## 🏗️ Arquitetura e Padrões de Projeto

### Arquitetura do Sistema

O Estoque Fácil utiliza arquitetura **Cliente-Servidor** com comunicação via API RESTful:

```
Frontend (React SPA) → API REST (Express.js) → Banco de Dados (MongoDB)
```

### Padrões Implementados

- **MVC (Model-View-Controller)**: Separação clara entre models, controllers e routes
- **Repository/Service Pattern**: Lógica de negócio encapsulada em services
- **Middleware Pipeline**: Autenticação, validação e tratamento de erros
- **Context API + Hooks**: Gerenciamento de estado global no frontend
- **React Query**: Cache inteligente e sincronização automática com o servidor

### Segurança

- 🔐 **Autenticação JWT**: Tokens stateless com expiração de 7 dias
- 🔒 **Criptografia Bcrypt**: Hash de senhas com 12 rounds
- 🛡️ **Helmet.js**: Proteção de headers HTTP (XSS, CSRF, Clickjacking)
- ⏱️ **Rate Limiting**: Proteção contra DDoS e brute-force
- ✅ **Validação Zod**: Validação rigorosa de entrada de dados
- 🌐 **CORS**: Controle de acesso cross-origin

Para detalhes completos sobre arquitetura, tecnologias e implementação, consulte a **[Documentação Técnica](documentation/TCC_DOCUMENTACAO_TECNICA.md)**.

## 🛠️ Solução de Problemas

### Problemas Comuns

#### ❌ Erro de Conexão com MongoDB
**Solução**: 
- Verifique se o MongoDB está em execução
- Confirme a string de conexão no arquivo `.env`
- Se usar MongoDB Atlas, verifique se o IP está na whitelist

#### ❌ Porta 5000 já está em uso
**Solução**: 
- Altere a porta no arquivo `.env`: `PORT=5001`
- Ou finalize o processo que está usando a porta

#### ❌ Frontend não carrega (tela branca)
**Solução**:
- Limpe o cache do navegador (Ctrl+Shift+Delete)
- Verifique se o backend está rodando
- Abra o console do navegador (F12) e verifique erros

#### ❌ Token inválido / Sessão expirada
**Solução**:
- Faça logout e login novamente
- Verifique se JWT_SECRET no `.env` tem pelo menos 32 caracteres

Para soluções detalhadas e mais problemas, consulte a **[Seção de Resolução de Problemas](GUIA_INSTALACAO_USO.md#5-resolução-de-problemas)** no guia completo.

## 🔍 Estrutura de Componentes

### Frontend (React)

```
src/
├── pages/              # Páginas principais da aplicação
│   ├── Login.js        # Autenticação
│   ├── Dashboard.js    # Visão geral e gráficos
│   ├── Produtos.js     # Lista e gerenciamento
│   ├── Movimentacao.js # Controle de movimentações
│   ├── Vendas.js       # Registro e histórico
│   ├── Relatorios.js   # Geração de relatórios
│   └── Usuarios.js     # Gerenciamento (Admin)
├── components/         # Componentes reutilizáveis
│   ├── Layout.js       # Template principal
│   ├── Sidebar.js      # Menu de navegação
│   └── RotaPrivada.js  # Proteção de rotas
├── contexts/           # Estado global (Context API)
│   └── AuthContext.js  # Autenticação do usuário
├── services/           # Comunicação com API
│   └── api.js          # Cliente Axios configurado
└── hooks/              # Custom hooks
    └── useAuth.js      # Hook de autenticação
```

### Backend (Node.js + Express)

```
backend/
├── models/             # Esquemas Mongoose
├── controllers/        # Lógica de negócio
├── routes/             # Definições de rotas
├── middlewares/        # Auth, validação, rate limit
│   ├── auth.js         # Verificação JWT
│   ├── validateResource.js  # Validação Zod
│   └── rateLimit.js    # Proteção DDoS
├── services/           # Serviços especializados
├── validators/         # Schemas Zod
└── server.js           # Ponto de entrada
```

## 📊 Relatórios e Análises

O sistema oferece relatórios completos com visualizações gráficas interativas:

### 📈 Tipos de Relatórios

1. **Visão Geral**
   - Total de vendas por período
   - Vendas por categoria (gráfico pizza)
   - Distribuição de estoque por local (gráfico barras)
   - Estatísticas consolidadas

2. **Top Produtos**
   - Ranking dos produtos mais vendidos
   - Percentual de participação nas vendas
   - Análise de desempenho

3. **Produtos Sem Movimentação**
   - Lista de produtos parados há mais de 30 dias
   - Distribuição por local e categoria
   - Identificação de estoque obsoleto

### 📄 Exportação

- **PDF Profissional**: Gera relatórios formatados com gráficos incorporados
- **Filtros Avançados**: Por período, categoria, local e tipo de produto
- **Visualização Interativa**: Gráficos Chart.js com tooltips e zoom

## 🔮 Melhorias Futuras (Roadmap)

### Versão 1.1 (Em Desenvolvimento)
- [ ] Remover implementações temporárias e dados simulados do backend
- [ ] Adicionar opção de atualizar estoque em movimentações
- [ ] Corrigir histórico de vendas e registrar vendas em movimentações
- [ ] Adicionar visualização do histórico de movimentações
- [ ] Melhorias na página de relatórios

### Versão 2.0 (Planejado)
- [ ] Dashboard expandido com mais métricas e KPIs
- [ ] Redesign da página de gerenciamento de usuários
- [ ] Sistema de notificações push em tempo real
- [ ] Auditoria completa com log de todas as ações
- [ ] Suporte a múltiplos idiomas (i18n)

### Versão 3.0 (Futuro)
- [ ] Aplicativo móvel nativo (React Native)
- [ ] Integração com sistemas ERP externos
- [ ] Leitura de código de barras
- [ ] Integração com nota fiscal eletrônica (NF-e)
- [ ] Autenticação OAuth2 (Google, Microsoft)
- [ ] Sistema de backup automático
      
## 👥 Contribuindo

Contribuições são muito bem-vindas! Este é um projeto de código aberto e adoraríamos contar com sua ajuda para melhorá-lo.

### Como Contribuir

1. **Fork** o repositório
2. **Clone** seu fork: `git clone https://github.com/seu-usuario/estoque-facil.git`
3. **Crie uma branch** para sua feature: `git checkout -b feature/nova-funcionalidade`
4. **Faça suas alterações** seguindo os padrões do projeto
5. **Commit** suas mudanças: `git commit -m 'feat: Adiciona nova funcionalidade'`
6. **Push** para a branch: `git push origin feature/nova-funcionalidade`
7. **Abra um Pull Request** descrevendo suas alterações

### Padrões de Commit

Seguimos o padrão [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Alterações em documentação
- `style:` Formatação, ponto e vírgula, etc
- `refactor:` Refatoração de código
- `test:` Adição ou correção de testes
- `chore:` Tarefas de build, configs, etc

### Reportar Bugs

Encontrou um bug? Abra uma [issue](https://github.com/RxSaturn/estoque-facil/issues) com:
- Descrição detalhada do problema
- Passos para reproduzir
- Comportamento esperado vs. atual
- Screenshots (se aplicável)
- Informações do ambiente (SO, Node.js, MongoDB)

## 📚 Documentação Adicional

- 📘 **[Guia Completo de Instalação e Uso](GUIA_INSTALACAO_USO.md)** - Manual detalhado para usuários finais
- 📄 **[Documentação Técnica (TCC)](documentation/TCC_DOCUMENTACAO_TECNICA.md)** - Documentação completa para desenvolvedores e banca examinadora
- 🐛 **[Issues](https://github.com/RxSaturn/estoque-facil/issues)** - Reporte bugs ou sugira melhorias

## 📄 Licença

Este projeto está licenciado sob a licença **MIT** - consulte o arquivo [LICENSE](LICENSE) para obter detalhes.

A licença MIT permite:
- ✅ Uso comercial
- ✅ Modificação
- ✅ Distribuição
- ✅ Uso privado

## 🙏 Agradecimentos

Este projeto foi desenvolvido como Trabalho de Conclusão de Curso (TCC), demonstrando a aplicação prática de tecnologias modernas de desenvolvimento web full-stack.

**Tecnologias principais**: MongoDB, Express.js, React, Node.js (MERN Stack)

---

## 📞 Suporte e Contato

- 🐛 **Reportar Bug**: [Abrir Issue](https://github.com/RxSaturn/estoque-facil/issues/new)
- 💡 **Sugerir Funcionalidade**: [Abrir Issue](https://github.com/RxSaturn/estoque-facil/issues/new)
- 📧 **Contato**: Através do GitHub

---

<div align="center">

**⭐ Se este projeto foi útil para você, considere dar uma estrela no GitHub!**

Desenvolvido com ❤️ usando a Stack MERN

</div>
