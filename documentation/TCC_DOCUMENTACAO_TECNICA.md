# Documentação Técnica - Sistema Estoque Fácil
## Trabalho de Conclusão de Curso (TCC)

---

## 📑 Índice

1. [Visão Geral e Arquitetura](#1-visão-geral-e-arquitetura)
2. [Tecnologias e Ferramentas](#2-tecnologias-e-ferramentas)
3. [Engenharia de Software](#3-engenharia-de-software)
4. [Segurança e Desempenho](#4-segurança-e-desempenho)
5. [Modelagem de Dados](#5-modelagem-de-dados)
6. [Endpoints da API](#6-endpoints-da-api)
7. [Interface do Usuário](#7-interface-do-usuário)
8. [Fluxos de Dados](#8-fluxos-de-dados)
9. [Considerações de Implementação](#9-considerações-de-implementação)
10. [Conclusão](#10-conclusão)

---

## 1. Visão Geral e Arquitetura

### 1.1 Descrição do Sistema

O **Estoque Fácil** é um sistema de gerenciamento de inventário desenvolvido para atender pequenas e médias empresas brasileiras. O sistema oferece controle completo sobre produtos, estoque, movimentações e vendas, com interface intuitiva e relatórios detalhados.

### 1.2 Arquitetura do Sistema

O sistema adota a arquitetura **Cliente-Servidor** com comunicação via API RESTful:

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Cliente)                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              React Application (SPA)                        │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │ │
│  │  │  Pages   │  │Components│  │Contexts  │  │ Services │   │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │ │
│  │                                                             │ │
│  │  React Query (Cache & Estado)    Axios (HTTP Client)      │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS/REST
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                        BACKEND (Servidor)                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Node.js + Express.js                           │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │ │
│  │  │  Routes  │→│Controllers│→│ Services │→│  Models  │   │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │ │
│  │                                                             │ │
│  │  Middlewares: Auth, Rate Limit, Validation, Error Handler │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │ MongoDB Driver
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    BANCO DE DADOS (MongoDB)                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Collections: usuarios, produtos, estoques,                │ │
│  │               movimentacoes, vendas, locais                │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Fluxo de Dados Principal

**Exemplo: Registro de uma Venda**

1. **Frontend**: Usuário preenche formulário de venda
2. **React Query**: Valida dados localmente
3. **Axios**: Envia requisição POST para `/api/vendas`
4. **Middleware Auth**: Verifica token JWT do usuário
5. **Middleware Validation**: Valida dados com Zod schema
6. **Controller**: Processa lógica de negócio
7. **Service**: Executa operações (criar venda, atualizar estoque)
8. **Model**: Interage com MongoDB
9. **Response**: Retorna resultado para frontend
10. **React Query**: Atualiza cache e UI automaticamente

---

## 2. Tecnologias e Ferramentas

### 2.1 Stack MERN - Justificativa Técnica

#### 2.1.1 MongoDB

**Por que escolhemos MongoDB:**
- **Flexibilidade de Schema**: Permite evolução rápida do modelo de dados
- **Escalabilidade Horizontal**: Preparado para crescimento futuro
- **Documentos JSON**: Alinhamento natural com JavaScript/Node.js
- **Performance**: Consultas rápidas com indexação eficiente
- **Relacionamentos**: Suporte a referências e população (populate)

**Alternativas Consideradas:**
- PostgreSQL: Descartado pela necessidade de schema rígido
- MySQL: Descartado pela complexidade de mapeamento objeto-relacional

#### 2.1.2 Express.js

**Por que escolhemos Express.js:**
- **Minimalista e Flexível**: Permite arquitetura personalizada
- **Middleware Pipeline**: Facilita implementação de segurança e validação
- **Comunidade Robusta**: Grande ecossistema de plugins
- **Performance**: Overhead mínimo em produção
- **Padrão de Mercado**: Facilita manutenção por terceiros

#### 2.1.3 React

**Por que escolhemos React:**
- **Component-Based**: Reutilização e manutenibilidade
- **Virtual DOM**: Performance superior em atualizações de UI
- **Ecossistema Rico**: React Router, React Query, Chart.js
- **Hooks**: Lógica de estado moderna e limpa
- **Comunidade**: Maior biblioteca de recursos e tutoriais

#### 2.1.4 Node.js

**Por que escolhemos Node.js:**
- **JavaScript Full-Stack**: Mesma linguagem no frontend e backend
- **Event-Driven**: Perfeito para operações I/O intensivas
- **NPM**: Maior repositório de pacotes do mundo
- **Performance**: V8 engine otimizada do Google Chrome

### 2.2 Bibliotecas e Frameworks Adicionais

#### Backend

| Biblioteca | Versão | Propósito |
|-----------|--------|-----------|
| **bcrypt** | ^5.1.1 | Hash seguro de senhas (algoritmo Blowfish) |
| **jsonwebtoken** | ^9.0.2 | Autenticação stateless via JWT |
| **mongoose** | ^7.8.6 | ODM para MongoDB com validação |
| **helmet** | ^7.1.0 | Segurança HTTP headers |
| **express-rate-limit** | ^7.1.5 | Proteção contra DDoS e brute-force |
| **cors** | ^2.8.5 | Controle de Cross-Origin Resource Sharing |
| **multer** | ^1.4.5 | Upload de arquivos (imagens de produtos) |
| **pdfkit** | ^0.13.0 | Geração de relatórios em PDF |
| **zod** | ^3.22.4 | Validação de schemas TypeScript-first |
| **nodemailer** | ^6.10.0 | Envio de emails (recuperação de senha) |
| **dotenv** | ^16.4.7 | Gerenciamento de variáveis de ambiente |

#### Frontend

| Biblioteca | Versão | Propósito |
|-----------|--------|-----------|
| **react** | ^18.2.0 | Biblioteca principal para UI |
| **react-router-dom** | ^6.10.0 | Roteamento SPA com rotas protegidas |
| **@tanstack/react-query** | ^4.29.14 | Cache, sincronização e estado do servidor |
| **axios** | ^1.4.0 | Cliente HTTP com interceptors |
| **react-toastify** | ^9.1.3 | Notificações toast elegantes |
| **chart.js** | ^4.3.0 | Gráficos interativos para relatórios |
| **react-chartjs-2** | ^5.2.0 | Wrapper React para Chart.js |
| **react-icons** | ^4.9.0 | Biblioteca de ícones (Feather, Material) |

---

## 3. Engenharia de Software

### 3.1 Padrões de Projeto Utilizados

#### 3.1.1 Model-View-Controller (MVC) - Backend

**Estrutura:**
```
backend/
├── models/          # Model - Esquemas de dados
├── controllers/     # Controller - Lógica de negócio
└── routes/          # View (API) - Endpoints
```

**Exemplo Prático:**

```javascript
// Model (Usuario.js)
const usuarioSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  senha: { type: String, required: true },
  perfil: { type: String, enum: ['admin', 'funcionario'] }
});

// Controller (authController.js)
exports.login = async (req, res) => {
  const { email, senha } = req.body;
  const usuario = await Usuario.findOne({ email });
  // Lógica de validação...
  const token = jwt.sign({ id: usuario._id }, process.env.JWT_SECRET);
  res.json({ token, usuario });
};

// Route (authRoutes.js)
router.post('/login', authController.login);
```

#### 3.1.2 Repository/Service Pattern

**Separação de Responsabilidades:**
- **Controllers**: Recebem requisições HTTP, chamam services
- **Services**: Contêm lógica de negócio complexa
- **Models**: Encapsulam acesso ao banco de dados

**Exemplo:**
```javascript
// Service (vendaService.js)
exports.registrarVenda = async (vendaData, usuarioId) => {
  // 1. Validar estoque disponível
  const estoque = await Estoque.findOne({ 
    produto: vendaData.produto, 
    local: vendaData.local 
  });
  
  if (estoque.quantidade < vendaData.quantidade) {
    throw new Error('Estoque insuficiente');
  }
  
  // 2. Criar venda
  const venda = await Venda.create({
    ...vendaData,
    registradoPor: usuarioId
  });
  
  // 3. Atualizar estoque
  estoque.quantidade -= vendaData.quantidade;
  await estoque.save();
  
  return venda;
};
```

#### 3.1.3 Custom Hooks (React)

**Abstração de Lógica Compartilhada:**

```javascript
// hooks/useAuth.js
export const useAuth = () => {
  const { usuario } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const verificarPermissao = (perfisPermitidos) => {
    if (!perfisPermitidos.includes(usuario?.perfil)) {
      toast.error('Sem permissão');
      navigate('/dashboard');
      return false;
    }
    return true;
  };
  
  return { usuario, verificarPermissao };
};
```

#### 3.1.4 Context API + Provider Pattern

**Gerenciamento de Estado Global:**

```javascript
// contexts/AuthContext.js
export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const verificarAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        const userData = await api.get('/auth/verificar');
        setUsuario(userData);
      }
      setLoading(false);
    };
    verificarAuth();
  }, []);
  
  return (
    <AuthContext.Provider value={{ usuario, setUsuario, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 3.2 Princípios SOLID Aplicados

#### Single Responsibility Principle
Cada módulo tem uma única responsabilidade:
- `authController.js`: Apenas autenticação
- `vendaController.js`: Apenas vendas
- `validateResource.js`: Apenas validação

#### Dependency Inversion
Middlewares são injetados via Express pipeline:
```javascript
router.post('/produtos', 
  auth,                    // Autenticação
  validateResource(produtoSchema), // Validação
  produtoController.criar  // Controller
);
```

---

## 4. Segurança e Desempenho

### 4.1 Segurança

#### 4.1.1 Autenticação JWT (JSON Web Tokens)

**Implementação:**
```javascript
// Geração de Token
const token = jwt.sign(
  { id: usuario._id, perfil: usuario.perfil },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

// Verificação (middleware auth.js)
const token = req.headers.authorization?.split(' ')[1];
const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.usuario = await Usuario.findById(decoded.id);
```

**Vantagens:**
- Stateless: Não requer armazenamento de sessão no servidor
- Escalável: Funciona em arquiteturas distribuídas
- Seguro: Assinatura criptográfica impede adulteração

#### 4.1.2 Criptografia de Senhas (Bcrypt)

```javascript
// Hash (registro)
const senhaHash = await bcrypt.hash(senha, 12); // 12 rounds

// Verificação (login)
const senhaValida = await bcrypt.compare(senhaPlain, senhaHash);
```

**Salt Rounds: 12**
- Equilíbrio entre segurança e performance
- ~250ms de hash time (resistente a brute-force)

#### 4.1.3 Rate Limiting

```javascript
// Proteção contra DDoS e brute-force
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo 100 requisições por IP
  message: 'Muitas requisições, tente novamente mais tarde'
});

// Limite mais rigoroso para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 tentativas de login
  message: 'Muitas tentativas de login'
});
```

#### 4.1.4 Helmet.js (Security Headers)

```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true
  }
}));
```

**Headers Configurados:**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security`

#### 4.1.5 Validação de Entrada (Zod)

```javascript
const produtoSchema = z.object({
  nome: z.string().min(3).max(100),
  tipo: z.string(),
  categoria: z.string(),
  imagemUrl: z.string().url().optional(),
  estoqueInicial: z.object({
    local: z.string(),
    quantidade: z.number().int().min(0)
  })
});
```

**Benefícios:**
- Previne SQL/NoSQL Injection
- Validação de tipos em runtime
- Mensagens de erro customizadas

#### 4.1.6 CORS (Cross-Origin Resource Sharing)

```javascript
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
```

### 4.2 Desempenho

#### 4.2.1 Otimização de Queries MongoDB

**Índices Estratégicos:**
```javascript
usuarioSchema.index({ email: 1 }, { unique: true });
produtoSchema.index({ id: 1 }, { unique: true });
estoqueSchema.index({ produto: 1, local: 1 });
vendaSchema.index({ dataVenda: -1 }); // Relatórios
```

**Population Seletiva:**
```javascript
// Ruim: Popula tudo
const vendas = await Venda.find().populate('produto');

// Bom: Seleciona apenas campos necessários
const vendas = await Venda.find()
  .populate('produto', 'nome imagemUrl')
  .populate('registradoPor', 'nome');
```

#### 4.2.2 React Query - Cache Inteligente

```javascript
const { data: produtos, isLoading } = useQuery({
  queryKey: ['produtos'],
  queryFn: buscarProdutos,
  staleTime: 5 * 60 * 1000, // 5 minutos fresh
  cacheTime: 10 * 60 * 1000, // 10 minutos em cache
  refetchOnWindowFocus: false
});
```

**Vantagens:**
- Reduz requisições desnecessárias ao servidor
- Sincronização automática entre abas
- Prefetching e invalidação inteligente

#### 4.2.3 Code Splitting (React)

```javascript
// Lazy loading de páginas
const Relatorios = lazy(() => import('./pages/Relatorios'));

<Suspense fallback={<Loader />}>
  <Routes>
    <Route path="/relatorios" element={<Relatorios />} />
  </Routes>
</Suspense>
```

#### 4.2.4 Compressão HTTP

```javascript
const compression = require('compression');
app.use(compression()); // Gzip automático
```

---

## 5. Modelagem de Dados

### 5.1 Diagrama Entidade-Relacionamento (ER)

```
┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│   Usuario    │        │   Produto    │        │    Local     │
├──────────────┤        ├──────────────┤        ├──────────────┤
│ _id          │───┐    │ _id          │───┐    │ _id          │
│ nome         │   │    │ id (código)  │   │    │ nome         │
│ email*       │   │    │ nome         │   │    │ descricao    │
│ senha (hash) │   │    │ tipo         │   │    │ ativo        │
│ perfil       │   │    │ categoria    │   │    └──────────────┘
│ dataCriacao  │   │    │ subcategoria │   │
└──────────────┘   │    │ imagemUrl    │   │
                   │    │ criadoPor ───┘   │
                   │    │ dataCriacao  │   │
                   │    └──────────────┘   │
                   │                       │
                   │    ┌──────────────┐   │
                   │    │   Estoque    │   │
                   │    ├──────────────┤   │
                   │    │ _id          │   │
                   └────┤ produto ─────┘   │
                        │ local        │───┘
                        │ quantidade   │
                        │ dataRegistro │
                        └──────────────┘
                               │
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
┌───────▼──────┐      ┌────────▼────────┐    ┌───────▼──────┐
│ Movimentacao │      │      Venda      │    │   (Outros)   │
├──────────────┤      ├─────────────────┤    └──────────────┘
│ _id          │      │ _id             │
│ tipo         │      │ produto ────────┤───┐
│ produto ─────┤───┐  │ quantidade      │   │
│ quantidade   │   │  │ local           │   │
│ localOrigem  │   │  │ dataVenda       │   │
│ localDestino │   │  │ registradoPor ──┤───┼──┐
│ data         │   │  └─────────────────┘   │  │
│ realizadoPor─┤───┼──────────────────────────┘  │
└──────────────┘   │                            │
                   └────────────────────────────┘
* = Índice único
```

### 5.2 Coleções MongoDB - Estrutura Detalhada

#### 5.2.1 usuarios

```javascript
{
  _id: ObjectId("..."),
  nome: "João Silva",
  email: "joao@empresa.com",
  senha: "$2b$12$...", // Hash bcrypt
  perfil: "admin", // enum: ['admin', 'funcionario']
  dataCriacao: ISODate("2024-01-15T10:00:00Z"),
  ativo: true
}
```

**Índices:**
- `{ email: 1 }` (unique)

**Regras de Negócio:**
- Email único por usuário
- Senha mínimo 6 caracteres (hash com 12 rounds)
- Perfil define permissões (admin tem acesso total)

#### 5.2.2 produtos

```javascript
{
  _id: ObjectId("..."),
  id: "GBRC01", // Código gerado automaticamente
  nome: "Notebook Dell Inspiron 15",
  tipo: "Eletrônico",
  categoria: "Informática",
  subcategoria: "Notebooks",
  imagemUrl: "/uploads/produtos/notebook-dell.jpg",
  criadoPor: ObjectId("..."), // Ref: usuarios
  dataCriacao: ISODate("2024-02-10T14:30:00Z")
}
```

**Índices:**
- `{ id: 1 }` (unique)
- `{ categoria: 1, subcategoria: 1 }`

**Geração de ID:**
```javascript
// Algoritmo: 4 letras maiúsculas + 2 dígitos
// Exemplo: ABCD01, XYZW99
const gerarId = () => {
  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let id = '';
  for (let i = 0; i < 4; i++) {
    id += letras[Math.floor(Math.random() * 26)];
  }
  id += String(Math.floor(Math.random() * 100)).padStart(2, '0');
  return id;
};
```

#### 5.2.3 estoques

```javascript
{
  _id: ObjectId("..."),
  produto: ObjectId("..."), // Ref: produtos
  local: ObjectId("..."), // Ref: locais
  quantidade: 150,
  dataRegistro: ISODate("2024-02-10T14:35:00Z"),
  ultimaAtualizacao: ISODate("2024-03-05T09:15:00Z"),
  atualizadoPor: ObjectId("...") // Ref: usuarios
}
```

**Índices:**
- `{ produto: 1, local: 1 }` (compound, unique)

**Regras:**
- Um produto só pode ter um registro de estoque por local
- Quantidade não pode ser negativa
- Toda alteração atualiza `ultimaAtualizacao`

#### 5.2.4 movimentacoes

```javascript
{
  _id: ObjectId("..."),
  tipo: "transferencia", // enum: ['entrada', 'saida', 'transferencia']
  produto: ObjectId("..."),
  quantidade: 20,
  localOrigem: ObjectId("..."),
  localDestino: ObjectId("..."), // null se tipo != 'transferencia'
  data: ISODate("2024-03-05T09:15:00Z"),
  realizadoPor: ObjectId("..."),
  observacao: "Transferência para filial centro"
}
```

**Índices:**
- `{ data: -1 }` (desc, para relatórios)
- `{ produto: 1, data: -1 }`

#### 5.2.5 vendas

```javascript
{
  _id: ObjectId("..."),
  produto: ObjectId("..."),
  quantidade: 5,
  local: ObjectId("..."),
  dataVenda: ISODate("2024-03-10T16:45:00Z"),
  registradoPor: ObjectId("...")
}
```

**Índices:**
- `{ dataVenda: -1 }`
- `{ produto: 1, dataVenda: -1 }`

#### 5.2.6 locais

```javascript
{
  _id: ObjectId("..."),
  nome: "Depósito Central",
  descricao: "Armazém principal - Rua X, 123",
  ativo: true
}
```

**Índices:**
- `{ nome: 1 }` (unique)

---

## 6. Endpoints da API

### 6.1 Autenticação (`/api/auth`)

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| POST | `/auth/login` | Login de usuário | Não |
| POST | `/auth/registro` | Registro de novo usuário | Não |
| GET | `/auth/verificar` | Verificar token atual | Sim |
| POST | `/auth/solicitar-recuperacao` | Solicitar reset de senha | Não |
| POST | `/auth/resetar-senha` | Resetar senha com token | Não |

**Exemplo de Request/Response (Login):**

```json
// POST /api/auth/login
{
  "email": "admin@estoque.com",
  "senha": "senha123"
}

// Response (200 OK)
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

### 6.2 Produtos (`/api/produtos`)

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| GET | `/produtos` | Listar todos produtos | Todos |
| POST | `/produtos` | Criar novo produto | Admin |
| GET | `/produtos/:id` | Obter produto por ID | Todos |
| PUT | `/produtos/:id` | Atualizar produto | Admin |
| DELETE | `/produtos/:id` | Deletar produto | Admin |
| GET | `/produtos/tipos` | Listar tipos | Todos |
| GET | `/produtos/categorias` | Listar categorias | Todos |
| GET | `/produtos/subcategorias` | Listar subcategorias | Todos |

### 6.3 Estoque (`/api/estoque`)

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| GET | `/estoque/verificar` | Verificar estoque por produto/local | Todos |
| POST | `/estoque/transferir` | Transferir entre locais | Todos |
| GET | `/estoque/locais` | Listar locais | Todos |

### 6.4 Vendas (`/api/vendas`)

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| GET | `/vendas` | Listar vendas | Todos |
| POST | `/vendas` | Registrar venda | Todos |
| GET | `/vendas/historico` | Histórico com filtros | Todos |

### 6.5 Movimentações (`/api/movimentacoes`)

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| GET | `/movimentacoes` | Listar movimentações | Todos |
| POST | `/movimentacoes` | Criar movimentação | Todos |
| GET | `/movimentacoes/historico` | Histórico com filtros | Todos |

### 6.6 Relatórios (`/api/relatorios`)

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| GET | `/relatorios/resumo` | Resumo para dashboard | Todos |
| GET | `/relatorios/pdf` | Gerar PDF | Todos |
| GET | `/relatorios/vendas-periodo` | Vendas por período | Admin |

### 6.7 Usuários (`/api/usuarios`)

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| GET | `/usuarios` | Listar usuários | Admin |
| POST | `/usuarios` | Criar usuário | Admin |
| PUT | `/usuarios/:id` | Atualizar usuário | Admin |
| PUT | `/usuarios/:id/senha` | Alterar senha | Admin/Próprio |
| DELETE | `/usuarios/:id` | Deletar usuário | Admin |

---

## 7. Interface do Usuário

### 7.1 Estrutura de Componentes

```
App
├── AuthProvider (Context)
├── QueryClientProvider (React Query)
└── Router
    ├── Login (Pública)
    └── RotaPrivada
        └── Layout (Sidebar + Header)
            ├── Dashboard
            ├── Produtos
            │   ├── ListaProdutos
            │   └── AdicionarProduto
            ├── Movimentacao
            ├── Vendas
            ├── Relatorios
            └── Usuarios (Admin)
```

### 7.2 Páginas Principais

#### 7.2.1 Dashboard
- **Cards de Resumo**: Total produtos, estoque total, vendas do mês
- **Gráficos**: Vendas por categoria, estoque por local
- **Alertas**: Produtos com estoque baixo

#### 7.2.2 Produtos
- **Lista**: Tabela com filtros (tipo, categoria, nome)
- **Ações**: Editar, visualizar estoque, deletar
- **Adicionar**: Formulário com upload de imagem

#### 7.2.3 Movimentação
- **Formulário**: Seleção de tipo, produto, locais, quantidade
- **Validação**: Verifica estoque disponível antes de transferir

#### 7.2.4 Vendas
- **Registrar**: Formulário rápido para venda
- **Histórico**: Tabela com filtro por data e produto

#### 7.2.5 Relatórios
- **Filtros**: Período, categoria, local
- **Visualização**: Gráficos interativos (Chart.js)
- **Export**: Botão para gerar PDF

### 7.3 Sistema de Feedback Visual

#### Toast Notifications (react-toastify)
```javascript
// Sucesso
toast.success('Produto cadastrado com sucesso!');

// Erro
toast.error('Erro ao salvar produto');

// Aviso
toast.warning('Estoque baixo!');

// Info
toast.info('Processando...');
```

#### Loading States
```javascript
// React Query Loading
{isLoading && <Loader />}

// Button Loading
<button disabled={isSubmitting}>
  {isSubmitting ? 'Salvando...' : 'Salvar'}
</button>
```

---

## 8. Fluxos de Dados

### 8.1 Fluxo de Autenticação

```
1. Usuário acessa /login
2. Insere credenciais
3. Frontend envia POST /api/auth/login
4. Backend valida credenciais
5. Backend gera JWT token
6. Frontend salva token em localStorage
7. Frontend redireciona para /dashboard
8. Todas as requisições incluem: Authorization: Bearer {token}
9. Backend valida token em cada requisição
10. Se token inválido: 401 → Redirect /login
```

### 8.2 Fluxo de Cadastro de Produto

```
1. Admin acessa /produtos/adicionar
2. Preenche formulário (nome, tipo, categoria)
3. Upload de imagem (Multer)
4. Frontend valida dados localmente
5. POST /api/produtos
6. Backend valida com Zod
7. Backend gera ID único (ex: ABCD01)
8. Salva produto no MongoDB
9. Cria registro de estoque inicial
10. Retorna produto criado
11. React Query invalida cache ['produtos']
12. UI atualiza automaticamente
13. Toast de sucesso
14. Redirect para /produtos
```

### 8.3 Fluxo de Venda

```
1. Usuário seleciona produto e local
2. Insere quantidade
3. Frontend valida se quantidade > 0
4. POST /api/vendas
5. Backend busca estoque atual
6. Valida se quantidade <= estoque disponível
7. Cria registro de venda
8. Atualiza quantidade do estoque (-quantidade)
9. Cria movimentação tipo 'saida'
10. Retorna venda registrada
11. React Query invalida ['vendas', 'estoque']
12. UI atualiza automaticamente
13. Toast: "Venda registrada!"
```

---

## 9. Considerações de Implementação

### 9.1 Ambiente de Desenvolvimento

```bash
# Backend
PORT=5000
MONGODB_URI=mongodb://localhost:27017/estoque-facil
JWT_SECRET=seu_secret_super_seguro_minimo_32_caracteres
FRONTEND_URL=http://localhost:3000

# Frontend
REACT_APP_API_URL=http://localhost:5000
```

### 9.2 Deploy em Produção

#### Backend (Railway, Render, Heroku)
```bash
# Variáveis de ambiente
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/estoque
JWT_SECRET={64_caracteres_aleatorios}
FRONTEND_URL=https://estoque-facil.com
```

#### Frontend (Vercel, Netlify)
```bash
# Build
npm run build

# Variáveis
REACT_APP_API_URL=https://api-estoque-facil.com
```

### 9.3 Melhorias Futuras

1. **Autenticação Avançada**
   - OAuth2 (Google, Microsoft)
   - 2FA (Two-Factor Authentication)
   - Refresh tokens

2. **Notificações Push**
   - Alertas de estoque baixo
   - Vendas em tempo real

3. **Auditoria Completa**
   - Log de todas as ações
   - Histórico de alterações

4. **Mobile App**
   - React Native
   - Leitura de código de barras

5. **Integrações**
   - ERP externo
   - Sistema de vendas (POS)
   - Nota Fiscal Eletrônica

---

## 10. Conclusão

### 10.1 Objetivos Alcançados

O sistema **Estoque Fácil** atende aos requisitos propostos:

✅ **Funcionalidade Completa**: Gerenciamento de produtos, estoque, vendas e relatórios  
✅ **Segurança Robusta**: JWT, bcrypt, rate limiting, Helmet, validação Zod  
✅ **Performance Otimizada**: Cache com React Query, índices MongoDB, compressão HTTP  
✅ **Arquitetura Escalável**: MVC, separation of concerns, microservices-ready  
✅ **UX Moderna**: SPA responsivo, feedback visual, navegação intuitiva  

### 10.2 Tecnologias e Boas Práticas

O projeto demonstra domínio em:
- **Stack MERN** (MongoDB, Express, React, Node.js)
- **Padrões de Projeto** (MVC, Repository, Hooks)
- **Segurança** (autenticação, criptografia, proteção contra ataques)
- **Engenharia de Software** (SOLID, DRY, clean code)

### 10.3 Impacto e Aplicabilidade

Este sistema pode ser aplicado em:
- Pequenos comércios (lojas, farmácias)
- Médias empresas (distribuidoras, atacadistas)
- Empresas com múltiplos pontos de venda

### 10.4 Considerações Finais

A documentação técnica apresentada fornece uma visão abrangente do sistema, desde a arquitetura de alto nível até detalhes de implementação. O código-fonte está organizado, comentado e segue padrões de mercado, facilitando manutenção e evolução futura.

---

**Documento elaborado para defesa de TCC**  
**Data**: Dezembro 2024  
**Sistema**: Estoque Fácil v1.0  
**Tecnologia**: MERN Stack (MongoDB, Express.js, React, Node.js)
