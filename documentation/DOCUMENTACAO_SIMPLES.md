# Documentação Técnica - Sistema Estoque Fácil
## Trabalho de Conclusão de Curso (TCC)

---

## 📑 Índice

1. [História e Conceptualização do Projeto](#1-história-e-conceptualização-do-projeto)
2. [O Que É o Sistema e Como Funciona](#2-o-que-é-o-sistema-e-como-funciona)
3. [As Tecnologias Utilizadas - Explicadas Simplesmente](#3-as-tecnologias-utilizadas---explicadas-simplesmente)
4. [Como o Sistema Foi Construído](#4-como-o-sistema-foi-construído)
5. [Organização e Armazenamento dos Dados](#5-organização-e-armazenamento-dos-dados)
6. [Como o Sistema Se Comunica Internamente](#6-como-o-sistema-se-comunica-internamente)
7. [A Interface e Como as Pessoas Usam o Sistema](#7-a-interface-e-como-as-pessoas-usam-o-sistema)
8. [Segurança - Protegendo Suas Informações](#8-segurança---protegendo-suas-informações)
9. [Jornada de Uma Venda no Sistema](#9-jornada-de-uma-venda-no-sistema)
10. [Evolução e Melhorias Durante o Desenvolvimento](#10-evolução-e-melhorias-durante-o-desenvolvimento)
11. [Conclusão e Próximos Passos](#11-conclusão-e-próximos-passos)

---

## 1. História e Conceptualização do Projeto

### 1.1 A Ideia Inicial

Imagine uma pequena loja que ainda controla seu estoque em cadernos ou planilhas do Excel. O dono precisa anotar manualmente cada produto que entra, cada venda que acontece, e conferir constantemente se ainda tem produtos disponíveis. É trabalhoso, demorado, e muito fácil de cometer erros. Um simples erro de digitação pode fazer parecer que há mais produtos do que realmente existe, causando problemas nas vendas.

Foi pensando nessa dificuldade que o **Estoque Fácil** nasceu. A ideia era criar uma ferramenta digital que funcionasse como um **assistente inteligente para gerenciar estoques**, substituindo cadernos e planilhas por um sistema automático, confiável e fácil de usar.

### 1.2 O Que Queríamos Resolver

O projeto começou com uma proposta clara:

> "Desenvolver uma plataforma para controle de estoque e geração de relatórios, feita para o mercado brasileiro, que permita gerenciar produtos em diferentes locais, registrar vendas automaticamente, e gerar relatórios profissionais."

**Funcionalidades essenciais planejadas:**

- **Sistema de Login Básico**: Para que cada funcionário tenha seu próprio acesso e o administrador possa controlar quem vê o quê
- **Cadastro de Produtos**: Com código automático, para que não seja preciso inventar códigos manualmente
- **Controle Multi-Local**: Porque muitas empresas têm mais de um depósito ou loja
- **Registro de Vendas**: Que diminua o estoque automaticamente quando uma venda acontece
- **Consultas e Verificações**: Para saber quais produtos vendem mais, quais estão parados, e quais estão acabando
- **Relatórios Profissionais**: Que possam ser exportados em PDF e impressos

### 1.3 Por Que Este Sistema é Diferente

O **Estoque Fácil** foi projetado pensando especificamente no contexto brasileiro:

- **Interface em Português**: Sem termos técnicos em inglês que possam confundir
- **Simplicidade**: Uma pessoa sem conhecimento de computação avançado consegue usar
- **Acessível**: Pode ser instalado em computadores comuns, sem precisar de servidores caros
- **Completo**: Tem tudo que uma pequena ou média empresa precisa, desde o controle básico até relatórios detalhados

### 1.4 Como o Projeto Evoluiu

Durante o desenvolvimento, descobrimos várias situações que não tínhamos previsto inicialmente. Por exemplo:

**Descoberta 1 - Múltiplos Usuários Simultâneos**: Percebemos que várias pessoas poderiam querer registrar vendas ao mesmo tempo. Isso nos levou a implementar um sistema de cache inteligente que mantém os dados atualizados para todos.

**Descoberta 2 - Segurança**: Notamos que informações de estoque são dados sensíveis para uma empresa. Implementamos várias camadas de proteção, como senhas criptografadas e tokens de segurança.

**Descoberta 3 - Velocidade**: Algumas operações, como gerar relatórios com muitos dados, inicialmente eram lentas. Otimizamos o sistema para que mesmo com milhares de produtos e vendas, tudo funcionasse rápido.

**Descoberta 4 - Erros Humanos**: Percebemos que as pessoas poderiam digitar números negativos ou tentar vender mais produtos do que existem no estoque. Adicionamos validações automáticas para prevenir esses erros.

Cada uma dessas descobertas nos fez melhorar o sistema, transformando uma ideia simples em uma solução robusta e profissional.

---

## 2. O Que É o Sistema e Como Funciona

### 2.1 Descrição Simples

O **Estoque Fácil** é como um **gerente de estoque digital** que trabalha 24 horas por dia, nunca esquece de nada, e consegue fazer cálculos instantâneos. Imagine que você tem um assistente superinteligente que:

- **Lembra de cada produto**: Quantos você tem, onde estão guardados, quando compraram, quando venderam
- **Atualiza tudo automaticamente**: Quando você registra uma venda, ele já diminui a quantidade no estoque
- **Avisa quando algo está acabando**: "Ei, só restam 5 unidades deste produto!"
- **Mostra relatórios bonitos**: Com gráficos coloridos que são fáceis de entender
- **Funciona em qualquer dispositivo**: Computador, tablet ou celular

### 2.2 Como Funciona na Prática

Vamos usar uma analogia simples. Imagine que o sistema é como uma **loja física com 3 áreas diferentes**:

#### 🏢 Área 1: O Escritório (Frontend/Interface)
É onde você e seus funcionários trabalham. Tem uma recepção bonita com balcões e computadores. Aqui você:
- Vê as prateleiras (lista de produtos) em uma tela
- Aperta botões para registrar vendas
- Consulta relatórios em gráficos coloridos
- **Tecnologia usada**: React (explicado mais adiante)

#### 📞 Área 2: O Departamento de Atendimento (Backend/Servidor)
É como o cérebro da operação. Fica nos "fundos da loja" e processa todos os pedidos. Quando você clica em "Registrar Venda" no escritório:
1. O pedido vai para este departamento
2. Ele verifica: "Tem produto suficiente?"
3. Se sim, ele registra a venda
4. Atualiza o estoque
5. Manda uma confirmação de volta para o escritório
- **Tecnologia usada**: Node.js com Express (explicado mais adiante)

#### 📚 Área 3: O Arquivo (Banco de Dados)
É como uma biblioteca gigante onde guardamos todas as informações em pastas organizadas:
- Uma pasta para "Produtos"
- Uma pasta para "Vendas"
- Uma pasta para "Usuários"
- **Tecnologia usada**: MongoDB (explicado mais adiante)

**Como essas 3 áreas conversam entre si:**

```
Você digita "Vender 5 notebooks" → 
O Escritório manda o pedido → 
O Departamento processa e confere o Arquivo →
O Arquivo confirma "Sim, tem 10 notebooks" →
O Departamento registra a venda e atualiza para 5 notebooks →
O Escritório mostra "Venda registrada com sucesso! ✅"
```

Tudo isso acontece em menos de 1 segundo!

### 2.3 Diagrama Visual Simplificado

Imagine o sistema como uma casa de 3 andares:

```
┌─────────────────────────────────────────┐
│  🎨 3º ANDAR - Interface (Frontend)     │
│  Onde as pessoas trabalham              │
│  - Botões, formulários, gráficos        │
│  - React cria as "telas" do sistema     │
└───────────────┬─────────────────────────┘
                │ ↕ Internet
┌───────────────▼─────────────────────────┐
│  🧠 2º ANDAR - Servidor (Backend)       │
│  O cérebro que processa tudo            │
│  - Recebe pedidos do 3º andar           │
│  - Processa lógica e regras             │
│  - Node.js + Express fazem isso         │
└───────────────┬─────────────────────────┘
                │ ↕ Consultas
┌───────────────▼─────────────────────────┐
│  📁 1º ANDAR - Banco de Dados           │
│  Onde guardamos todas as informações    │
│  - Produtos, vendas, usuários, etc      │
│  - MongoDB é como um armário gigante    │
└─────────────────────────────────────────┘
```

---

## 3. As Tecnologias Utilizadas - Explicadas Simplesmente

Agora vamos explicar **cada** tecnologia que usamos, de forma que qualquer pessoa entenda. Imagine que estamos explicando para alguém que nunca programou na vida.

### 3.1 MongoDB - O Armário Digital

**O que é?** MongoDB é o nosso banco de dados. Pense nele como um **armário de arquivo gigante**, onde cada gaveta guarda um tipo diferente de informação.

**Analogia Simples:**
Imagine um armário físico em um escritório:
- **Gaveta 1 (Produtos)**: Fichas com informações de cada produto (nome, código, categoria)
- **Gaveta 2 (Vendas)**: Registros de todas as vendas feitas
- **Gaveta 3 (Usuários)**: Cadastro de cada funcionário que usa o sistema
- **Gaveta 4 (Estoque)**: Fichas mostrando quantos produtos há em cada local

O MongoDB faz exatamente isso, mas de forma digital. Em vez de papel, usa documentos eletrônicos.

**Por que escolhemos MongoDB?**
1. **Flexível como uma pasta elástica**: Se precisarmos adicionar mais informações em uma ficha (por exemplo, adicionar "data de validade" aos produtos), é fácil fazer isso sem bagunçar tudo
2. **Rápido**: Encontra informações em milissegundos, mesmo com milhares de fichas
3. **Fala a mesma língua do resto do sistema**: Trabalha com JavaScript, a mesma linguagem que usamos no resto do projeto

**Como funciona na prática:**
Quando você cadastra um produto novo, o MongoDB cria uma "ficha digital" assim:

```javascript
// Uma ficha de produto no MongoDB
{
  nome: "Notebook Dell Inspiron",
  codigo: "ABCD01",
  categoria: "Informática",
  estoque: 50 unidades
}
```

**Alternativas que não escolhemos:**
- **MySQL/PostgreSQL**: São como arquivos com tabelas rígidas. Se você quiser adicionar uma nova coluna, é complicado. É como usar fichários de metal fixos em vez de pastas flexíveis.

### 3.2 Node.js - O Motor que Faz Tudo Funcionar

**O que é?** Node.js é a tecnologia que permite que o nosso servidor funcione. Pense nele como o **motor de um carro**.

**Analogia Simples:**
Imagine que seu computador é uma fábrica:
- **Trabalhadores (programas normais)**: Fazem uma tarefa por vez, como um caixa de banco que atende uma pessoa de cada vez
- **Node.js (trabalhador multitarefa)**: É como um garçom experiente que anota pedidos de várias mesas ao mesmo tempo, leva os pratos, traz a conta, tudo "ao mesmo tempo"

**Por que isso é importante para o Estoque Fácil?**
Imagine 10 funcionários usando o sistema ao mesmo tempo:
- Funcionário 1 está registrando uma venda
- Funcionário 2 está cadastrando um produto
- Funcionário 3 está gerando um relatório

O Node.js consegue fazer tudo isso simultaneamente sem travar! É como ter um assistente super rápido que consegue atender vários pedidos ao mesmo tempo.

**Por que escolhemos Node.js?**
1. **Rápido e eficiente**: Processa muitas operações ao mesmo tempo
2. **Usa JavaScript**: A mesma linguagem do frontend, então não precisamos aprender outra linguagem
3. **Muito popular**: Milhões de programadores usam, então há muitas soluções prontas disponíveis

### 3.3 Express.js - O Organizador de Pedidos

**O que é?** Express é uma ferramenta que funciona junto com o Node.js. É como um **gerente que organiza todos os pedidos** que chegam ao sistema.

**Analogia Simples:**
Imagine uma pizzaria:
- **Cliente (Frontend)**: Faz um pedido: "Quero uma pizza de calabresa"
- **Atendente (Express)**: Recebe o pedido, anota certinho, manda para a cozinha
- **Cozinheiro (Node.js)**: Prepara a pizza
- **Atendente (Express) novamente**: Pega a pizza pronta e entrega ao cliente

O Express organiza tudo para que os pedidos não se percam e cheguem no lugar certo.

**Por que escolhemos Express?**
1. **Simples de usar**: Como um gerente eficiente, não complica as coisas
2. **Flexível**: Podemos adicionar "regras" facilmente (tipo: "só pode vender se tiver estoque")
3. **Bem testado**: Milhões de sistemas usam, então sabemos que funciona bem

**Exemplo na prática:**
Quando você clica em "Cadastrar Produto", o Express:
1. Recebe a informação: "Nome: Notebook, Preço: R$ 3.000"
2. Verifica: "O usuário está logado? Sim ✓"
3. Verifica: "Os dados estão corretos? Sim ✓"
4. Manda para o Node.js salvar no MongoDB
5. Responde: "Produto cadastrado com sucesso!"

### 3.4 React - O Construtor de Interfaces

**O que é?** React é a tecnologia que cria as telas que você vê no navegador. É como um **arquiteto que constrói a casa** onde você trabalha.

**Analogia Simples:**
Pense no React como **blocos de montar LEGO**:
- Cada botão é um bloco
- Cada formulário é um conjunto de blocos
- A página inteira é construída juntando esses blocos

Se você precisa mudar apenas um botão, troca só aquele bloco, sem derrubar a casa inteira!

**Por que isso é importante?**
Imagine que você está vendo a lista de produtos e, ao mesmo tempo, alguém cadastra um produto novo. Com o React:
- A lista se atualiza automaticamente
- Você vê o novo produto aparecer
- **Sem precisar recarregar a página toda**

É como se sua janela se atualizasse automaticamente para mostrar o que está acontecendo lá fora, sem você precisar abrir e fechar a janela toda hora.

**Por que escolhemos React?**
1. **Rápido**: Só atualiza o que mudou, não a página toda
2. **Reutilizável**: Criamos um botão uma vez, usamos em vários lugares
3. **Popular**: A maioria dos sites modernos usa React ou algo parecido
4. **Rico em recursos**: Há milhares de "peças prontas" que podemos usar

**Exemplo na prática:**
A tela de "Lista de Produtos" é construída assim:

```
Página inteira
├── Cabeçalho (mostra "Estoque Fácil")
├── Menu Lateral (botões: Dashboard, Produtos, Vendas...)
└── Área Principal
    ├── Título: "Produtos"
    ├── Botão: "+ Adicionar Produto"
    └── Tabela de produtos
        ├── Linha 1: Notebook
        ├── Linha 2: Mouse
        └── Linha 3: Teclado
```

Cada uma dessas partes é um "componente" React que pode ser reutilizado em outras páginas.

### 3.5 A Stack MERN - Todos Trabalhando Juntos

Chamamos de "Stack MERN" porque usamos:
- **M**ongoDB (banco de dados)
- **E**xpress (organizador de pedidos)
- **R**eact (construtor de telas)
- **N**ode.js (motor que faz tudo funcionar)

**Por que essas 4 tecnologias trabalham tão bem juntas?**

Todas usam **JavaScript**, então é como se todos falassem a mesma língua! Imagine uma empresa onde:
- O recepcionista fala português
- O gerente fala espanhol  
- O contador fala inglês

Seria complicado, certo? Com MERN, todos falam JavaScript, facilitando muito!

### 3.6 Bibliotecas Auxiliares - Os Ajudantes Especializados

Além das 4 tecnologias principais, usamos vários "ajudantes especializados" - bibliotecas que fazem tarefas específicas. Vamos explicar os principais:

#### 🔒 Bcrypt - O Cofre de Senhas

**O que faz:** Transforma senhas em códigos impossíveis de decifrar.

**Analogia:** Imagine que sua senha é "senha123". O Bcrypt pega isso e transforma em algo como:
```
$2b$12$KIXKJVDxJkLmNQXVhJKLVeUYG7KJVD...
```

É como pegar uma receita de bolo e transformar em hieróglifos egípcios. Mesmo se alguém roubar nosso banco de dados, não consegue descobrir as senhas!

**Por que 12 rounds?** É o nível de embaralhamento. Quanto maior, mais seguro, mas também mais demorado. 12 é o equilíbrio perfeito: muito seguro, mas rápido o suficiente (cerca de 0,25 segundos).

#### 🎫 JSON Web Token (JWT) - O Passe VIP

**O que faz:** Cria um "passe VIP" digital quando você faz login.

**Analogia:** Quando você vai a um show e compra ingresso:
1. Você mostra seu documento (login)
2. Recebe uma pulseirinha VIP (token JWT)
3. Toda vez que quer entrar em uma área, só mostra a pulseirinha
4. Não precisa mostrar documento de novo

O JWT funciona assim no sistema! Você faz login uma vez, recebe um token, e usa ele nas próximas 7 dias sem precisar fazer login de novo.

#### 📊 Chart.js - O Desenhista de Gráficos

**O que faz:** Cria aqueles gráficos bonitos e coloridos nos relatórios.

**Analogia:** É como ter um artista gráfico que pega números chatos:
```
Janeiro: 100 vendas
Fevereiro: 150 vendas
Março: 120 vendas
```

E transforma em um gráfico bonito de barras coloridas que mostra visualmente como as vendas evoluíram!

#### 🎨 React Toastify - O Mensageiro Amigável

**O que faz:** Mostra aquelas notificações que aparecem no canto da tela.

**Analogia:** Como aquelas notificações do celular:
- 🟢 Verde: "Produto cadastrado com sucesso!"
- 🔴 Vermelho: "Erro: Estoque insuficiente"
- 🟡 Amarelo: "Atenção: Estoque baixo!"

É uma forma amigável de comunicar o que está acontecendo.

#### 🛡️ Helmet - O Guarda de Segurança

**O que faz:** Adiciona proteções extras ao sistema.

**Analogia:** É como ter um guarda na porta que:
- Verifica se ninguém está tentando roubar informações
- Bloqueia tentativas de invasão
- Adiciona travas extras nas portas

Tudo acontece automaticamente nos "bastidores" do sistema.

#### ⏱️ Express Rate Limit - O Controlador de Acesso

**O que faz:** Evita que alguém tente entrar no sistema milhares de vezes por segundo (ataque hacker).

**Analogia:** É como a porta giratória de um banco:
- Permite passar 1 pessoa de cada vez
- Se alguém tentar forçar a passagem muito rápido, trava
- Se tentar fazer login errado 5 vezes, bloqueia por 15 minutos

**Regras do sistema:**
- Máximo 100 requisições por IP a cada 15 minutos (uso normal)
- Máximo 5 tentativas de login a cada 15 minutos (proteção contra roubo de senha)

#### 📄 PDFKit - O Impressor de Relatórios

**O que faz:** Transforma os dados e gráficos em arquivos PDF profissionais.

**Analogia:** É como ter uma gráfica dentro do sistema. Você pede "Quero um relatório de vendas do mês" e ele:
1. Pega todos os dados
2. Organiza bonitinho
3. Adiciona gráficos
4. Cria um PDF pronto para imprimir ou enviar por email

---

## 4. Como o Sistema Foi Construído

Agora vamos explicar **como** organizamos o código do sistema. Pense nisso como explicar como construímos uma casa, desde os alicerces até o telhado.

### 4.1 A Arquitetura MVC - Dividir para Conquistar

Organizamos o código usando um padrão chamado MVC (Model-View-Controller). Vamos explicar com uma analogia de restaurante:

#### 📋 Model (Modelo) - As Receitas

**O que é:** São as "receitas" que definem como os dados devem ser.

**Analogia de Restaurante:** O cardápio que define:
- Uma pizza tem: tamanho, sabor, borda
- Um suco tem: fruta, tamanho
- Uma sobremesa tem: tipo, temperatura

No nosso sistema, definimos:
- Um produto tem: nome, código, categoria, imagem
- Uma venda tem: produto, quantidade, data
- Um usuário tem: nome, email, senha, perfil (admin ou funcionário)

**Exemplo real do código:**
```javascript
// Receita de como deve ser um usuário
Usuario {
  nome: texto obrigatório,
  email: texto único,
  senha: texto criptografado,
  perfil: "admin" ou "funcionario"
}
```

#### 🎭 View (Visão) - O Salão do Restaurante

**O que é:** É o que o cliente vê - no nosso caso, as telas do sistema.

**Analogia de Restaurante:** O salão decorado, com:
- Mesas arrumadas (formulários)
- Cardápio visual (listas de produtos)
- Garçons educados (mensagens de feedback)

No React, cada "página" que você vê é uma View.

#### 👨‍🍳 Controller (Controlador) - A Cozinha

**O que é:** É onde a "magia acontece" - processa os pedidos.

**Analogia de Restaurante:** A cozinha onde:
- Chef recebe pedido: "1 pizza calabresa"
- Verifica se tem ingredientes (validação)
- Prepara a pizza (processa)
- Manda para o garçom entregar (resposta)

**Exemplo real:**
Quando você clica em "Registrar Venda":
1. **Controller recebe:** "Vender 5 notebooks do depósito central"
2. **Controller verifica:** "Tem 5 notebooks lá? Sim, tem 10"
3. **Controller processa:** Registra venda, diminui estoque
4. **Controller responde:** "Venda registrada! Agora tem 5 notebooks"

### 4.2 Separação de Responsabilidades - Cada Um Com Seu Trabalho

Uma das coisas mais importantes em programação é **não misturar as coisas**. Imagine uma cozinha onde o chef também é o garçom, caixa e faxineiro. Seria uma bagunça!

No Estoque Fácil, separamos assim:

```
📁 Backend (Servidor)
├── 📂 models/          → Receitas dos dados
├── 📂 controllers/     → Cozinha (processa tudo)
├── 📂 routes/          → Cardápio (o que dá pra pedir)
├── 📂 middlewares/     → Segurança na porta
└── 📂 services/        → Tarefas especializadas

📁 Frontend (Interface)
├── 📂 pages/           → Páginas que você vê
├── 📂 components/      → Peças reutilizáveis (botões, formulários)
├── 📂 contexts/        → Memória compartilhada
└── 📂 services/        → Comunicação com o servidor
```

**Por que isso é importante?**
Se amanhã quisermos mudar a cor de um botão, mexemos só em `components/Botao.js`. Não precisamos mexer em 50 arquivos diferentes!

### 4.3 Middleware - Os Guardas do Sistema

Middleware é um conceito importante mas simples. Pense neles como **guardas de segurança em pontos estratégicos**.

**Analogia:** Imagine um prédio comercial:

```
Você quer entrar → Guarda 1: Verifica se você está na lista
                 → Guarda 2: Passa detector de metal
                 → Guarda 3: Confere sua bolsa
                 → Liberado! Pode passar
```

No sistema:

```
Pedido chega → Middleware 1: Verifica se está logado (auth.js)
            → Middleware 2: Valida os dados (validateResource.js)  
            → Middleware 3: Checa rate limit (rateLimit.js)
            → Liberado! Vai para o Controller processar
```

**Exemplo prático - Registrar uma venda:**

```javascript
// Rota para registrar venda
POST /api/vendas
  → auth (verifica se está logado)
  → validateResource (verifica se quantidade > 0)
  → vendaController.registrar (processa a venda)
```

Se você não estiver logado, nem chega no controller - o middleware `auth` já bloqueia!

### 4.4 React Query - O Cache Inteligente

Esta é uma das tecnologias mais interessantes que usamos. O React Query é como um **assistente com memória fotográfica**.

**Analogia:**
Imagine que você pergunta para alguém: "Quantos produtos temos?"
- **Sem React Query:** Essa pessoa vai até o depósito, conta tudo, volta e te responde (demora!)
- **Com React Query:** Essa pessoa lembra: "Há 5 minutos eram 150 produtos. Ninguém mexeu desde então, então ainda é 150!" (instantâneo!)

**Como funciona:**
1. Você abre a página de produtos
2. React Query busca no servidor: "Quais são os produtos?"
3. Guarda a resposta na memória (cache) por 5 minutos
4. Se você sair e voltar nessa página em 2 minutos, mostra instantaneamente da memória
5. Se alguém cadastrar um produto novo, o React Query é esperto - invalida o cache e busca de novo

**Benefícios:**
- ⚡ Sistema mais rápido
- 📶 Economiza internet
- 😊 Melhor experiência para o usuário

### 4.5 Custom Hooks - Truques Reutilizáveis

Hooks são como "truques mágicos" que criamos para fazer tarefas comuns de forma mais fácil.

**Analogia:**
Imagine que toda vez que você precisa fazer café:
1. Pegar o coador
2. Colocar o pó
3. Esquentar a água
4. Despejar devagar
5. Esperar coar

Com um "hook" seria: `useFazerCafe()` - faz tudo automaticamente!

**Exemplo real do sistema - useAuth:**

Sempre que uma página precisa saber "quem está logado?", em vez de escrever um monte de código, só usa:

```javascript
const { usuario, verificarPermissao } = useAuth();

// Pronto! Agora sei quem está logado
console.log(usuario.nome); // "João Silva"

// E posso verificar se pode fazer algo
if (verificarPermissao(['admin'])) {
  // Mostra botão de deletar produto
}
```

---

## 5. Organização e Armazenamento dos Dados

Agora vamos explicar como organizamos e guardamos todas as informações do sistema. Lembra da analogia do "armário com gavetas"? Vamos ver isso em detalhes.

### 5.1 O Armário Digital - Estrutura do MongoDB

O MongoDB organiza informações em **coleções** (gavetas) e **documentos** (fichas dentro das gavetas).

#### 📦 Coleção: produtos

**O que guarda:** Informações de cada produto da empresa.

**Como uma ficha de produto se parece:**

```javascript
{
  nome: "Notebook Dell Inspiron 15",
  codigo: "ABCD01",              // Gerado automaticamente
  tipo: "Eletrônico",
  categoria: "Informática",
  subcategoria: "Notebooks",
  imagem: "foto-notebook.jpg",
  criadoPor: "João Silva",       // Quem cadastrou
  dataCriacao: "10/12/2024"
}
```

**Analogia:** Como as fichas de uma biblioteca:
- Cada livro (produto) tem sua ficha
- Ficha diz: título, autor, prateleira onde está
- Bibliotecário (sistema) sabe onde encontrar cada livro

**Código único automático:**
O sistema gera códigos como "ABCD01", "XYZW99" automaticamente. Funciona assim:
- 4 letras maiúsculas aleatórias
- 2 números aleatórios
- Verifica se já existe, se sim, gera outro
- É como placa de carro, mas para produtos!

#### 📊 Coleção: estoques

**O que guarda:** Quantidade de cada produto em cada local.

**Como uma ficha de estoque se parece:**

```javascript
{
  produto: "Notebook Dell Inspiron 15",
  local: "Depósito Central",
  quantidade: 50,
  ultimaAtualizacao: "10/12/2024 14:30",
  atualizadoPor: "Maria Santos"
}
```

**Por que separamos estoque de produto?**
Porque um produto pode estar em vários locais ao mesmo tempo!

Exemplo:
- "Notebook Dell" no Depósito Central: 50 unidades
- "Notebook Dell" na Loja Shopping: 10 unidades  
- "Notebook Dell" na Filial Centro: 5 unidades
- **Total:** 65 unidades

**Regra importante:** Um produto só pode ter UMA ficha por local. Não dá para ter duas fichas de "Notebook no Depósito Central" - seria confusão!

#### 💰 Coleção: vendas

**O que guarda:** Registro de cada venda realizada.

```javascript
{
  produto: "Notebook Dell Inspiron 15",
  quantidade: 2,
  local: "Loja Shopping",
  dataVenda: "10/12/2024 16:45",
  vendidoPor: "Carlos Oliveira"
}
```

**O que acontece automaticamente quando registra uma venda:**
1. ✅ Cria este registro de venda
2. ✅ Diminui quantidade no estoque
3. ✅ Cria uma movimentação de "saída"
4. ✅ Atualiza os relatórios

Tudo em menos de 1 segundo!

#### 🔄 Coleção: movimentacoes

**O que guarda:** Histórico de tudo que aconteceu com cada produto.

```javascript
{
  tipo: "transferencia",         // entrada, saída ou transferência
  produto: "Notebook Dell",
  quantidade: 10,
  localOrigem: "Depósito Central",
  localDestino: "Loja Shopping",
  data: "09/12/2024 10:00",
  realizadoPor: "Ana Costa",
  observacao: "Transferência para inauguração da loja"
}
```

**Tipos de movimentação:**
- **Entrada**: Chegou produto novo (compras, devoluções)
- **Saída**: Produto saiu sem ser venda (perda, doação, uso interno)
- **Transferência**: Moveu de um local para outro

**Analogia:** É como um diário de tudo que acontece no estoque. Se alguém perguntar "O que aconteceu com aqueles 10 notebooks?", você consegue rastrear!

#### 👤 Coleção: usuarios

**O que guarda:** Cadastro de cada pessoa que usa o sistema.

```javascript
{
  nome: "João Silva",
  email: "joao@empresa.com",     // Único, usado para login
  senha: "$2b$12$...",            // Criptografada!
  perfil: "admin",                // ou "funcionario"
  dataCriacao: "01/11/2024",
  ativo: true                     // Pode ser desativado
}
```

**Diferença entre Admin e Funcionário:**

| O que pode fazer | Admin | Funcionário |
|-----------------|-------|-------------|
| Ver produtos | ✅ | ✅ |
| Registrar vendas | ✅ | ✅ |
| Ver relatórios | ✅ | ✅ |
| **Cadastrar produtos** | ✅ | ❌ |
| **Deletar produtos** | ✅ | ❌ |
| **Gerenciar usuários** | ✅ | ❌ |
| **Ver todos os relatórios** | ✅ | ❌ |

**Segurança das senhas:**
Nunca guardamos a senha real! Se alguém digitar "senha123", guardamos algo como:
```
$2b$12$KIXKJVDxJkLmNQXVhJKLVeUYG7KJVD...
```

É impossível voltar para "senha123". Quando a pessoa faz login, criptografamos o que ela digitou e comparamos com o que está guardado.

#### 📍 Coleção: locais

**O que guarda:** Cadastro de cada local de armazenamento.

```javascript
{
  nome: "Depósito Central",
  descricao: "Armazém principal - Rua X, 123",
  ativo: true
}
```

Você pode ter quantos locais quiser:
- Depósitos
- Lojas
- Filiais
- Estoque de reserva
- etc.

### 5.2 Como as Gavetas Se Relacionam

Aqui fica interessante! As "gavetas" conversam entre si através de referências.

**Analogia Simples:**
Imagine fichas de papel em um escritório antigo:
- Ficha de venda diz: "Produto: ver gaveta Produtos, código ABCD01"
- Você vai na gaveta de Produtos
- Encontra a ficha ABCD01
- Lê: "Notebook Dell Inspiron 15"

No MongoDB funciona igual! Uma venda guarda apenas o "código" do produto, não todas as informações do produto. Quando precisa mostrar o nome do produto na tela, o sistema vai "buscar na gaveta de produtos".

**Diagrama de Relacionamentos:**

```
    USUARIO
       │
       │ (cria)
       ↓
    PRODUTO ←─────┐
       │          │
       │ (tem)    │ (referencia)
       ↓          │
    ESTOQUE       │
    em LOCAIS     │
       │          │
       │ (gera)   │
       ↓          │
  MOVIMENTACOES ──┘
  e VENDAS
```

**Exemplo prático:**
Quando você abre a tela de vendas, o sistema:
1. Busca as vendas: "Vendeu produto X, quantidade 5"
2. Para cada venda, busca o produto: "Qual é o nome do produto X?"
3. Mostra na tela: "Vendeu 5 unidades de Notebook Dell"

Tudo automático e rápido!

---

## 6. Como o Sistema Se Comunica Internamente

Vamos entender como o frontend (o que você vê) conversa com o backend (o cérebro). É como entender como funciona uma central telefônica.

### 6.1 API REST - A Central de Atendimento

**O que é uma API?** API significa "Application Programming Interface", mas vamos esquecer esse nome técnico. Pense nela como uma **central de atendimento telefônico automatizada**.

**Analogia Completa:**

Imagine que você liga para uma empresa:
```
📞 Você: "Alô, gostaria de saber quantos produtos tenho em estoque"
🤖 Atendente (API): "Um momento... Você tem 150 produtos"
📞 Você: "Quero registrar uma venda de 5 notebooks"
🤖 Atendente (API): "Verificando estoque... Venda registrada com sucesso!"
```

No sistema funciona exatamente assim! O frontend "liga" para o backend pedindo coisas, e o backend responde.

### 6.2 Os "Números de Telefone" - Endpoints

Cada funcionalidade tem seu "número" especial. Chamamos eles de **endpoints**.

**Lista dos principais "números":**

| "Número" (Endpoint) | O que faz | Exemplo |
|---------------------|-----------|---------|
| `/api/auth/login` | Fazer login | "Quero entrar no sistema" |
| `/api/produtos` | Ver todos os produtos | "Mostre todos os produtos" |
| `/api/produtos/ABCD01` | Ver um produto específico | "Mostre o produto ABCD01" |
| `/api/vendas` | Registrar venda | "Registre esta venda" |
| `/api/estoque/verificar` | Verificar estoque | "Quanto tem em estoque?" |
| `/api/relatorios/pdf` | Gerar relatório | "Crie um relatório em PDF" |

**Como funciona na prática:**

Quando você clica em "Ver Produtos":
```javascript
// Frontend "liga" para o backend
GET http://localhost:5000/api/produtos

// Backend responde com lista de produtos
[
  { nome: "Notebook", quantidade: 50 },
  { nome: "Mouse", quantidade: 100 },
  { nome: "Teclado", quantidade: 75 }
]

// Frontend mostra na tela para você
```

### 6.3 Verbos HTTP - Os Tipos de Pedido

Quando você "liga" para a API, precisa dizer o que quer fazer. Usamos "verbos":

**GET - "Quero ver/buscar algo"**
- Como pedir para ver um cardápio
- Não muda nada, só consulta
- Exemplo: Ver lista de produtos

**POST - "Quero criar algo novo"**
- Como fazer um pedido de uma pizza
- Cria algo novo no sistema
- Exemplo: Cadastrar um produto novo

**PUT - "Quero atualizar algo"**
- Como mudar seu pedido antes de chegar
- Atualiza informações existentes
- Exemplo: Mudar o nome de um produto

**DELETE - "Quero remover algo"**
- Como cancelar um pedido
- Remove algo do sistema
- Exemplo: Deletar um produto

**Exemplo prático - Registrar uma venda:**

```javascript
// Frontend envia
POST /api/vendas
{
  produto: "ABCD01",
  quantidade: 5,
  local: "Loja Shopping"
}

// Backend processa e responde
{
  sucesso: true,
  mensagem: "Venda registrada!",
  novoEstoque: 45
}
```

### 6.4 Autenticação - O Crachá Digital

Lembra do JWT que falamos antes? Agora vamos ver como ele funciona na prática.

**Processo completo de Login:**

```
1. Você digita email e senha
   ↓
2. Frontend manda para /api/auth/login
   ↓
3. Backend verifica: email existe? Senha correta?
   ↓
4. Se sim, cria um TOKEN (crachá digital)
   ↓
5. Frontend guarda esse token (no localStorage do navegador)
   ↓
6. Próximas 7 dias: Toda requisição envia o token junto
   ↓
7. Backend vê o token e sabe: "Ah, é o João, pode entrar!"
```

**Analogia do Clube:**
É como entrar em um clube exclusivo:
1. Primeira vez: Mostra documento na portaria (login)
2. Recebe pulseirinha VIP (token)
3. Próximas 7 dias: Só mostra a pulseirinha, não precisa mostrar documento de novo
4. Depois de 7 dias: Pulseirinha vence, precisa mostrar documento de novo

**Como cada requisição envia o token:**

```javascript
// Exemplo real do código
axios.get('/api/produtos', {
  headers: {
    Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  }
})
```

É como dizer: "Alô, sou eu, João! Aqui está minha pulseirinha como prova!"

### 6.5 Validação - O Inspetor de Qualidade

Antes de processar qualquer pedido, o sistema verifica se está tudo certo. É como um **inspetor de qualidade** que checa tudo antes de aprovar.

**O que é verificado:**

**Exemplo 1 - Cadastrar produto:**
```
❌ Nome vazio? → Erro: "Nome é obrigatório"
❌ Quantidade negativa? → Erro: "Quantidade deve ser positiva"  
❌ Imagem muito grande? → Erro: "Imagem deve ter no máximo 5MB"
✅ Tudo OK? → Aprovado! Cadastra o produto
```

**Exemplo 2 - Registrar venda:**
```
❌ Quantidade = 0? → Erro: "Quantidade deve ser maior que 0"
❌ Estoque insuficiente? → Erro: "Só tem 3 unidades disponíveis"
❌ Usuário não logado? → Erro: "Faça login primeiro"
✅ Tudo OK? → Aprovado! Registra a venda
```

**Por que isso é importante?**
Evita que o sistema aceite informações erradas que poderiam causar problemas depois. É como ter um revisor que não deixa passar nenhum erro.

---

## 7. A Interface e Como as Pessoas Usam o Sistema

Agora vamos falar sobre a parte visual - o que você vê e como interage com o sistema.

### 7.1 Single Page Application (SPA) - Uma Única Página Mágica

O sistema é uma **SPA** - Single Page Application. Mas o que isso significa?

**Analogia - Site Normal vs SPA:**

**Site Tradicional (Não-SPA):**
- Como um livro de papel
- Para ver outra página, fecha a atual e abre outra
- Toda vez "recarrega" tudo do zero
- Demora e pisca a tela

**SPA (Nosso Sistema):**
- Como um tablet com app
- Parece que muda de página, mas é tudo instantâneo
- Só atualiza o que mudou
- Rápido e suave

**Exemplo prático:**
Quando você clica em "Produtos" → "Vendas":
- NÃO recarrega a página toda
- Só troca o conteúdo do meio
- Menu e cabeçalho ficam lá (não piscam)
- Instantâneo!

### 7.2 Estrutura da Interface - As Salas da Casa

Pense no sistema como uma casa com vários cômodos:

```
🏠 Casa (Sistema Estoque Fácil)
│
├── 🚪 Hall de Entrada (Login)
│   └── Primeira coisa que você vê
│
└── 🏡 Área Principal (Depois do Login)
    │
    ├── 📍 Corredor (Menu Lateral)
    │   ├── Dashboard
    │   ├── Produtos
    │   ├── Movimentação
    │   ├── Vendas
    │   ├── Relatórios
    │   └── Usuários (só admin)
    │
    ├── 🎨 Teto (Cabeçalho)
    │   ├── Logo "Estoque Fácil"
    │   ├── Nome do usuário
    │   └── Botão de sair
    │
    └── 🖼️ Sala (Área de Trabalho)
        └── Muda conforme o que você clica no menu
```

### 7.3 As "Salas" - Páginas do Sistema

Vamos ver o que tem em cada "sala":

#### 🏠 Dashboard (Sala de Controle)

**O que tem:**
- Números grandes mostrando totais (produtos, estoque, vendas)
- Gráficos coloridos (pizza, barras, linhas)
- Alertas vermelhos para produtos acabando
- Resumo de tudo que está acontecendo

**Analogia:** Como o painel de um carro:
- Velocímetro (vendas)
- Nível de gasolina (estoque)
- Avisos (produtos acabando)

**O que você vê em números:**
```
📦 150 Produtos Cadastrados
📊 5.234 Unidades em Estoque
💰 1.520 Vendas no Mês
⚠️ 12 Produtos com Estoque Baixo
```

**Gráficos mostram:**
- Quais categorias vendem mais (gráfico pizza)
- Quanto tem em cada local (gráfico barras)
- Como as vendas evoluíram no tempo (gráfico linha)

#### 📦 Produtos (Sala de Catálogo)

**O que tem:**
- Tabela com todos os produtos
- Foto de cada produto (se tiver)
- Botões: Adicionar, Editar, Deletar
- Campo de busca: "Digite para procurar..."

**Como usar:**

**Ver produtos:**
Abre e vê uma tabela assim:
```
| Foto | Código | Nome           | Categoria    | Estoque | Ações |
|------|--------|----------------|--------------|---------|-------|
| 🖼️   | ABCD01 | Notebook Dell  | Informática  | 50 un.  | ✏️ 🗑️ |
| 🖼️   | XYZW02 | Mouse Gamer    | Periféricos  | 120 un. | ✏️ 🗑️ |
```

**Adicionar produto:**
1. Clica no botão verde "+ Adicionar"
2. Preenche formulário:
   - Nome: ____
   - Tipo: ____ (escolhe de uma lista)
   - Categoria: ____ (escolhe de uma lista)
   - Foto: [Escolher arquivo]
   - Local inicial: ____
   - Quantidade inicial: ____
3. Clica "Salvar"
4. 💚 Aparece mensagem: "Produto cadastrado com sucesso!"
5. Sistema gera código automaticamente (ex: JHGF23)

**Editar produto:**
1. Clica no lápis ✏️
2. Muda o que quiser
3. Salva
4. 💚 "Produto atualizado!"

#### 🔄 Movimentação (Sala de Transferências)

**O que faz:** Controla entrada, saída e transferências de produtos.

**3 tipos de movimentação:**

**1. Entrada (chegou produto):**
```
Produto: [Escolhe da lista ▼]
Local: [Escolhe: Depósito Central ▼]
Quantidade: [___]
Motivo: [Compra/Devolução/Outro]
```
Aumenta o estoque no local escolhido.

**2. Saída (produto saiu sem venda):**
```
Produto: [Escolhe da lista ▼]
Local de onde sai: [Loja Shopping ▼]
Quantidade: [___]
Motivo: [Perda/Doação/Uso Interno]
```
Diminui o estoque no local escolhido.

**3. Transferência (mover entre locais):**
```
Produto: [Notebook Dell ▼]
De: [Depósito Central ▼]
Para: [Loja Shopping ▼]
Quantidade: [10]
```
Diminui no local de origem, aumenta no destino.

**O sistema verifica automaticamente:**
- ❌ Tem quantidade suficiente no local de origem?
- ❌ Quantidade é um número positivo?
- ❌ Produto e locais existem?
- ✅ Tudo OK? → Faz a transferência!

#### 💰 Vendas (Sala de Caixa)

**O que faz:** Registra vendas e atualiza estoque automaticamente.

**Registrar venda - Formulário simplificado:**
```
Produto: [Notebook Dell ▼]
Local: [Loja Shopping ▼]
Quantidade: [2]

[Botão: Registrar Venda]
```

**O que acontece quando você clica "Registrar":**
```
1. Verifica estoque: "Tem 10 notebooks na Loja Shopping"
2. Quer vender 2, tem 10 → OK! ✓
3. Cria registro da venda
4. Atualiza estoque: 10 - 2 = 8 notebooks
5. Cria movimentação de saída
6. Mostra mensagem: 💚 "Venda registrada! Novo estoque: 8 unidades"
```

Tudo isso em menos de 1 segundo!

**Histórico de Vendas:**
Abaixo do formulário, tem uma tabela mostrando todas as vendas:
```
| Data       | Hora  | Produto        | Qtd | Local        | Vendedor      |
|------------|-------|----------------|-----|--------------|---------------|
| 10/12/2024 | 14:30 | Notebook Dell  | 2   | Loja Shop.   | João Silva    |
| 10/12/2024 | 15:45 | Mouse Gamer    | 1   | Depósito C.  | Maria Santos  |
```

**Filtros disponíveis:**
- Por período: [01/12/2024] até [10/12/2024]
- Por produto: [Todos ▼]
- Por local: [Todos ▼]

#### 📊 Relatórios (Sala de Análises)

**O que tem:** Visão completa com gráficos e opção de exportar PDF.

**Filtros no topo:**
```
Período: [01/12/2024] até [31/12/2024]
Categoria: [Todas ▼]
Local: [Todos ▼]

[Botão: Gerar Relatório] [Botão: Exportar PDF]
```

**O que mostra:**

**1. Números Gerais:**
```
💰 Total de Vendas: 1.520 unidades
📊 Receita Total: R$ 458.500,00
📦 Produtos Mais Vendidos: Notebook Dell (350 un.)
```

**2. Gráfico Pizza - Vendas por Categoria:**
```
     [Gráfico]
   📊 Informática: 45%
   📊 Periféricos: 30%
   📊 Acessórios: 25%
```

**3. Gráfico Barras - Estoque por Local:**
```
Depósito Central: ████████████ 2.500 un.
Loja Shopping:    ██████ 800 un.
Filial Centro:    ████ 450 un.
```

**4. Gráfico Linha - Evolução de Vendas:**
```
         ^
Vendas   │     ╱╲
         │    ╱  ╲    ╱
         │   ╱    ╲  ╱
         │  ╱      ╲╱
         └──────────────────>
            Jan Feb Mar Abr    Tempo
```

**5. Listas Especiais:**
- **Top 10 Produtos:** Os mais vendidos
- **Produtos Sem Movimentação:** Parados há mais de 30 dias
- **Estoque Crítico:** Menos de 10 unidades

**Exportar PDF:**
Clica no botão e baixa um arquivo PDF bonitinho com:
- Logo da empresa
- Todos os gráficos
- Todas as tabelas
- Data de geração
- Pronto para imprimir ou enviar por email

#### 👥 Usuários (Sala de Gerenciamento - Só Admin)

**O que faz:** Administrador cria e gerencia contas de funcionários.

**Lista de usuários:**
```
| Nome          | Email                | Perfil      | Status | Ações |
|---------------|----------------------|-------------|--------|-------|
| João Silva    | joao@empresa.com     | Admin       | Ativo  | ✏️ 🔑 |
| Maria Santos  | maria@empresa.com    | Funcionário | Ativo  | ✏️ 🔑 |
| Carlos Lima   | carlos@empresa.com   | Funcionário | Inativo| ✏️ 🔑 |
```

**Adicionar usuário:**
```
Nome: [______________________]
Email: [______________________]
Senha: [______________________]
Perfil: [ ] Admin  [ ] Funcionário

[Botão: Criar Usuário]
```

**Ícones de ação:**
- ✏️ Editar: Mudar nome, email, perfil
- 🔑 Alterar Senha: Definir nova senha
- 🗑️ Desativar: Bloquear acesso (não deleta, só desativa)

### 7.4 Sistema de Feedback Visual - Como o Sistema "Conversa" Com Você

O sistema usa várias formas de te avisar sobre o que está acontecendo:

#### 🎨 Notificações Toast (Aquelas caixinhas que aparecem)

**Verde (Sucesso):**
```
✅ Produto cadastrado com sucesso!
✅ Venda registrada!
✅ Transferência realizada!
```
Aparece no canto superior direito, fica 3 segundos e desaparece.

**Vermelho (Erro):**
```
❌ Erro: Estoque insuficiente
❌ Erro: Email já cadastrado
❌ Erro: Senha incorreta
```
Fica mais tempo na tela (5 segundos) para você ler.

**Amarelo (Aviso):**
```
⚠️ Atenção: Estoque baixo!
⚠️ Produto sem movimentação há 30 dias
```

**Azul (Informação):**
```
ℹ️ Processando relatório...
ℹ️ Carregando dados...
```

#### ⏳ Indicadores de Carregamento

**Spinner (rodinha girando):**
Aparece quando está buscando dados do servidor.
```
    ⭕
   Carregando...
```

**Botão com "Salvando...":**
```
[Salvando... ⏳]  ← Botão fica cinza e não clica
```
Evita que você clique várias vezes por engano.

**Skeleton (retângulos piscando):**
```
▭▭▭▭▭▭▭▭▭▭
▭▭▭▭▭▭▭
▭▭▭▭▭▭▭▭▭▭▭
```
Mostra "esqueleto" da página enquanto carrega o conteúdo real.

#### 🎯 Cores com Significado

O sistema usa cores de forma consistente:
- 🟢 **Verde:** Sucesso, positivo, "pode ir"
- 🔴 **Vermelho:** Erro, perigo, "pare"
- 🟡 **Amarelo:** Aviso, atenção
- 🔵 **Azul:** Informação, neutra
- ⚫ **Cinza:** Desabilitado, inativo

**Exemplo - Botões:**
- Botão verde: "Salvar", "Adicionar", "Confirmar"
- Botão vermelho: "Deletar", "Cancelar"
- Botão azul: "Ver Detalhes", "Filtrar"
- Botão cinza: Desabilitado (não pode clicar ainda)

---

## 8. Segurança - Protegendo Suas Informações

Segurança é super importante! Vamos explicar todas as camadas de proteção do sistema.

### 8.1 As 6 Camadas de Segurança

Pense no sistema como um castelo medieval com várias defesas:

```
        🏰 DADOS PROTEGIDOS
           ↑
    [6] Validação de Dados
           ↑
    [5] Rate Limiting
           ↑
    [4] CORS
           ↑
    [3] Helmet (Headers)
           ↑
    [2] Verificação JWT
           ↑
    [1] Senha Criptografada
           ↑
        👤 USUÁRIO
```

Vamos explicar cada camada:

#### 🔒 Camada 1: Senhas Criptografadas (Bcrypt)

**O que faz:** Transforma senhas em códigos impossíveis de decifrar.

**Processo:**
```
Você digita: "senha123"
      ↓
Bcrypt processa com 12 rounds
      ↓
Sistema guarda: "$2b$12$KIXKJVDxJkLm..."
```

**Por que é seguro:**
- Mesmo se hackers roubarem o banco de dados, não conseguem descobrir as senhas
- Cada senha gera um código único (mesmo que duas pessoas usem "senha123")
- Demora ~0,25 segundos para processar (proposital! Dificulta ataques)

**Analogia:** É como transformar uma receita de bolo em hieróglifos egípcios. Você pode ler os hieróglifos e fazer o bolo, mas não consegue voltar do bolo para os hieróglifos.

#### 🎫 Camada 2: Tokens JWT - O Passe de Acesso

**O que faz:** Cria um "passe VIP" quando você faz login.

**Como funciona:**
```
Login correto → Recebe token JWT (válido por 7 dias)
      ↓
Cada requisição envia o token
      ↓
Sistema verifica: Token válido? Não expirou?
      ↓
SIM → Libera acesso
NÃO → Redireciona para login
```

**O que tem dentro do token:**
```javascript
{
  id: "12345",              // ID do usuário
  perfil: "admin",          // Admin ou funcionário
  exp: 1702588800           // Data de expiração
}
```

**Assinatura digital:** O token tem uma "assinatura" (JWT_SECRET) que só o servidor conhece. Se alguém tentar falsificar o token, a assinatura não bate e o sistema bloqueia.

#### 🛡️ Camada 3: Helmet - Proteção de Headers HTTP

**O que faz:** Adiciona proteções extras nos "cabeçalhos" da comunicação.

**Proteções ativadas:**

**1. XSS Protection (Cross-Site Scripting):**
Impede que hackers injetem código malicioso nas páginas.
```
Hacker tenta: <script>roubar_dados()</script>
Helmet bloqueia: ❌ "Código não autorizado"
```

**2. Clickjacking Protection:**
Impede que seu site seja colocado "dentro" de outro site malicioso.
```
Site malicioso tenta abrir Estoque Fácil em iframe
Helmet bloqueia: ❌ "Não pode ser aberto em iframe"
```

**3. Content Security Policy:**
Define quais recursos (scripts, imagens) são permitidos.
```
✅ Imagens do próprio servidor: OK
✅ Scripts do próprio servidor: OK
❌ Script de site desconhecido: BLOQUEADO
```

**Analogia:** É como ter um segurança na porta que verifica se não tem nada suspeito antes de deixar entrar.

#### ⏱️ Camada 4: Rate Limiting - Controle de Frequência

**O que faz:** Limita quantas vezes alguém pode fazer pedidos ao servidor.

**Regras configuradas:**

**Regra Geral:**
```
Máximo: 100 requisições por IP
Período: 15 minutos
```
Se ultrapassar: Bloqueado por 15 minutos

**Regra de Login (mais rigorosa):**
```
Máximo: 5 tentativas de login
Período: 15 minutos
```
Se errar senha 5 vezes: Bloqueado por 15 minutos

**Por que isso é importante:**
Impede ataques de **"brute force"** (tentar adivinhar senhas tentando milhares de combinações).

**Analogia:** É como a porta giratória de um banco - deixa passar uma pessoa por vez. Se alguém tentar forçar passando muito rápido, trava!

#### 🌐 Camada 5: CORS - Controle de Origem

**O que faz:** Define quais sites podem se comunicar com nossa API.

**Configuração:**
```javascript
Permitido: http://localhost:3000  (nosso frontend)
Bloqueado: Qualquer outro site
```

**Exemplo de bloqueio:**
```
Site malicioso tenta: "Quero acessar /api/produtos"
CORS responde: ❌ "Você não tem permissão"

Nosso frontend tenta: "Quero acessar /api/produtos"
CORS responde: ✅ "Pode entrar!"
```

**Analogia:** É como um condomínio que só aceita visitantes da lista. Se você não está na lista, não entra!

#### ✅ Camada 6: Validação de Dados - Inspetor de Qualidade

**O que faz:** Verifica se os dados enviados estão corretos antes de processar.

**Usa a biblioteca Zod** para definir regras. Exemplos:

**Cadastro de produto:**
```javascript
Nome: 
  ✓ Obrigatório
  ✓ Mínimo 3 caracteres
  ✓ Máximo 100 caracteres

Quantidade:
  ✓ Deve ser número
  ✓ Deve ser positivo
  ✓ Deve ser inteiro (não aceita 5.5)

Email:
  ✓ Deve ser email válido
  ✓ Exemplo: nome@empresa.com
```

**Tentativas bloqueadas:**
```
❌ Nome: "" → Erro: "Nome é obrigatório"
❌ Quantidade: -5 → Erro: "Quantidade deve ser positiva"
❌ Email: "joaoempresa" → Erro: "Email inválido"
❌ Quantidade: 5.5 → Erro: "Quantidade deve ser inteiro"
```

**Analogia:** É como um inspetor de qualidade em uma fábrica que não deixa passar produtos defeituosos.

### 8.2 Resumo das Proteções

**O que o sistema protege contra:**

✅ **Roubo de senhas:** Criptografia Bcrypt  
✅ **Acesso não autorizado:** JWT tokens  
✅ **Ataques XSS:** Helmet  
✅ **Clickjacking:** Helmet  
✅ **Brute Force:** Rate Limiting  
✅ **Acesso de sites maliciosos:** CORS  
✅ **Dados inválidos:** Validação Zod  
✅ **SQL Injection:** MongoDB (NoSQL, não vulnerável)  

**O que o usuário precisa fazer:**
- ✅ Escolher senha forte
- ✅ Não compartilhar senha
- ✅ Fazer logout ao sair
- ✅ Não deixar token JWT exposto

---

## 9. Jornada de Uma Venda no Sistema

Vamos seguir o caminho completo de uma venda, desde quando você clica no botão até salvar no banco de dados. É como seguir uma encomenda desde a compra até a entrega!

### 9.1 Passo a Passo Detalhado

**Situação:** Funcionário João quer registrar a venda de 5 notebooks.

#### 🖱️ Passo 1: João Preenche o Formulário (Frontend)

```
Página: Vendas
João seleciona:
  Produto: Notebook Dell Inspiron
  Local: Loja Shopping
  Quantidade: 5

[Clica no botão: Registrar Venda]
```

**O que acontece no código:**
```javascript
// React captura o clique
function registrarVenda() {
  // Dados do formulário
  const venda = {
    produto: "ABCD01",
    local: "LOC001",
    quantidade: 5
  };
  
  // Envia para o backend
  await api.post('/api/vendas', venda);
}
```

#### 📡 Passo 2: Viagem até o Servidor (HTTP Request)

```
Frontend (localhost:3000)
    ↓
    | HTTP POST
    | /api/vendas
    | Headers: { Authorization: "Bearer token..." }
    | Body: { produto, local, quantidade: 5 }
    ↓
Backend (localhost:5000)
```

**Analogia:** É como enviar uma carta pelos correios:
- Envelope (HTTP): Contém o pedido
- Endereço: /api/vendas
- Selo (Token): Prova que você pode enviar
- Conteúdo: Os dados da venda

#### 🛡️ Passo 3: Portaria de Segurança (Middlewares)

A requisição passa por 3 "guardas" antes de chegar no destino:

**Guarda 1 - Autenticação (auth.js):**
```
Verifica token JWT:
✓ Token existe?
✓ Token é válido?
✓ Token não expirou?
✓ Usuário existe no banco?

Resultado: ✅ João Silva, funcionário
```

**Guarda 2 - Rate Limiting:**
```
Verifica frequência de requisições:
✓ João já fez 3 requisições nos últimos 15 minutos
✓ Limite é 100
✓ OK, pode passar!

Resultado: ✅ Dentro do limite
```

**Guarda 3 - Validação de Dados (Zod):**
```
Verifica os dados enviados:
✓ Produto: "ABCD01" → existe? SIM ✓
✓ Quantidade: 5 → é número positivo? SIM ✓
✓ Local: "LOC001" → existe? SIM ✓

Resultado: ✅ Dados válidos
```

Se qualquer guarda reprovar, a requisição é bloqueada aqui mesmo!

#### 🧠 Passo 4: Processamento (Controller)

Agora chega no "cérebro" - o controller que processa a venda:

```javascript
// vendaController.js
async function registrar(req, res) {
  // 1. Pega os dados validados
  const { produto, local, quantidade } = req.body;
  const usuarioId = req.usuario._id;  // Do token JWT
  
  // 2. Busca estoque atual
  const estoque = await Estoque.findOne({ 
    produto: produto, 
    local: local 
  });
  
  // 3. Verifica se tem quantidade suficiente
  if (estoque.quantidade < quantidade) {
    return res.status(400).json({
      erro: `Estoque insuficiente! Disponível: ${estoque.quantidade}`
    });
  }
  
  // 4. Continua... (próximo passo)
}
```

**O que está fazendo:**
1. Extrai os dados
2. Consulta: "Quanto tem de Notebook Dell na Loja Shopping?"
3. Resposta do banco: "Tem 10 unidades"
4. Verifica: Quer vender 5, tem 10 → OK! ✓

#### 📁 Passo 5: Salvando no Banco de Dados (MongoDB)

Se tudo OK, agora salva as informações:

```javascript
// Continuação do controller...

// 5. Cria registro da venda
const venda = await Venda.create({
  produto: produto,
  quantidade: 5,
  local: local,
  dataVenda: new Date(),
  registradoPor: usuarioId
});

// 6. Atualiza estoque (10 - 5 = 5)
estoque.quantidade -= quantidade;
estoque.ultimaAtualizacao = new Date();
await estoque.save();

// 7. Cria movimentação de saída
await Movimentacao.create({
  tipo: 'saida',
  produto: produto,
  quantidade: 5,
  localOrigem: local,
  data: new Date(),
  realizadoPor: usuarioId,
  observacao: 'Venda registrada'
});

// 8. Retorna sucesso
res.status(200).json({
  sucesso: true,
  mensagem: 'Venda registrada com sucesso!',
  venda: venda,
  novoEstoque: estoque.quantidade
});
```

**O que aconteceu no MongoDB:**

**Coleção "vendas" - NOVO registro:**
```javascript
{
  _id: "VND12345",
  produto: "ABCD01",
  quantidade: 5,
  local: "LOC001",
  dataVenda: "2024-12-10T16:45:00Z",
  registradoPor: "USR001"
}
```

**Coleção "estoques" - ATUALIZADO:**
```javascript
// ANTES
{
  produto: "ABCD01",
  local: "LOC001",
  quantidade: 10  ← ERA 10
}

// DEPOIS
{
  produto: "ABCD01",
  local: "LOC001",
  quantidade: 5,  ← AGORA É 5
  ultimaAtualizacao: "2024-12-10T16:45:00Z"
}
```

**Coleção "movimentacoes" - NOVO registro:**
```javascript
{
  _id: "MOV54321",
  tipo: "saida",
  produto: "ABCD01",
  quantidade: 5,
  localOrigem: "LOC001",
  data: "2024-12-10T16:45:00Z",
  realizadoPor: "USR001",
  observacao: "Venda registrada"
}
```

#### 📡 Passo 6: Resposta Volta para o Frontend

```
Backend (localhost:5000)
    ↓
    | HTTP Response 200 OK
    | { sucesso: true, mensagem: "...", novoEstoque: 5 }
    ↓
Frontend (localhost:3000)
```

#### 🎨 Passo 7: Interface Se Atualiza

O frontend recebe a resposta e atualiza tudo:

```javascript
// Frontend recebe a resposta
const resposta = await api.post('/api/vendas', venda);

if (resposta.sucesso) {
  // 1. Mostra notificação verde
  toast.success('✅ Venda registrada com sucesso!');
  
  // 2. React Query invalida cache
  queryClient.invalidateQueries(['vendas']);
  queryClient.invalidateQueries(['estoque']);
  
  // 3. Limpa o formulário
  setQuantidade('');
  setProduto('');
  
  // 4. Lista de vendas atualiza automaticamente
  // 5. Estoque atualiza automaticamente
}
```

**O que João vê na tela:**
1. ✅ Notificação verde aparece: "Venda registrada com sucesso!"
2. Formulário limpa (fica pronto para próxima venda)
3. Lista de vendas embaixo mostra a venda nova
4. Se abrir página de estoque, vê que diminuiu de 10 para 5

**Tempo total:** Menos de 1 segundo! ⚡

### 9.2 Diagrama Visual do Fluxo Completo

```
👤 JOÃO
  ↓ (preenche formulário)
🖥️ FRONTEND (React)
  ↓ (POST /api/vendas)
────────────────────────────
🛡️ MIDDLEWARE - Autenticação
  ↓ (verifica token)
🛡️ MIDDLEWARE - Rate Limiting
  ↓ (verifica frequência)
🛡️ MIDDLEWARE - Validação
  ↓ (valida dados)
────────────────────────────
🧠 CONTROLLER
  ↓ (busca estoque)
📁 MONGODB - Consulta
  ↑ (retorna: tem 10 unidades)
🧠 CONTROLLER
  ↓ (verifica: 5 < 10? SIM!)
  ↓ (cria venda)
  ↓ (atualiza estoque: 10-5=5)
  ↓ (cria movimentação)
📁 MONGODB - Salva tudo
  ↑ (confirma: salvo!)
────────────────────────────
🧠 CONTROLLER
  ↓ (monta resposta)
🖥️ FRONTEND (React)
  ↓ (recebe confirmação)
  ↓ (mostra notificação)
  ↓ (atualiza listas)
👤 JOÃO
  ✅ (vê: "Venda registrada!")
```

**Todo esse processo acontece em frações de segundo!**

---

## 10. Evolução e Melhorias Durante o Desenvolvimento

Durante a criação do sistema, encontramos vários desafios e fizemos melhorias importantes. Vamos contar essa jornada.

### 10.1 Desafios Encontrados e Soluções

#### 🐌 Desafio 1: Sistema Lento com Muitos Dados

**Problema descoberto:**
Quando testamos com 5.000 produtos e 50.000 vendas, a página de relatórios demorava 15 segundos para carregar!

**Por que acontecia:**
O sistema buscava TODOS os dados do banco de vez, processava no backend, e mandava tudo para o frontend.

**Solução implementada:**

**1. Índices no MongoDB:**
Criamos "atalhos" no banco de dados:
```javascript
// Antes: Procurava produto por produto (lento)
// Depois: Índice por produto.id (instantâneo)
produtoSchema.index({ id: 1 });
estoqueSchema.index({ produto: 1, local: 1 });
vendaSchema.index({ dataVenda: -1 });  // Ordenado por data
```

**Analogia:** É como o índice de um livro. Em vez de ler página por página procurando uma palavra, você vai direto no índice e descobre a página.

**2. Population Seletiva:**
Em vez de buscar TODOS os dados de um produto, buscamos só o necessário:
```javascript
// ANTES (lento - busca tudo)
const vendas = await Venda.find().populate('produto');

// DEPOIS (rápido - busca só nome e imagem)
const vendas = await Venda.find()
  .populate('produto', 'nome imagemUrl')
  .populate('registradoPor', 'nome');
```

**Resultado:** Relatórios agora carregam em menos de 2 segundos! 🚀

#### 🔄 Desafio 2: Dados Desatualizados em Múltiplos Usuários

**Problema descoberto:**
João registrava uma venda, mas Maria (usando outro computador) não via a atualização até recarregar a página.

**Por que acontecia:**
Cada usuário tinha sua "cópia" dos dados na memória. Quando João mudava algo, a cópia de Maria ficava desatualizada.

**Solução implementada:**

**React Query com Invalidação Automática:**
```javascript
// Quando João registra venda
await api.post('/api/vendas', venda);

// React Query automaticamente:
queryClient.invalidateQueries(['vendas']);    // Marca vendas como "desatualizado"
queryClient.invalidateQueries(['estoque']);   // Marca estoque como "desatualizado"

// Próxima vez que Maria abrir essas páginas:
// React Query busca dados frescos do servidor!
```

**Além disso, configuramos tempos de cache:**
```javascript
useQuery({
  queryKey: ['produtos'],
  queryFn: buscarProdutos,
  staleTime: 5 * 60 * 1000,      // 5 minutos = dado "fresco"
  refetchInterval: 2 * 60 * 1000 // A cada 2 minutos, atualiza
});
```

**Resultado:** Múltiplos usuários veem atualizações em até 2 minutos automaticamente!

#### 🔒 Desafio 3: Segurança - Tentativas de Invasão

**Problema descoberto:**
Em testes, detectamos que alguém poderia tentar adivinhar senhas fazendo milhares de tentativas de login por segundo.

**Solução implementada:**

**Rate Limiting agressivo no login:**
```javascript
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutos
  max: 5,                     // Apenas 5 tentativas
  message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
});

// Aplica no endpoint de login
router.post('/api/auth/login', loginLimiter, authController.login);
```

**Resultado:** Ataques de brute-force se tornaram inviáveis (demoraria anos para testar todas as combinações).

#### ❌ Desafio 4: Erros Humanos - Dados Inválidos

**Problema descoberto:**
Usuários digitavam:
- Quantidades negativas: "-5"
- Texto em campo numérico: "abc"
- Emails inválidos: "joaoempresa"

Isso causava erros estranhos no sistema.

**Solução implementada:**

**Validação rigorosa com Zod:**
```javascript
const vendaSchema = z.object({
  produto: z.string().min(1, 'Produto é obrigatório'),
  quantidade: z.number()
    .int('Quantidade deve ser número inteiro')
    .positive('Quantidade deve ser positiva')
    .max(10000, 'Quantidade muito alta'),
  local: z.string().min(1, 'Local é obrigatório')
});
```

**Validação também no frontend:**
```javascript
// Input só aceita números
<input 
  type="number" 
  min="1" 
  max="10000"
  required
/>
```

**Resultado:** Erros de digitação são capturados antes de causar problemas, com mensagens claras para o usuário.

#### 📱 Desafio 5: Interface em Dispositivos Móveis

**Problema descoberto:**
Em celulares, algumas tabelas ficavam "espremidas" e ilegíveis.

**Solução implementada:**

**Design Responsivo com CSS:**
```css
/* Desktop: Tabela completa */
@media (min-width: 768px) {
  table {
    display: table;
  }
}

/* Mobile: Tabela vira cards */
@media (max-width: 767px) {
  table, thead, tbody, tr, td {
    display: block;
  }
  
  td:before {
    content: attr(data-label);
    font-weight: bold;
  }
}
```

**Resultado:**
- **Desktop:** Tabelas normais, bonitas e espaçadas
- **Mobile:** Cada linha vira um "card" vertical, fácil de ler

### 10.2 Funcionalidades Adicionadas Durante o Desenvolvimento

Além das funcionalidades planejadas, adicionamos:

#### ✨ 1. Dashboard com Gráficos

**Não estava no plano inicial!**

Percebemos que administradores queriam ver visualmente:
- Quais categorias vendem mais
- Como vendas evoluem no tempo
- Distribuição de estoque

Adicionamos **Chart.js** e criamos 3 gráficos interativos.

#### ✨ 2. Alertas de Estoque Baixo

**Não estava no plano inicial!**

Usuários queriam ser avisados quando um produto estivesse acabando.

Adicionamos:
- Cálculo automático: estoque < 10 unidades = alerta
- Ícone vermelho ⚠️ no dashboard
- Lista de produtos em estoque crítico

#### ✨ 3. Histórico de Movimentações

**Não estava no plano inicial!**

Administradores queriam rastrear: "Quem moveu esse produto? Quando?"

Adicionamos coleção `movimentacoes` que registra:
- Todo entrada
- Toda saída
- Toda transferência
- Quem fez e quando

#### ✨ 4. Upload de Imagens de Produtos

**Não estava no plano inicial!**

Percebemos que seria muito melhor ver uma foto do produto em vez de só o nome.

Adicionamos:
- **Multer** para upload de arquivos
- Pasta `/uploads/produtos` para guardar imagens
- Validação: máximo 5MB, só imagens (.jpg, .png, .webp)

#### ✨ 5. Filtros Avançados em Relatórios

**Não estava no plano inicial!**

Usuários queriam relatórios mais específicos:
- "Vendas só de Informática"
- "Estoque só do Depósito Central"
- "Vendas de Janeiro a Março"

Adicionamos sistema de filtros que pode combinar:
- Período (data início e fim)
- Categoria
- Local
- Tipo de produto

### 10.3 O Que Aprendemos

**Lições importantes do desenvolvimento:**

1. **Teste com dados reais:** Testar com 10 produtos não revela problemas que aparecem com 5.000
2. **Usuários são criativos:** Vão tentar usar o sistema de formas que você não imaginou
3. **Segurança desde o início:** É mais fácil construir com segurança do que adicionar depois
4. **Feedback visual é essencial:** Usuários precisam saber o que está acontecendo
5. **Performance importa:** Até 2 segundos é OK, mais que isso frustra o usuário
6. **Mobile não é opcional:** Muita gente usa celular, precisa funcionar bem

---

## 11. Conclusão e Próximos Passos

### 11.1 O Que Conseguimos Alcançar

O **Estoque Fácil** evoluiu de uma ideia simples para um sistema completo e profissional:

✅ **Funcionalidade Completa**
- Gerenciamento de produtos com códigos automáticos
- Controle de estoque em múltiplos locais
- Registro de vendas com atualização automática
- Transferências entre locais
- Relatórios profissionais com gráficos
- Exportação para PDF

✅ **Segurança Robusta**
- 6 camadas de proteção
- Senhas criptografadas com Bcrypt
- Autenticação com JWT
- Proteção contra ataques comuns
- Validação rigorosa de dados

✅ **Performance Otimizada**
- Resposta em menos de 2 segundos
- Cache inteligente com React Query
- Índices no MongoDB para buscas rápidas
- Uso eficiente de memória

✅ **Interface Moderna**
- Responsiva (funciona em celular, tablet, desktop)
- Feedback visual claro (notificações, loading)
- Navegação intuitiva
- Gráficos interativos

✅ **Código Bem Organizado**
- Padrão MVC
- Separação de responsabilidades
- Código reutilizável
- Fácil de manter e evoluir

### 11.2 Aplicabilidade no Mercado

O sistema foi projetado para o mercado brasileiro e pode ser usado por:

**Pequenas Empresas:**
- Lojas de varejo
- Farmácias
- Papelarias
- Lojas de informática
- Mercadinhos

**Médias Empresas:**
- Distribuidoras
- Atacadistas
- Redes com múltiplas lojas
- Empresas com vários depósitos

**Vantagens sobre planilhas:**
- ✅ Não tem erro de digitação
- ✅ Atualiza automaticamente
- ✅ Múltiplos usuários simultâneos
- ✅ Relatórios profissionais instantâneos
- ✅ Rastreamento completo
- ✅ Seguro e protegido

### 11.3 Melhorias Futuras Planejadas

O sistema está funcional, mas há espaço para evoluções:

**Versão 2.0 (Curto Prazo):**
- 🔔 Notificações push quando estoque ficar baixo
- 📧 Emails automáticos de relatórios semanais
- 📊 Mais tipos de gráficos e análises
- 🔍 Busca avançada com filtros múltiplos
- 📋 Importação em massa via planilha Excel
- 🎨 Temas personalizáveis (claro/escuro)

**Versão 3.0 (Médio Prazo):**
- 📱 Aplicativo móvel nativo (React Native)
- 📷 Leitor de código de barras
- 🔗 Integração com sistemas ERP
- 💳 Integração com sistemas de pagamento
- 🧾 Emissão de nota fiscal eletrônica (NF-e)
- 🌍 Suporte a múltiplos idiomas

**Versão 4.0 (Longo Prazo):**
- 🤖 Inteligência Artificial para prever vendas
- 📈 Análise preditiva de estoque
- 🔄 Sugestões automáticas de reposição
- ☁️ Backup automático na nuvem
- 🔐 Autenticação OAuth2 (Google, Microsoft)
- 👥 Sistema de permissões granulares

### 11.4 Considerações Finais

O desenvolvimento do **Estoque Fácil** foi uma jornada de aprendizado contínuo. Começamos com requisitos básicos e, através de testes e feedback, evoluímos para um sistema completo e robusto.

**Principais conquistas técnicas:**
- Domínio da stack MERN (MongoDB, Express, React, Node.js)
- Implementação de padrões de projeto profissionais
- Sistema de segurança em múltiplas camadas
- Interface responsiva e moderna
- Performance otimizada mesmo com grandes volumes de dados

**Impacto real:**
Este sistema pode genuinamente ajudar pequenas e médias empresas brasileiras a:
- Economizar tempo (não mais planilhas manuais)
- Reduzir erros (validações automáticas)
- Tomar decisões melhores (relatórios visuais)
- Crescer de forma organizada (múltiplos locais)

**Mensagem final:**
O **Estoque Fácil** prova que é possível criar ferramentas profissionais, seguras e eficientes usando tecnologias modernas e acessíveis. Mais importante: prova que tecnologia bem aplicada pode realmente facilitar a vida das pessoas e ajudar negócios a prosperarem.

---

**Documento elaborado para defesa de TCC**  
**Data**: Dezembro 2024  
**Sistema**: Estoque Fácil v1.0  
**Tecnologia**: Stack MERN (MongoDB, Express.js, React, Node.js)  
**Autor**: [Seu Nome]  
**Instituição**: [Sua Instituição]  

---

## 📚 Glossário de Termos Técnicos

Para facilitar o entendimento, aqui está um glossário com explicações simples:

| Termo | Explicação Simples |
|-------|-------------------|
| **API** | Como uma central telefônica que recebe e responde pedidos |
| **Backend** | O "cérebro" do sistema que processa tudo |
| **Cache** | Memória temporária que guarda dados para acesso rápido |
| **Criptografia** | Transformar informação em código secreto |
| **Endpoint** | Um "endereço" específico na API (como um número de telefone) |
| **Frontend** | A parte visual que você vê e interage |
| **JWT** | Passe VIP digital que prova quem você é |
| **Middleware** | Guarda de segurança que verifica coisas antes de processar |
| **MongoDB** | Armário digital onde guardamos informações |
| **Node.js** | Motor que faz o servidor funcionar |
| **React** | Ferramenta que constrói as telas do sistema |
| **REST** | Jeito padronizado de fazer APIs |
| **Schema** | Receita que define como os dados devem ser |
| **SPA** | Aplicação de página única (não recarrega a página toda) |
| **Stack** | Conjunto de tecnologias que trabalham juntas |
| **Token** | Código secreto que prova que você está autorizado |
| **Validação** | Verificar se os dados estão corretos |

---

*Este documento foi escrito com o objetivo de ser compreensível para pessoas sem conhecimento técnico em computação, usando analogias do cotidiano e explicações passo a passo.*

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
