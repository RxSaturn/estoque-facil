# 📘 Guia Completo de Instalação e Uso - Estoque Fácil

## Bem-vindo ao Estoque Fácil! 🎉

Este guia foi criado para ajudá-lo a instalar, configurar e usar o sistema **Estoque Fácil** passo a passo, mesmo que você não tenha experiência técnica. Siga as instruções cuidadosamente e você terá seu sistema funcionando em poucos minutos!

---

## 📑 Índice

1. [Requisitos do Sistema](#1-requisitos-do-sistema)
2. [Instalação Passo a Passo](#2-instalação-passo-a-passo)
3. [Primeiro Acesso](#3-primeiro-acesso)
4. [Guia de Uso do Sistema](#4-guia-de-uso-do-sistema)
5. [Resolução de Problemas](#5-resolução-de-problemas)
6. [Glossário Visual](#6-glossário-visual)
7. [Perguntas Frequentes (FAQ)](#7-perguntas-frequentes-faq)

---

## 1. Requisitos do Sistema

### 1.1 Hardware Mínimo

- **Processador**: Intel Core i3 ou equivalente
- **Memória RAM**: 4 GB (recomendado: 8 GB)
- **Espaço em Disco**: 2 GB livres
- **Internet**: Conexão estável (para instalação e uso do MongoDB online)

### 1.2 Software Necessário

Você precisará instalar os seguintes programas:

1. ✅ **Node.js** (versão 14 ou superior)
2. ✅ **MongoDB** (versão 4 ou superior) - Pode usar MongoDB Atlas (grátis na nuvem)
3. ✅ **Git** (para baixar o código)
4. ✅ **Editor de Código** (recomendado: VS Code)

---

## 2. Instalação Passo a Passo

### 🔹 Passo 1: Instalar Node.js

Node.js é a plataforma que executa o sistema no servidor.

1. **Acesse** o site oficial: https://nodejs.org/
2. **Baixe** a versão LTS (Long Term Support) - recomendada
3. **Execute** o instalador e siga as instruções (deixe as opções padrão)
4. **Verifique** a instalação abrindo o terminal/prompt de comando:

```bash
node --version
# Deve mostrar algo como: v18.17.0

npm --version
# Deve mostrar algo como: 9.6.7
```

**💡 Dica**: No Windows, use o "Prompt de Comando" ou "PowerShell". No Mac/Linux, use o "Terminal".

---

### 🔹 Passo 2: Instalar MongoDB

Você tem duas opções: instalar localmente ou usar MongoDB Atlas (na nuvem).

#### Opção A: MongoDB Atlas (Recomendado para iniciantes - Grátis)

1. **Crie uma conta** em: https://www.mongodb.com/cloud/atlas/register
2. **Crie um cluster gratuito**:
   - Escolha "Shared" (grátis)
   - Selecione uma região próxima (ex: São Paulo)
   - Clique em "Create Cluster"
3. **Configure acesso**:
   - Vá em "Database Access" → "Add New Database User"
   - Crie um usuário (ex: `admin`) e senha (anote!)
   - Permissões: "Atlas Admin"
4. **Configure rede**:
   - Vá em "Network Access" → "Add IP Address"
   - Clique em "Allow Access from Anywhere" (0.0.0.0/0)
   - Confirme
5. **Obtenha a String de Conexão**:
   - Vá em "Database" → "Connect"
   - Escolha "Connect your application"
   - Copie a string que parece com:
     ```
     mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - **Importante**: Substitua `<password>` pela senha que você criou!

#### Opção B: MongoDB Local

1. **Baixe** em: https://www.mongodb.com/try/download/community
2. **Instale** seguindo o assistente
3. **Inicie** o MongoDB:
   - Windows: Serviço inicia automaticamente
   - Mac/Linux: Execute `mongod` no terminal
4. **String de conexão**: `mongodb://localhost:27017/estoque-facil`

---

### 🔹 Passo 3: Instalar Git

1. **Baixe** em: https://git-scm.com/downloads
2. **Instale** com as opções padrão
3. **Verifique**:

```bash
git --version
# Deve mostrar algo como: git version 2.40.0
```

---

### 🔹 Passo 4: Baixar o Código do Estoque Fácil

1. **Abra** o terminal/prompt de comando
2. **Navegue** até a pasta onde deseja instalar (ex: Documentos):

```bash
# Windows
cd C:\Users\SeuNome\Documents

# Mac/Linux
cd ~/Documents
```

3. **Clone** o repositório:

```bash
git clone https://github.com/RxSaturn/estoque-facil.git
cd estoque-facil
```

---

### 🔹 Passo 5: Configurar o Backend (Servidor)

1. **Navegue** até a pasta do backend:

```bash
cd backend
```

2. **Instale** as dependências (isso pode demorar alguns minutos):

```bash
npm install
```

3. **Configure** as variáveis de ambiente:

   **Windows (PowerShell/CMD)**:
   ```bash
   copy .env.example .env
   ```

   **Mac/Linux**:
   ```bash
   cp .env.example .env
   ```

4. **Edite** o arquivo `.env` com um editor de texto:

```env
# Porta do servidor (padrão: 5000)
PORT=5000

# String de conexão do MongoDB
# SE USAR MONGODB ATLAS:
MONGODB_URI=mongodb+srv://admin:suasenha@cluster0.xxxxx.mongodb.net/estoque-facil?retryWrites=true&w=majority

# SE USAR MONGODB LOCAL:
MONGODB_URI=mongodb://localhost:27017/estoque-facil

# Chave secreta JWT (gere uma aleatória!)
# IMPORTANTE: Use pelo menos 32 caracteres aleatórios
JWT_SECRET=sua_chave_secreta_super_segura_minimo_32_caracteres_aleatorios

# URL do frontend (padrão: http://localhost:3000)
FRONTEND_URL=http://localhost:3000

# Configuração de Email (opcional - para recuperação de senha)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_senha_de_aplicativo
```

**💡 Dica para gerar JWT_SECRET**:
- Acesse: https://www.random.org/strings/
- Gere uma string aleatória de 64 caracteres
- Copie e cole no `.env`

5. **Inicie** o servidor:

```bash
npm run dev
```

**✅ Sucesso!** Se aparecer:
```
✅ Servidor rodando na porta 5000
✅ Conectado ao MongoDB
```

Mantenha este terminal aberto!

---

### 🔹 Passo 6: Configurar o Frontend (Interface)

1. **Abra um NOVO terminal** (mantenha o anterior aberto!)
2. **Navegue** até a pasta do frontend:

```bash
# Se estiver na raiz do projeto
cd frontend

# Se estiver em backend
cd ../frontend
```

3. **Instale** as dependências:

```bash
npm install
```

4. **Inicie** o frontend:

```bash
npm start
```

**✅ Sucesso!** O navegador abrirá automaticamente em `http://localhost:3000`

---

## 3. Primeiro Acesso

### 🔹 Passo 1: Criar Sua Conta

1. Na tela de login, clique em **"Criar Conta"** ou **"Registrar-se"**
2. Preencha seus dados:
   - Nome completo
   - Email (será seu login)
   - Senha (mínimo 6 caracteres)
3. Clique em **"Registrar"**

**❗ Importante**: Por padrão, você será criado como "funcionário". Precisamos promovê-lo a administrador!

---

### 🔹 Passo 2: Promover a Administrador

Como este é o primeiro acesso, você precisa se tornar administrador usando o MongoDB.

#### Se usar MongoDB Atlas:

1. **Acesse** https://cloud.mongodb.com/
2. **Faça login** na sua conta
3. Clique em **"Browse Collections"** no seu cluster
4. Selecione o banco **"estoque-facil"** → coleção **"usuarios"**
5. Encontre seu usuário (pelo email)
6. Clique em **"Edit"**
7. Altere o campo `perfil` de `"funcionario"` para `"admin"`
8. Clique em **"Update"**

#### Se usar MongoDB Local:

1. **Abra** um novo terminal
2. **Execute**:

```bash
mongosh estoque-facil
```

3. **Execute o comando** (substitua SEU_EMAIL):

```javascript
db.usuarios.updateOne(
  { email: "SEU_EMAIL@exemplo.com" },
  { $set: { perfil: "admin" } }
)
```

4. **Confirme**: Deve aparecer `{ acknowledged: true, matchedCount: 1, modifiedCount: 1 }`

---

### 🔹 Passo 3: Fazer Login

1. Volte para o navegador (`http://localhost:3000`)
2. Faça login com seu email e senha
3. **Pronto!** Você será redirecionado para o Dashboard

---

## 4. Guia de Uso do Sistema

### 🏠 Dashboard (Página Inicial)

O Dashboard mostra uma visão geral do seu estoque:

- **📦 Total de Produtos**: Quantos produtos diferentes você tem cadastrados
- **📊 Estoque Total**: Soma de todas as quantidades em todos os locais
- **💰 Vendas do Mês**: Total de vendas realizadas no mês atual
- **⚠️ Alertas**: Produtos com estoque baixo (menos de 10 unidades)

**Gráficos Disponíveis**:
- Vendas por Categoria (Pizza)
- Estoque por Local (Barras)
- Histórico de Vendas (Linha do Tempo)

---

### 📦 Gerenciamento de Produtos

#### ➕ Adicionar Produto

1. Clique em **"Produtos"** no menu lateral
2. Clique no botão **"+ Adicionar Produto"**
3. Preencha o formulário:

   **Informações Básicas**:
   - **Nome**: Nome do produto (ex: "Notebook Dell Inspiron 15")
   - **Tipo**: Categoria ampla (ex: "Eletrônico")
   - **Categoria**: Categoria específica (ex: "Informática")
   - **Subcategoria**: Subcategoria (ex: "Notebooks")
   - **Imagem**: Upload de foto do produto (opcional)

   **Estoque Inicial**:
   - **Local**: Onde o produto será armazenado (ex: "Depósito Principal")
   - **Quantidade**: Quantidade inicial (ex: 100)

4. Clique em **"Salvar Produto"**

**✅ Sucesso!** Aparecerá uma notificação verde: "Produto cadastrado com sucesso!"

---

#### 📝 Editar Produto

1. Na lista de produtos, clique no ícone **✏️ (Editar)**
2. Altere os campos desejados
3. Clique em **"Atualizar"**

---

#### 🗑️ Deletar Produto

1. Na lista de produtos, clique no ícone **🗑️ (Deletar)**
2. Confirme a exclusão

**⚠️ Atenção**: Deletar um produto também remove todo seu histórico de estoque e vendas!

---

### 📊 Controle de Estoque

#### 🔄 Transferir Entre Locais

Use esta função para mover produtos de um local para outro (ex: do depósito para a loja).

1. Clique em **"Movimentação"** no menu lateral
2. Selecione **"Transferência"** como tipo
3. Preencha:
   - **Produto**: Escolha o produto
   - **Local de Origem**: De onde sair
   - **Local de Destino**: Para onde ir
   - **Quantidade**: Quanto transferir
   - **Observação**: Motivo da transferência (opcional)
4. Clique em **"Registrar Movimentação"**

**✅ Sucesso!** O estoque será atualizado automaticamente nos dois locais.

---

#### 📥 Entrada de Estoque

Use para registrar entrada de novos produtos (compras, devoluções).

1. Vá em **"Movimentação"**
2. Selecione **"Entrada"**
3. Escolha produto, local e quantidade
4. Clique em **"Registrar"**

---

#### 📤 Saída de Estoque

Use para registrar saídas que não são vendas (perdas, doações, etc).

1. Vá em **"Movimentação"**
2. Selecione **"Saída"**
3. Escolha produto, local e quantidade
4. Adicione observação (ex: "Produto danificado")
5. Clique em **"Registrar"**

---

### 💰 Registro de Vendas

#### 🛒 Registrar Venda

1. Clique em **"Vendas"** no menu lateral
2. Clique em **"Registrar Nova Venda"**
3. Preencha:
   - **Produto**: Escolha o produto vendido
   - **Local**: De qual local saiu o produto
   - **Quantidade**: Quantas unidades foram vendidas
4. Clique em **"Registrar Venda"**

**O que acontece automaticamente**:
- ✅ Estoque é reduzido
- ✅ Venda é registrada no histórico
- ✅ Movimentação de saída é criada
- ✅ Dashboard é atualizado

**❌ Erro: "Estoque insuficiente"**:
- Verifique se há quantidade disponível no local selecionado
- Faça uma transferência se necessário

---

#### 📋 Ver Histórico de Vendas

1. Clique em **"Vendas"**
2. Veja a tabela com todas as vendas
3. **Filtros disponíveis**:
   - Por período (data inicial e final)
   - Por produto
   - Por local

---

### 📈 Relatórios

#### 📊 Gerar Relatório

1. Clique em **"Relatórios"** no menu lateral
2. Selecione os filtros:
   - **Período**: Data inicial e final
   - **Categoria**: Filtrar por categoria (opcional)
   - **Local**: Filtrar por local (opcional)
3. Clique em **"Gerar Relatório"**

**Informações Exibidas**:
- Total de vendas
- Total de receita
- Produtos mais vendidos
- Vendas por categoria (gráfico pizza)
- Vendas ao longo do tempo (gráfico linha)
- Estoque por local (gráfico barras)

---

#### 📄 Exportar para PDF

1. Após gerar o relatório
2. Clique no botão **"Exportar PDF"**
3. O arquivo será baixado automaticamente

---

### 👥 Gerenciamento de Usuários (Apenas Admin)

#### ➕ Adicionar Usuário

1. Clique em **"Usuários"** no menu lateral
2. Clique em **"+ Adicionar Usuário"**
3. Preencha:
   - Nome completo
   - Email (será o login)
   - Senha
   - Perfil: **Admin** ou **Funcionário**
4. Clique em **"Criar Usuário"**

**Diferenças entre perfis**:
- **Admin**: Acesso total, pode criar/deletar produtos, usuários e gerar relatórios
- **Funcionário**: Pode registrar vendas, ver estoque, fazer movimentações

---

#### ✏️ Editar Usuário

1. Na lista de usuários, clique em **"Editar"**
2. Altere nome, email ou perfil
3. Clique em **"Atualizar"**

---

#### 🔑 Alterar Senha

1. Clique em **"Alterar Senha"** ao lado do usuário
2. Digite a nova senha
3. Confirme

---

## 5. Resolução de Problemas

### ❌ Problema: "Porta 5000 já está em uso"

**Causa**: Outro programa está usando a porta 5000.

**Solução**:

#### Opção 1: Matar o processo na porta 5000

**Windows**:
```bash
netstat -ano | findstr :5000
# Anote o PID (último número)
taskkill /PID [PID] /F
```

**Mac/Linux**:
```bash
lsof -i :5000
# Anote o PID
kill -9 [PID]
```

#### Opção 2: Alterar a porta

No arquivo `backend/.env`, altere:
```env
PORT=5001
```

E no `frontend/package.json`, altere o proxy:
```json
"proxy": "http://localhost:5001"
```

---

### ❌ Problema: "Erro ao conectar com MongoDB"

**Possíveis causas e soluções**:

#### 1. MongoDB não está rodando (MongoDB Local)

**Windows**:
1. Abra "Serviços" (services.msc)
2. Procure "MongoDB Server"
3. Clique com botão direito → "Iniciar"

**Mac/Linux**:
```bash
sudo systemctl start mongod
```

#### 2. String de conexão incorreta (MongoDB Atlas)

- Verifique se substituiu `<password>` pela senha real
- Verifique se o IP está liberado (0.0.0.0/0 em Network Access)
- Verifique se o usuário tem permissões

---

### ❌ Problema: "Token inválido" ou "Sessão expirada"

**Causa**: Token JWT expirou (padrão: 7 dias).

**Solução**:
1. Faça logout
2. Faça login novamente

---

### ❌ Problema: "Estoque insuficiente" ao registrar venda

**Causa**: Não há quantidade disponível no local selecionado.

**Solução**:
1. Verifique o estoque em **"Produtos"** → Clique no produto
2. Se estiver em outro local, faça uma **Transferência**
3. Se não houver estoque, registre uma **Entrada**

---

### ❌ Problema: Frontend não carrega (tela branca)

**Soluções**:

1. **Limpar cache do navegador**:
   - Chrome: Ctrl+Shift+Delete → Limpar cache
   - Ou abra em aba anônima (Ctrl+Shift+N)

2. **Verificar se backend está rodando**:
   - Abra http://localhost:5000 no navegador
   - Deve aparecer algo (mesmo que erro, mostra que tá rodando)

3. **Verificar console do navegador**:
   - Pressione F12
   - Vá em "Console"
   - Veja se há erros em vermelho

---

### ❌ Problema: Upload de imagem não funciona

**Causa**: Pasta `uploads` não existe ou sem permissões.

**Solução**:

1. Crie a pasta manualmente:
```bash
cd backend
mkdir uploads
mkdir uploads/produtos
```

2. **Windows**: Clique com botão direito → Propriedades → Desmarque "Somente leitura"

3. **Mac/Linux**:
```bash
chmod 777 uploads
```

---

### ❌ Problema: "Cannot GET /api/..."

**Causa**: Backend não está rodando ou URL incorreta.

**Solução**:
1. Verifique se o terminal do backend está aberto e sem erros
2. Teste: `curl http://localhost:5000/api/produtos` (deve retornar JSON)
3. Verifique se o proxy está configurado em `frontend/package.json`

---

## 6. Glossário Visual

### 🎨 Sistema de Notificações (Toasts)

O sistema usa notificações coloridas para dar feedback:

**🟢 Verde (Sucesso)**:
- "Produto cadastrado com sucesso!"
- "Venda registrada!"
- "Senha alterada com sucesso!"

➡️ **Significa**: Ação completada com êxito.

---

**🔴 Vermelho (Erro)**:
- "Erro ao salvar produto"
- "Estoque insuficiente"
- "Email já cadastrado"

➡️ **Significa**: Algo deu errado, leia a mensagem e corrija.

---

**🟡 Amarelo (Aviso)**:
- "Estoque baixo!"
- "Produto sem movimentação há 30 dias"

➡️ **Significa**: Atenção necessária, mas não é erro.

---

**🔵 Azul (Informação)**:
- "Processando relatório..."
- "Carregando dados..."

➡️ **Significa**: Operação em andamento, aguarde.

---

### ⏳ Indicadores de Carregamento (Loaders)

**Spinner Circular**:
- Aparece ao buscar dados do servidor
- Significa: "Aguarde, carregando..."

**Botão com "Salvando..."**:
- Botão fica desabilitado com texto "Salvando..."
- Significa: Não clique novamente, estamos processando

**Skeleton (Placeholder)**:
- Retângulos cinzas piscando
- Significa: Conteúdo está sendo carregado

---

### 🎯 Ícones Comuns

| Ícone | Significado | Onde Encontrar |
|-------|-------------|----------------|
| ✏️ | Editar | Listas de produtos, usuários |
| 🗑️ | Deletar | Listas de produtos, usuários |
| 👁️ | Visualizar | Ver detalhes do item |
| ➕ | Adicionar | Criar novo item |
| 📊 | Relatórios | Gerar relatórios |
| 🔄 | Atualizar | Recarregar dados |
| ⬇️ | Download | Baixar PDF |
| 🔍 | Buscar | Pesquisar na lista |

---

## 7. Perguntas Frequentes (FAQ)

### ❓ Posso usar o sistema sem internet?

**Sim e Não**:
- ✅ **Sim**: Se usar MongoDB local, tudo funciona offline
- ❌ **Não**: Se usar MongoDB Atlas, precisa de internet

---

### ❓ Quantos usuários posso cadastrar?

**Ilimitado!** Não há limite de usuários.

---

### ❓ Posso acessar de outro computador?

**Sim**, mas precisa configurar:

1. No backend `.env`, altere:
```env
FRONTEND_URL=http://SEU_IP:3000
```

2. Inicie o frontend com:
```bash
npm start -- --host 0.0.0.0
```

3. Acesse de outro PC: `http://IP_DO_SERVIDOR:3000`

---

### ❓ Como fazer backup dos dados?

#### MongoDB Atlas:
1. Vá em "Clusters" → "..." → "Export Data"

#### MongoDB Local:
```bash
mongodump --db estoque-facil --out /caminho/backup
```

---

### ❓ Posso personalizar o sistema?

**Sim!** O código-fonte está disponível. Você pode:
- Alterar cores em `frontend/src/styles`
- Adicionar campos nos formulários
- Criar novos relatórios

---

### ❓ O sistema funciona no celular?

**Sim!** A interface é responsiva:
- ✅ Funciona em smartphones
- ✅ Funciona em tablets
- ✅ Funciona em desktops

---

### ❓ Como recuperar senha esquecida?

1. Na tela de login, clique em **"Esqueci minha senha"**
2. Digite seu email
3. Um email será enviado com link de recuperação
4. Clique no link e defina nova senha

**Nota**: Funciona apenas se você configurou EMAIL no `.env`

---

### ❓ Posso ter múltiplos locais de armazenamento?

**Sim!** Você pode cadastrar quantos locais quiser:
- Depósito Principal
- Loja Centro
- Loja Shopping
- Estoque de Reserva
- etc.

---

### ❓ Como ver produtos sem movimentação?

1. Vá em **"Relatórios"**
2. Role até **"Produtos Sem Movimentação"**
3. Veja a lista com produtos parados há mais de 30 dias

---

## 🎓 Conclusão

Parabéns! 🎉 Você agora sabe como:

✅ Instalar e configurar o Estoque Fácil  
✅ Criar e gerenciar produtos  
✅ Controlar estoque e movimentações  
✅ Registrar vendas  
✅ Gerar relatórios  
✅ Resolver problemas comuns  

---

## 📞 Suporte

Se encontrar problemas não listados neste guia:

1. **Verifique os logs**:
   - Backend: Terminal onde executou `npm run dev`
   - Frontend: Console do navegador (F12)

2. **Consulte a documentação técnica**: `documentation/TCC_DOCUMENTACAO_TECNICA.md`

3. **Abra uma issue** no GitHub: https://github.com/RxSaturn/estoque-facil/issues

---

**Bom uso do sistema Estoque Fácil! 🚀**

---

**Última atualização**: Dezembro 2024  
**Versão do Guia**: 1.0  
**Sistema**: Estoque Fácil v1.0
