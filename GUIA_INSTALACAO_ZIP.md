# 📦 Guia de Instalação - Estoque Fácil (Versão ZIP)

## 👋 Bem-vindo!

Este guia foi criado especialmente para você que recebeu o **Estoque Fácil** em um arquivo ZIP e deseja instalá-lo em seu computador. Não se preocupe se não é expert em informática - vamos explicar cada passo com detalhes e imagens.

**O que você vai aprender neste guia:**
- ✅ Como instalar os programas necessários
- ✅ Como preparar o sistema para funcionar
- ✅ Como iniciar o Estoque Fácil
- ✅ Como resolver problemas comuns
- ✅ Dicas importantes de uso

**Tempo estimado:** 15 a 30 minutos

---

## 📑 Índice

1. [Antes de Começar](#1-antes-de-começar)
2. [Instalando o Node.js](#2-instalando-o-nodejs)
3. [Preparando o Estoque Fácil](#3-preparando-o-estoque-fácil)
4. [Primeira Execução](#4-primeira-execução)
5. [Usando o Sistema](#5-usando-o-sistema)
6. [Problemas Comuns e Soluções](#6-problemas-comuns-e-soluções)
7. [Perguntas Frequentes](#7-perguntas-frequentes)
8. [Dicas Importantes](#8-dicas-importantes)

---

## 1. Antes de Começar

### 1.1 O Que Vem no Arquivo ZIP?

Quando você extrair o arquivo ZIP, vai encontrar esta estrutura:

```
estoque-facil/
├── backend/              → Servidor do sistema (cérebro)
│   ├── .env             → Configurações (já vem pronto!)
│   └── ...outros arquivos
├── frontend/            → Interface visual (o que você vê)
│   └── ...outros arquivos
├── documentation/       → Documentação técnica
├── instalacao_inicial.bat    → SCRIPT DE INSTALAÇÃO ⭐
├── executar-estoque-facil.bat → SCRIPT PARA ABRIR O SISTEMA ⭐
├── README.md
└── ...outros arquivos
```

**Os 2 arquivos mais importantes:**
- 🔧 `instalacao_inicial.bat` - Execute uma vez para instalar tudo
- ▶️ `executar-estoque-facil.bat` - Execute sempre que quiser abrir o sistema

### 1.2 Requisitos do Seu Computador

**Sistema Operacional:**
- ✅ Windows 10 ou superior
- ✅ Windows 11 (recomendado)

**Hardware Mínimo:**
- 💻 Processador: Intel Core i3 ou equivalente
- 🧠 Memória RAM: 4 GB (recomendado: 8 GB)
- 💾 Espaço em Disco: 2 GB livres
- 🌐 Internet: Necessária para instalação inicial

**Importante:** Você precisa ter permissões de administrador no computador!

### 1.3 O Que Você Vai Precisar Instalar

Apenas **1 programa**:
- **Node.js** - É como o "motor" que faz o sistema funcionar

Não se preocupe! Vamos te guiar na instalação passo a passo.

---

## 2. Instalando o Node.js

O Node.js é essencial para o funcionamento do Estoque Fácil. Pense nele como o motor de um carro - sem ele, nada funciona.

### 2.1 Verificar Se Já Está Instalado

Antes de instalar, vamos verificar se você já tem o Node.js:

**Passo 1:** Abra o "Prompt de Comando"
- Pressione a tecla `Windows` + `R` no teclado
- Digite: `cmd`
- Pressione `Enter`

**Passo 2:** Digite o comando:
```
node --version
```

**Resultados possíveis:**

✅ **Se aparecer algo como `v18.17.0` ou `v20.10.0`**
- Parabéns! Node.js já está instalado
- Pode pular para a [Seção 3](#3-preparando-o-estoque-fácil)

❌ **Se aparecer "não é reconhecido como comando"**
- Node.js não está instalado
- Continue lendo para instalar

### 2.2 Baixando o Node.js

**Passo 1:** Acesse o site oficial
- Abra seu navegador (Chrome, Edge, Firefox, etc.)
- Digite na barra de endereços: `https://nodejs.org`
- Pressione `Enter`

**Passo 2:** Escolha a versão correta
- Você verá 2 botões grandes:
  - **LTS (Long Term Support)** ← ESCOLHA ESTE! ⭐
  - Current (com últimas funcionalidades)
- Clique no botão **LTS**

**Por que LTS?** É a versão mais estável e recomendada para uso profissional.

**Passo 3:** Aguarde o download
- O arquivo tem cerca de 30 MB
- Nome do arquivo será algo como: `node-v20.10.0-x64.msi`
- Aguarde o download terminar (geralmente na pasta "Downloads")

### 2.3 Instalando o Node.js

**Passo 1:** Localize o arquivo baixado
- Abra a pasta "Downloads"
- Procure por `node-v...-.msi`
- Dê um duplo clique no arquivo

**Passo 2:** Assistente de Instalação
- Uma janela vai aparecer: "Welcome to the Node.js Setup Wizard"
- Clique em **"Next"** (Avançar)

**Passo 3:** Aceite os termos
- Marque a caixa: "I accept the terms in the License Agreement"
- Clique em **"Next"**

**Passo 4:** Escolha o local de instalação
- **Deixe o padrão!** `C:\Program Files\nodejs\`
- Clique em **"Next"**

**Passo 5:** Componentes personalizados
- **Deixe tudo marcado!** (padrão)
- Especialmente: "Add to PATH" deve estar marcado ✓
- Clique em **"Next"**

**Passo 6:** Ferramentas nativas (opcional)
- Pode aparecer: "Tools for Native Modules"
- **Marque a caixa** para instalar ferramentas extras
- Clique em **"Next"**

**Passo 7:** Iniciar instalação
- Clique em **"Install"**
- Aguarde... (2-5 minutos)
- Se pedir permissão de administrador, clique em **"Sim"**

**Passo 8:** Finalizar
- Quando terminar, clique em **"Finish"**

### 2.4 Verificar Instalação

**IMPORTANTE:** Feche e abra novamente o Prompt de Comando!

**Passo 1:** Abra um novo Prompt de Comando
- `Windows` + `R`
- Digite: `cmd`
- `Enter`

**Passo 2:** Verifique a versão:
```
node --version
```
Deve mostrar algo como: `v20.10.0`

**Passo 3:** Verifique o NPM (gerenciador de pacotes):
```
npm --version
```
Deve mostrar algo como: `10.2.3`

**✅ Se ambos mostrarem versões, está tudo OK!**

---

## 3. Preparando o Estoque Fácil

Agora vamos preparar o sistema para funcionar pela primeira vez.

### 3.1 Extraindo o Arquivo ZIP

**Passo 1:** Localize o arquivo ZIP
- Encontre o arquivo `estoque-facil.zip` que você recebeu
- Recomendamos colocar em: `C:\Estoque-Facil` ou `Meus Documentos`

**Passo 2:** Extrair o arquivo
- **Opção 1 (Windows 11/10 nativo):**
  - Clique com botão direito no arquivo ZIP
  - Selecione: "Extrair Tudo..."
  - Escolha o local: `C:\Estoque-Facil`
  - Clique em "Extrair"

- **Opção 2 (WinRAR/7-Zip):**
  - Clique com botão direito no arquivo ZIP
  - Selecione: "Extrair aqui" ou "Extract Here"

**Passo 3:** Verificar estrutura
Depois de extrair, você deve ver:
```
C:\Estoque-Facil\
├── backend\
├── frontend\
├── documentation\
├── instalacao_inicial.bat      ← Importante!
├── executar-estoque-facil.bat  ← Importante!
└── ...
```

### 3.2 Verificar Arquivo .env

O arquivo `.env` contém as configurações do sistema e **já vem pronto** no ZIP!

**IMPORTANTE:** Não precisa fazer nada aqui! Mas se tiver curiosidade:

**Passo 1:** Entre na pasta `backend`
```
C:\Estoque-Facil\backend\
```

**Passo 2:** Procure o arquivo `.env`
- **Importante:** Arquivos que começam com ponto (.) podem estar ocultos!
- Para ver arquivos ocultos no Windows:
  - Abra o Explorador de Arquivos
  - Clique na aba "Exibir"
  - Marque a caixa "Itens ocultos"

**Passo 3:** O arquivo .env deve conter (aproximadamente):
```env
PORT=5000
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/estoque-facil
JWT_SECRET=chave_secreta_muito_longa_e_segura
FRONTEND_URL=http://localhost:3000
```

**✅ Se o arquivo .env existe, está tudo OK!**

---

## 4. Primeira Execução

Agora vem a parte mais fácil! Vamos instalar todas as dependências necessárias.

### 4.1 Executando o Script de Instalação

**Passo 1:** Navegue até a pasta principal
- Abra o Explorador de Arquivos
- Vá para: `C:\Estoque-Facil\` (ou onde você extraiu)

**Passo 2:** Localize o arquivo `instalacao_inicial.bat`
- É um arquivo com ícone de engrenagem ⚙️
- Ou ícone de janela de comando

**Passo 3:** Execute o script
- **Dê duplo clique** em `instalacao_inicial.bat`
- Uma janela preta (Prompt de Comando) vai abrir

**O que vai acontecer:**

A janela vai mostrar várias mensagens. Você verá algo assim:

```
======================================================
    INSTALAÇÃO INICIAL DO ESTOQUE FÁCIL - v1.0
======================================================

[✓] Verificando Node.js...
    Node.js encontrado: v20.10.0
    NPM encontrado: v10.2.3

[✓] Criando pastas necessárias...
    Pasta uploads criada com sucesso!
    Pasta uploads\produtos criada com sucesso!

[*] Instalando dependências do BACKEND...
    Isso pode demorar alguns minutos...
    
    added 234 packages, and audited 235 packages in 45s
    
    ✓ Backend instalado com sucesso!

[*] Instalando dependências do FRONTEND...
    Isso pode demorar alguns minutos...
    
    added 1453 packages, and audited 1454 packages in 2m
    
    ✓ Frontend instalado com sucesso!

[✓] Atualizando browserslist...
    ✓ Atualizado com sucesso!

======================================================
    INSTALAÇÃO CONCLUÍDA COM SUCESSO! ✓
======================================================

Deseja iniciar o Estoque Fácil agora? (S/N):
```

### 4.2 Entendendo as Mensagens

**Mensagens que você pode ver:**

**🟢 Sucesso:**
```
[✓] Algo foi feito com sucesso!
✓ Instalado com sucesso!
```
Tudo OK! Continue aguardando.

**🟡 Informação:**
```
[*] Instalando algo...
Isso pode demorar alguns minutos...
```
Normal! Aguarde pacientemente.

**🔴 Erro:**
```
[ERRO] Node.js não encontrado
[ERRO] Falha ao instalar dependências
```
Veja a seção [Problemas Comuns](#6-problemas-comuns-e-soluções)

### 4.3 Tempo de Instalação

**Tempo aproximado:**
- 🚀 Internet rápida (100 Mbps+): 3-5 minutos
- 🐢 Internet média (10-50 Mbps): 5-10 minutos
- 🐌 Internet lenta: 10-20 minutos

**O que está acontecendo?**
O sistema está baixando centenas de "bibliotecas" (pedacinhos de código prontos) que o Estoque Fácil usa. É normal demorar!

### 4.4 Após a Instalação

Quando tudo terminar, você verá:

```
Deseja iniciar o Estoque Fácil agora? (S/N):
```

**Opções:**
- Digite `S` e pressione `Enter` → Sistema inicia automaticamente
- Digite `N` e pressione `Enter` → Fecha e você inicia depois manualmente

**Recomendação:** Digite `S` para testar imediatamente!

---

## 5. Usando o Sistema

### 5.1 Iniciando o Estoque Fácil

**Sempre que quiser abrir o sistema:**

**Passo 1:** Navegue até a pasta
```
C:\Estoque-Facil\
```

**Passo 2:** Dê duplo clique em:
```
executar-estoque-facil.bat
```

**Passo 3:** Aguarde as janelas abrirem
Você verá **2 janelas pretas** (não feche!):
- **Janela 1:** Backend (servidor) - porta 5000
- **Janela 2:** Frontend (interface) - porta 3000

**Mensagens esperadas:**

**Janela Backend:**
```
======================================================
    ESTOQUE FÁCIL - BACKEND INICIANDO
======================================================
✅ Servidor rodando na porta 5000
✅ Conectado ao MongoDB
```

**Janela Frontend:**
```
======================================================
    ESTOQUE FÁCIL - FRONTEND INICIANDO
======================================================
Compiled successfully!
Local:            http://localhost:3000
```

**Passo 4:** Navegador abre automaticamente
- O sistema vai abrir automaticamente em seu navegador padrão
- URL: `http://localhost:3000`
- Você verá a tela de login do Estoque Fácil

**✅ Se ver a tela de login, está funcionando!**

### 5.2 Criando Sua Primeira Conta

Na primeira vez, você precisa criar uma conta:

**Passo 1:** Na tela de login, clique em:
```
"Criar Conta" ou "Registrar-se"
```

**Passo 2:** Preencha o formulário:
```
Nome completo: [Seu Nome]
E-mail: [seu@email.com]
Senha: [mínimo 6 caracteres]
Confirmar senha: [mesma senha]
```

**Passo 3:** Clique em "Registrar"

**Passo 4:** Faça login com suas credenciais

**IMPORTANTE:** A primeira conta criada precisa ser promovida a administrador! Veja a próxima seção.

### 5.3 Tornando-se Administrador

**Por padrão, novas contas são criadas como "Funcionário"**. Para ter acesso total, você precisa ser "Admin".

**Método 1 - MongoDB Atlas (se o .env usa Atlas):**

1. Acesse: https://cloud.mongodb.com
2. Faça login com as credenciais fornecidas
3. Clique em "Browse Collections"
4. Selecione banco: `estoque-facil`
5. Selecione coleção: `usuarios`
6. Encontre seu usuário (pelo email)
7. Clique no ícone de lápis (editar)
8. Mude o campo `perfil` de `"funcionario"` para `"admin"`
9. Clique em "Update"

**Método 2 - Usando script (se tiver MongoDB local):**

Se o administrador configurou MongoDB local, ele pode fornecer um script de promoção.

**Método 3 - Peça ao administrador:**

Se você não tem acesso ao MongoDB, peça para o administrador do sistema promovê-lo.

### 5.4 Navegando pelo Sistema

Após fazer login como admin, você verá:

**📊 Dashboard (Página Inicial):**
- Resumo de produtos, estoque e vendas
- Gráficos coloridos
- Alertas de estoque baixo

**Menu Lateral:**
- 🏠 Dashboard
- 📦 Produtos
- 🔄 Movimentação
- 💰 Vendas
- 📊 Relatórios
- 👥 Usuários (só admin)

**Para saber como usar cada funcionalidade, consulte:**
- [GUIA_INSTALACAO_USO.md](GUIA_INSTALACAO_USO.md) - Guia completo de uso

### 5.5 Encerrando o Sistema

**Para fechar o Estoque Fácil:**

**Passo 1:** Feche o navegador (ou aba do sistema)

**Passo 2:** Nas 2 janelas pretas que ficaram abertas:
- Clique no X (fechar)
- Ou pressione `Ctrl + C` e depois `Y`

**Passo 3:** Confirme o fechamento

**IMPORTANTE:** Sempre feche as janelas corretamente! Não force o fechamento do computador com o sistema aberto.

---

## 6. Problemas Comuns e Soluções

### ❌ Problema 1: "Node.js não encontrado"

**Mensagem de erro:**
```
[ERRO] Node.js não está instalado ou não está no PATH
```

**Solução:**

**Opção 1 - Instalar Node.js:**
- Volte para [Seção 2](#2-instalando-o-nodejs)
- Siga todos os passos de instalação
- **IMPORTANTE:** Marque "Add to PATH" durante a instalação

**Opção 2 - Adicionar ao PATH manualmente:**
1. Pressione `Windows` + `Pause/Break`
2. Clique em "Configurações avançadas do sistema"
3. Clique em "Variáveis de Ambiente"
4. Em "Variáveis do sistema", encontre "Path"
5. Clique em "Editar"
6. Clique em "Novo"
7. Adicione: `C:\Program Files\nodejs\`
8. Clique em "OK" em todas as janelas
9. **Feche e abra novamente o Prompt de Comando**
10. Teste: `node --version`

### ❌ Problema 2: "npm install falhou"

**Mensagem de erro:**
```
[ERRO] Falha ao instalar dependências
npm ERR! ...
```

**Possíveis causas e soluções:**

**Causa 1 - Sem internet:**
- Verifique sua conexão com a internet
- Tente novamente com internet estável

**Causa 2 - Antivírus bloqueando:**
- Temporariamente desative o antivírus
- Execute `instalacao_inicial.bat` novamente
- Reative o antivírus após instalação

**Causa 3 - Pasta node_modules corrompida:**
1. Delete as pastas:
   - `backend\node_modules`
   - `frontend\node_modules`
2. Execute `instalacao_inicial.bat` novamente

**Causa 4 - Cache do NPM corrompido:**
Abra o Prompt de Comando e execute:
```
npm cache clean --force
```
Depois execute `instalacao_inicial.bat` novamente.

### ❌ Problema 3: "Porta 5000 já está em uso"

**Mensagem de erro:**
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solução:**

**Opção 1 - Fechar processo na porta 5000:**

1. Abra Prompt de Comando como administrador
2. Execute:
   ```
   netstat -ano | findstr :5000
   ```
3. Anote o número PID (última coluna)
4. Execute:
   ```
   taskkill /PID [número] /F
   ```
   (substitua [número] pelo PID que você anotou)

**Opção 2 - Mudar a porta no .env:**
1. Abra `backend\.env`
2. Mude `PORT=5000` para `PORT=5001`
3. Salve o arquivo
4. Execute `executar-estoque-facil.bat` novamente

### ❌ Problema 4: "Erro ao conectar com MongoDB"

**Mensagem de erro:**
```
[ERRO] Erro ao conectar com MongoDB
```

**Possíveis causas e soluções:**

**Causa 1 - Internet instável (MongoDB Atlas):**
- Verifique sua conexão
- Aguarde alguns segundos e tente novamente

**Causa 2 - Credenciais incorretas no .env:**
- Abra `backend\.env`
- Verifique se `MONGODB_URI` está correto
- Confira usuário e senha
- Não deve ter espaços extras

**Causa 3 - IP não está na whitelist (Atlas):**
- Peça ao administrador para adicionar seu IP em MongoDB Atlas
- Ou configurar para aceitar qualquer IP (0.0.0.0/0)

### ❌ Problema 5: "Navegador não abre automaticamente"

**Solução:**

Abra manualmente seu navegador e digite:
```
http://localhost:3000
```

**Se aparecer erro "Site não pode ser acessado":**
- Verifique se as 2 janelas pretas estão abertas
- Aguarde 30 segundos e tente novamente
- Veja se há erros nas janelas pretas

### ❌ Problema 6: "Tela branca no navegador"

**Solução:**

**Opção 1 - Limpar cache:**
1. Pressione `Ctrl + Shift + Delete`
2. Marque "Imagens e arquivos em cache"
3. Clique em "Limpar dados"
4. Recarregue a página (`F5`)

**Opção 2 - Tentar outro navegador:**
- Chrome
- Edge
- Firefox

**Opção 3 - Modo anônimo:**
- `Ctrl + Shift + N` (Chrome)
- Tente acessar `http://localhost:3000`

### ❌ Problema 7: "Token inválido" após alguns dias

**Mensagem:**
```
Sessão expirada. Faça login novamente.
```

**Solução:**
Isso é normal! O token expira após 7 dias por segurança.
- Basta fazer login novamente
- Suas informações estão seguras

### ❌ Problema 8: Upload de imagem não funciona

**Solução:**

1. Verifique se a pasta existe:
   ```
   C:\Estoque-Facil\backend\uploads\produtos\
   ```

2. Se não existir, crie manualmente:
   - Clique com botão direito na pasta `backend`
   - Novo → Pasta
   - Nome: `uploads`
   - Dentro de `uploads`, crie outra pasta: `produtos`

3. Verifique permissões:
   - Clique com botão direito na pasta `uploads`
   - Propriedades → Segurança
   - Certifique-se que seu usuário tem permissão de escrita

---

## 7. Perguntas Frequentes

### ❓ 1. Preciso de internet para usar o sistema?

**Resposta:** Depende!

- ✅ **MongoDB Local:** Não precisa de internet depois de instalado
- ❌ **MongoDB Atlas (nuvem):** Precisa de internet sempre

Para saber qual você tem:
- Abra `backend\.env`
- Veja `MONGODB_URI`:
  - Se começa com `mongodb://localhost` → Local (sem internet)
  - Se começa com `mongodb+srv://` → Atlas (precisa internet)

### ❓ 2. Posso acessar de outro computador na rede?

**Resposta:** Sim, mas precisa configuração!

**Passos:**
1. Descubra o IP do computador servidor:
   ```
   ipconfig
   ```
   Anote o "Endereço IPv4" (ex: 192.168.1.100)

2. Edite `backend\.env`:
   ```
   FRONTEND_URL=http://192.168.1.100:3000
   ```

3. No outro computador, acesse:
   ```
   http://192.168.1.100:3000
   ```

**Importante:** O firewall pode bloquear. Consulte seu administrador de rede.

### ❓ 3. Quantos usuários podem usar ao mesmo tempo?

**Resposta:** Ilimitado! O sistema suporta múltiplos usuários simultâneos.

**Observação:** O computador servidor precisa ter recursos suficientes (RAM e CPU).

### ❓ 4. Como fazer backup dos dados?

**MongoDB Atlas:**
- Acesse: https://cloud.mongodb.com
- Vá em "Clusters" → "..." → "Export Data"

**MongoDB Local:**
- Abra Prompt de Comando
- Execute:
  ```
  mongodump --db estoque-facil --out C:\backup-estoque
  ```

**Recomendação:** Faça backup semanal!

### ❓ 5. Posso mudar o nome/logo do sistema?

**Resposta:** Sim, mas requer conhecimento técnico de React/HTML/CSS.

Para alterações simples:
- Logo: Substitua `frontend\public\logo.png`
- Título: Edite `frontend\public\index.html`

### ❓ 6. O sistema funciona no Mac ou Linux?

**Resposta:** Sim! Mas este guia é específico para Windows.

Para Mac/Linux:
- Os comandos `.bat` não funcionam
- Use comandos Shell equivalentes
- Consulte `GUIA_INSTALACAO_USO.md`

### ❓ 7. Como adicionar mais usuários?

**Resposta:**
1. Faça login como administrador
2. Vá em "Usuários" no menu
3. Clique em "+ Adicionar Usuário"
4. Preencha os dados
5. Escolha perfil: Admin ou Funcionário
6. Salve

### ❓ 8. Esqueci minha senha. E agora?

**Opções:**

**Opção 1 - Recuperação por email (se configurado):**
- Na tela de login, clique "Esqueci minha senha"
- Digite seu email
- Siga as instruções recebidas por email

**Opção 2 - Administrador reseta:**
- Peça para um administrador ir em "Usuários"
- Clicar no ícone de chave 🔑
- Definir nova senha

**Opção 3 - Resetar via MongoDB:**
- Administrador acessa MongoDB
- Deleta o usuário e recria

### ❓ 9. Posso personalizar categorias de produtos?

**Resposta:** Sim!

As categorias estão definidas no código. Para adicionar:
- Requer conhecimento de programação
- Consulte a documentação técnica
- Ou contrate um desenvolvedor

### ❓ 10. O sistema tem limite de produtos?

**Resposta:** Não! Você pode cadastrar quantos produtos quiser.

**Observação sobre performance:**
- Até 10.000 produtos: Excelente
- 10.000 - 50.000: Bom
- Acima de 50.000: Pode precisar otimização

---

## 8. Dicas Importantes

### 💡 Dica 1: Sempre Use o Script executar-estoque-facil.bat

**Não tente iniciar manualmente!** O script faz tudo certo:
- Inicia backend e frontend na ordem correta
- Verifica se portas estão livres
- Mostra mensagens de erro úteis
- Abre o navegador automaticamente

### 💡 Dica 2: Não Feche as Janelas Pretas

Enquanto estiver usando o sistema:
- ✅ Mantenha as 2 janelas pretas abertas
- ❌ NÃO feche
- ❌ NÃO minimize (pode, mas não feche)

Se fechar acidentalmente:
- Sistema para de funcionar
- Execute `executar-estoque-facil.bat` novamente

### 💡 Dica 3: Faça Backup Regularmente

**Frequência recomendada:**
- ⭐ Diariamente: Se usa intensivamente
- ⭐ Semanalmente: Uso moderado
- ⭐ Mensalmente: Uso leve

**O que pode acontecer sem backup:**
- Computador quebra → Perde tudo 😱
- Erro humano (deletou por engano)
- Vírus ou ransomware

### 💡 Dica 4: Use Senhas Fortes

**Senha FRACA ❌:**
- senha123
- 123456
- admin

**Senha FORTE ✅:**
- Mín minimo 8 caracteres
- Mistura letras, números e símbolos
- Exemplo: `Est0qu3@2024!`

### 💡 Dica 5: Não Compartilhe Credenciais

**Cada pessoa deve ter sua própria conta:**
- ✅ Rastreabilidade: Sabe quem fez o quê
- ✅ Segurança: Senha exposta afeta só 1 pessoa
- ✅ Permissões: Admin vs Funcionário

### 💡 Dica 6: Atualize o Sistema Regularmente

Se o desenvolvedor enviar uma nova versão:
1. Faça backup completo primeiro!
2. Extraia a nova versão em outra pasta
3. Copie o arquivo `.env` antigo para a nova pasta
4. Execute `instalacao_inicial.bat` na nova pasta
5. Teste antes de apagar a versão antiga

### 💡 Dica 7: Monitor o Uso de Recursos

**Se o sistema ficar lento:**

**Verifique no Gerenciador de Tarefas:**
- Pressione `Ctrl + Shift + Esc`
- Veja se Node.js está usando muita CPU/RAM
- Reinicie o sistema se necessário

**Sinais de que precisa mais recursos:**
- Sistema trava frequentemente
- Relatórios demoram mais de 10 segundos
- Janelas pretas mostram "out of memory"

**Solução:** Adicionar mais RAM ao computador

### 💡 Dica 8: Mantenha o Windows Atualizado

- Sistema operacional atualizado = menos bugs
- Windows Update: Deixe automático
- Drivers atualizados: Melhor desempenho

### 💡 Dica 9: Use Antivírus, Mas Configure Exceções

**Antivírus pode causar lentidão!**

**Adicione exceções para:**
- `C:\Estoque-Facil\`
- `C:\Program Files\nodejs\`

**Como adicionar exceção (Windows Defender):**
1. Windows Security
2. Proteção contra vírus e ameaças
3. Gerenciar configurações
4. Exclusões → Adicionar ou remover exclusões
5. Adicionar as pastas acima

### 💡 Dica 10: Documente Seu Uso

**Crie um documento simples com:**
- ✅ Usuário e senha de acesso ao MongoDB Atlas
- ✅ Informações de contato do desenvolvedor/suporte
- ✅ Data da última instalação/atualização
- ✅ Problemas comuns e como você resolveu
- ✅ Customizações feitas

**Onde guardar:**
- Arquivo Word/PDF
- Pasta do projeto: `C:\Estoque-Facil\CONFIGURACOES_MINHA_EMPRESA.txt`

---

## 🎯 Checklist Rápido

Use esta lista para garantir que fez tudo:

**Antes de instalar:**
- [ ] Baixei e instalei Node.js v18+
- [ ] Extraí o ZIP em `C:\Estoque-Facil`
- [ ] Verifiquei que arquivo `.env` existe em `backend\`
- [ ] Tenho permissões de administrador

**Instalação:**
- [ ] Executei `instalacao_inicial.bat`
- [ ] Aguardei a instalação terminar (pode demorar!)
- [ ] Vi a mensagem "INSTALAÇÃO CONCLUÍDA COM SUCESSO"

**Primeiro uso:**
- [ ] Executei `executar-estoque-facil.bat`
- [ ] Vi 2 janelas pretas abrirem
- [ ] Navegador abriu automaticamente em `http://localhost:3000`
- [ ] Criei minha conta
- [ ] Promovi minha conta a administrador
- [ ] Fiz login como admin

**Segurança:**
- [ ] Usei senha forte
- [ ] Anotei minhas credenciais em local seguro
- [ ] Configurei backup regular

**Uso contínuo:**
- [ ] Sei onde está `executar-estoque-facil.bat`
- [ ] Sei que não devo fechar as janelas pretas
- [ ] Sei como fazer logout
- [ ] Sei como criar novos usuários

---

## 📞 Precisa de Ajuda?

Se você:
- ✅ Seguiu todos os passos deste guia
- ✅ Tentou as soluções de problemas comuns
- ✅ Ainda assim não consegue fazer funcionar

**Entre em contato com:**
- 👨‍💻 Desenvolvedor/Suporte: [informações fornecidas separadamente]
- 📧 Email de suporte: [se disponível]
- 📱 WhatsApp/Telefone: [se disponível]

**Ao pedir ajuda, informe:**
1. Qual o problema específico
2. Mensagens de erro (tire foto da tela)
3. O que você já tentou fazer
4. Versão do Windows
5. Versão do Node.js (`node --version`)

---

## 📚 Próximos Passos

Agora que o sistema está instalado e funcionando:

1. 📖 **Leia o guia de uso completo:**
   - Abra: `GUIA_INSTALACAO_USO.md`
   - Aprenda todas as funcionalidades

2. 🎓 **Treine sua equipe:**
   - Crie contas para cada funcionário
   - Mostre as funcionalidades principais
   - Deixe este guia disponível para consulta

3. 📊 **Comece simples:**
   - Cadastre alguns produtos de teste
   - Faça algumas vendas de teste
   - Gere um relatório simples
   - Quando se sentir confortável, comece a usar de verdade

4. 🔒 **Configure backup:**
   - Defina rotina de backup
   - Teste restaurar um backup
   - Documente o processo

5. 💼 **Aproveite o sistema:**
   - Explore todas as funcionalidades
   - Descubra como ele pode facilitar seu trabalho
   - Sugira melhorias ao desenvolvedor

---

**Boa sorte com o Estoque Fácil! 🚀**

Este sistema foi desenvolvido para facilitar sua vida. Com o tempo, você vai perceber quanto tempo e trabalho ele economiza.

---

**Documento criado em:** Dezembro 2024  
**Versão do Guia:** 1.0  
**Sistema:** Estoque Fácil v1.0  
**Plataforma:** Windows 10/11
