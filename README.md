# Estoque Fácil - Sistema de Gerenciamento de Inventário

![Estoque Fácil Logo](https://via.placeholder.com/150x50?text=Estoque+Facil)

## 📋 Visão Geral

**Estoque Fácil** é um sistema completo para gerenciamento de estoque e inventário, desenvolvido para pequenas e médias empresas brasileiras. A plataforma oferece controle de produtos, movimentações, vendas e relatórios em uma interface moderna e responsiva.

### ✨ Principais Funcionalidades

- Cadastro e gerenciamento completo de produtos
- Controle de estoque em múltiplos locais
- Registro de vendas e movimentações
- Dashboard com visão geral e alertas
- Relatórios detalhados e exportáveis em PDF
- Sistema de perfis de usuários (administradores e funcionários)
- Interface responsiva para desktop e dispositivos móveis

## 🔧 Tecnologias

### Backend
- **Node.js** com **Express.js** para API RESTful
- **MongoDB** para armazenamento de dados
- **JWT** (JSON Web Tokens) para autenticação
- **Bcrypt** para encriptação de senhas
- **Multer** para upload de arquivos
- **PDFKit** para geração de relatórios em PDF

### Frontend
- **React** para construção da interface
- **React Router** para navegação
- **Chart.js** para gráficos e visualizações
- **React-Toastify** para notificações
- **Axios** para requisições HTTP
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

## 📦 Modelos de Dados

### Usuario
- `_id`: ID único MongoDB
- `nome`: Nome completo do usuário
- `email`: Email (único)
- `senha`: Hash da senha
- `perfil`: "admin" ou "funcionario"
- `dataCriacao`: Data de criação do registro

### Produto
- `_id`: ID único MongoDB
- `id`: Código único gerado automaticamente (ex: "GBRC01")
- `nome`: Nome do produto
- `tipo`: Tipo de produto
- `categoria`: Categoria
- `subcategoria`: Subcategoria
- `imagemUrl`: Caminho para imagem
- `criadoPor`: Referência ao usuário que criou
- `dataCriacao`: Data de criação

### Estoque
- `_id`: ID único MongoDB
- `produto`: Referência ao produto
- `local`: Local de armazenamento
- `quantidade`: Quantidade disponível
- `dataRegistro`: Data de registro inicial
- `ultimaAtualizacao`: Data da última atualização
- `atualizadoPor`: Referência ao usuário que atualizou

### Movimentacao
- `_id`: ID único MongoDB
- `tipo`: "entrada", "saida" ou "transferencia"
- `produto`: Referência ao produto
- `quantidade`: Quantidade movimentada
- `localOrigem`: Local de origem
- `localDestino`: Local de destino (opcional)
- `data`: Data da movimentação
- `realizadoPor`: Referência ao usuário
- `observacao`: Observações (opcional)

### Venda
- `_id`: ID único MongoDB
- `produto`: Referência ao produto
- `quantidade`: Quantidade vendida
- `local`: Local da venda
- `dataVenda`: Data e hora da venda
- `registradoPor`: Referência ao usuário que registrou

## 🚀 Instalação e Configuração

### Requisitos Prévios
- Node.js (v14 ou superior)
- MongoDB (v4 ou superior)
- NPM ou Yarn

### Backend

1. **Clone o repositório**:
```bash
git clone [URL_DO_REPOSITÓRIO]
cd estoque-facil/backend
```

2. **Configure as variáveis de ambiente**:
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

3. **Instale as dependências**:
```bash
npm install
```

4. **Inicie o servidor**:
```bash
npm run dev
```

### Frontend

1. **Navegue até a pasta do frontend**:
```bash
cd ../frontend
```

2. **Instale as dependências**:
```bash
npm install
```

3. **Inicie o aplicativo React**:
```bash
npm start
```

## 🚢 API Endpoints

### Autenticação
- `POST /api/auth/login`: Login de usuário
- `POST /api/auth/registro`: Registro de novo usuário
- `GET /api/auth/verificar`: Verificar usuário atual

### Produtos
- `GET /api/produtos`: Listar todos os produtos
- `POST /api/produtos`: Criar produto
- `GET /api/produtos/:id`: Obter produto específico
- `PUT /api/produtos/:id`: Atualizar produto
- `DELETE /api/produtos/:id`: Remover produto
- `GET /api/produtos/tipos`: Listar tipos de produtos
- `GET /api/produtos/categorias`: Listar categorias
- `GET /api/produtos/subcategorias`: Listar subcategorias

### Estoque
- `GET /api/estoque/verificar`: Verificar estoque de produto
- `POST /api/estoque/transferir`: Transferir entre locais
- `GET /api/estoque/locais`: Listar locais disponíveis

### Vendas
- `GET /api/vendas`: Listar vendas
- `POST /api/vendas`: Registrar venda

### Relatórios
- `GET /api/relatorios/resumo`: Gerar resumo para relatório
- `GET /api/relatorios/pdf`: Gerar relatório em PDF

### Usuários (Admin)
- `GET /api/usuarios`: Listar usuários
- `POST /api/usuarios`: Criar usuário
- `PUT /api/usuarios/:id`: Atualizar usuário
- `PUT /api/usuarios/:id/senha`: Alterar senha
- `DELETE /api/usuarios/:id`: Remover usuário

## 📝 Guia de Uso

### Primeiro Acesso

1. Registre um novo usuário na tela de login
2. Use MongoDB para promover o primeiro usuário a administrador:
   ```javascript
   use estoque-facil
   db.usuarios.updateOne({ email: "seu_email@exemplo.com" }, { $set: { perfil: "admin" } })
   ```

### Fluxo Básico

1. **Cadastro de Produtos**:
   - Acesse "Produtos" > "Adicionar Produto"
   - Preencha os dados e adicione estoque inicial

2. **Transferência de Estoque**:
   - Acesse "Movimentação"
   - Selecione origem, destino e quantidade

3. **Registro de Vendas**:
   - Acesse "Vendas" > "Registrar Venda"
   - Selecione produto, local e quantidade

4. **Geração de Relatórios**:
   - Acesse "Relatórios"
   - Defina período e filtros desejados
   - Visualize gráficos ou exporte PDF

## 🛠️ Solução de Problemas

### Erro de Conexão com MongoDB
- Verifique se o MongoDB está em execução
- Confirme a string de conexão no arquivo `.env`
- Verifique se o IP está na whitelist (MongoDB Atlas)

### Uploads Não Funcionam
- Verifique se a pasta `uploads` existe e tem permissões
- Confirme que o Multer está configurado corretamente

### Erros no Frontend
- Limpe o cache do navegador
- Verifique se o proxy está configurado no `package.json`
- Confira erros no console do navegador

## 🔍 Componentes Frontend Principais

### Páginas
- `Login.js`: Autenticação de usuários
- `Dashboard.js`: Visão geral do sistema
- `Produtos.js`: Lista de produtos
- `AdicionarProduto.js`: Formulário de cadastro
- `Movimentacao.js`: Controle de movimentações
- `Vendas.js`: Registro e histórico de vendas
- `Relatorios.js`: Geração de relatórios
- `Usuarios.js`: Gerenciamento de usuários

### Componentes
- `Layout.js`: Template principal da aplicação
- `Sidebar.js`: Menu de navegação lateral
- `RotaPrivada.js`: Proteção de rotas autenticadas

## 📊 Relatórios Disponíveis

1. **Visão Geral**:
   - Vendas por categoria
   - Estoque por local
   - Estatísticas do período

2. **Top Produtos**:
   - Ranking de produtos mais vendidos
   - Percentual de cada produto no total de vendas

3. **Produtos Sem Movimentação**:
   - Lista de produtos parados
   - Distribuição por local

## 🔮 Próximas Melhorias

- [ ] Remover Implementações temporárias e dados simulados do backend
- [ ] Adicionar opção de Atualizar Estoque em Movimentações
- [ ] Corrigir Histórico de Vendas em Vendas e Registar Vendas em Movimentações
- [ ] Adicionar Visualização do Histórico de movimentações
- [ ] Melhoria na página de Relatórios
- [ ] Atualização do dashboard com mais informações
- [ ] Mudança da página Usuários para Gerenciamento
- [ ] Aplicativo móvel nativo (React Native)
      
## 📄 Licença

Este projeto está licenciado sob a licença MIT - consulte o arquivo [LICENSE](LICENSE) para obter detalhes.

## 👥 Contribuições

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Faça commit de suas alterações (`git commit -m 'Adiciona nova funcionalidade'`)
4. Envie para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

Este README fornece uma documentação abrangente do projeto "Estoque Fácil", detalhando a arquitetura, estrutura, endpoints da API, modelos de dados e instruções de uso. É projetado para servir como uma referência completa, facilitando a consulta e futuras modificações, inclusive com assistência de outros agentes de IA.

A documentação está estruturada para dar uma visão clara do sistema completo, desde sua instalação até os detalhes técnicos mais específicos. Isso permitirá que você mantenha o projeto de forma eficiente e desenvolva novas funcionalidades com base no trabalho já realizado.
