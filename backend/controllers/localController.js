const Local = require("../models/Local");
const Estoque = require("../models/Estoque");
const Movimentacao = require("../models/Movimentacao");
const Venda = require("../models/Venda");

// Gerar um ID para o local baseado no nome
const gerarIdLocal = (nome) => {
  // Remover espaços e caracteres especiais, converter para maiúsculas
  return nome
    .replace(/[^\w\s]/gi, "")
    .replace(/\s+/g, "_")
    .toUpperCase()
    .substring(0, 15);
};

// Listar todos os locais
exports.listarLocais = async (req, res) => {
  try {
    // Parâmetros de paginação e filtros
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Filtros
    const busca = req.query.busca || "";
    const tipo = req.query.tipo || "";
    const status = req.query.status; // 'true', 'false' ou undefined

    // Construir objeto de filtro
    let filtro = {};

    if (busca) {
      filtro.$or = [
        { nome: { $regex: busca, $options: "i" } },
        { descricao: { $regex: busca, $options: "i" } },
      ];
    }

    if (tipo) {
      filtro.tipo = tipo;
    }

    if (status !== undefined) {
      filtro.ativo = status === "true";
    }

    // Consulta ao banco de dados
    const locais = await Local.find(filtro)
      .skip(skip)
      .limit(limit)
      .sort({ nome: 1 })
      .populate("criadoPor", "nome");

    const total = await Local.countDocuments(filtro);

    res.status(200).json({
      sucesso: true,
      locais,
      total,
      pagina: page,
      totalPaginas: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Erro ao listar locais:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao listar locais",
      erro: error.message,
    });
  }
};

// Obter um local específico
exports.obterLocal = async (req, res) => {
  try {
    const local = await Local.findById(req.params.id).populate(
      "criadoPor",
      "nome"
    );

    if (!local) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Local não encontrado",
      });
    }

    // Obter contagem de produtos neste local
    const produtosNoLocal = await Estoque.countDocuments({ local: local.nome });

    res.status(200).json({
      sucesso: true,
      local,
      produtosNoLocal,
    });
  } catch (error) {
    console.error("Erro ao obter local:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao obter local",
      erro: error.message,
    });
  }
};

// Obter produtos em um local específico
exports.obterProdutosNoLocal = async (req, res) => {
  try {
    const localId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const local = await Local.findById(localId);

    if (!local) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Local não encontrado",
      });
    }

    // Buscar estoque com join em produtos
    const estoques = await Estoque.find({ local: local.nome })
      .skip(skip)
      .limit(limit)
      .populate("produto", "id nome tipo categoria subcategoria imagemUrl")
      .sort({ "produto.nome": 1 });

    const total = await Estoque.countDocuments({ local: local.nome });

    res.status(200).json({
      sucesso: true,
      produtos: estoques.map((estoque) => ({
        estoque: estoque,
        produto: estoque.produto,
      })),
      total,
      pagina: page,
      totalPaginas: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Erro ao listar produtos no local:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao listar produtos no local",
      erro: error.message,
    });
  }
};

// Criar um novo local
exports.criarLocal = async (req, res) => {
  try {
    const { nome, descricao, tipo } = req.body;

    // Validar nome único
    const localExistente = await Local.findOne({ nome });
    if (localExistente) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Já existe um local com este nome",
      });
    }

    // Criar novo local
    const novoLocal = new Local({
      id: gerarIdLocal(nome),
      nome,
      descricao,
      tipo,
      criadoPor: req.usuario.id,
    });

    await novoLocal.save();

    res.status(201).json({
      sucesso: true,
      mensagem: "Local criado com sucesso",
      local: novoLocal,
    });
  } catch (error) {
    console.error("Erro ao criar local:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao criar local",
      erro: error.message,
    });
  }
};

// Atualizar um local
exports.atualizarLocal = async (req, res) => {
  try {
    const { nome, descricao, tipo, ativo } = req.body;
    const localId = req.params.id;

    const local = await Local.findById(localId);

    if (!local) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Local não encontrado",
      });
    }

    // Verificar se o novo nome já existe (se estiver mudando o nome)
    if (nome && nome !== local.nome) {
      const localExistente = await Local.findOne({ nome });
      if (localExistente) {
        return res.status(400).json({
          sucesso: false,
          mensagem: "Já existe um local com este nome",
        });
      }
    }

    // Atualizar campos se fornecidos
    if (nome) local.nome = nome;
    if (descricao !== undefined) local.descricao = descricao;
    if (tipo) local.tipo = tipo;
    if (ativo !== undefined) local.ativo = ativo;

    local.ultimaAtualizacao = Date.now();

    await local.save();

    // Se o nome foi alterado, atualizar o nome em todas as referências
    if (nome && nome !== local.nome) {
      await atualizarReferenciasLocal(local.nome, nome);
    }

    res.status(200).json({
      sucesso: true,
      mensagem: "Local atualizado com sucesso",
      local,
    });
  } catch (error) {
    console.error("Erro ao atualizar local:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao atualizar local",
      erro: error.message,
    });
  }
};

// Função auxiliar para atualizar referências quando o nome do local muda
const atualizarReferenciasLocal = async (nomeAntigo, nomeNovo) => {
  await Estoque.updateMany(
    { local: nomeAntigo },
    { $set: { local: nomeNovo } }
  );

  await Movimentacao.updateMany(
    { localOrigem: nomeAntigo },
    { $set: { localOrigem: nomeNovo } }
  );

  await Movimentacao.updateMany(
    { localDestino: nomeAntigo },
    { $set: { localDestino: nomeNovo } }
  );

  await Venda.updateMany({ local: nomeAntigo }, { $set: { local: nomeNovo } });
};

// Remover um local
exports.removerLocal = async (req, res) => {
  try {
    const localId = req.params.id;

    const local = await Local.findById(localId);

    if (!local) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Local não encontrado",
      });
    }

    // Verificar se há produtos neste local
    const produtosNoLocal = await Estoque.countDocuments({ local: local.nome });

    if (produtosNoLocal > 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: `Não é possível remover este local pois existem ${produtosNoLocal} produtos associados a ele`,
        produtosNoLocal,
      });
    }

    // Verificar se há vendas ou movimentações com este local
    const vendasNoLocal = await Venda.countDocuments({ local: local.nome });
    const movimentacoesOrigem = await Movimentacao.countDocuments({
      localOrigem: local.nome,
    });
    const movimentacoesDestino = await Movimentacao.countDocuments({
      localDestino: local.nome,
    });

    if (
      vendasNoLocal > 0 ||
      movimentacoesOrigem > 0 ||
      movimentacoesDestino > 0
    ) {
      return res.status(400).json({
        sucesso: false,
        mensagem:
          "Este local está sendo usado em vendas ou movimentações. Considere desativá-lo em vez de removê-lo.",
        referencias: {
          vendas: vendasNoLocal,
          movimentacoesOrigem,
          movimentacoesDestino,
        },
      });
    }

    // Remover o local
    await Local.deleteOne({ _id: localId });

    res.status(200).json({
      sucesso: true,
      mensagem: "Local removido com sucesso",
    });
  } catch (error) {
    console.error("Erro ao remover local:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao remover local",
      erro: error.message,
    });
  }
};

// Listar tipos de locais disponíveis
exports.listarTiposLocais = async (req, res) => {
  try {
    const tipos = [
      { id: "deposito", nome: "Depósito" },
      { id: "prateleira", nome: "Prateleira" },
      { id: "vitrine", nome: "Vitrine" },
      { id: "reserva", nome: "Reserva" },
      { id: "outro", nome: "Outro" },
    ];

    res.status(200).json({
      sucesso: true,
      tipos,
    });
  } catch (error) {
    console.error("Erro ao listar tipos de locais:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao listar tipos de locais",
      erro: error.message,
    });
  }
};

// Para compatibilidade com o sistema atual - retorna apenas os nomes dos locais ativos
exports.listarNomesLocais = async (req, res) => {
  try {
    const locais = await Local.find({ ativo: true })
      .select("nome")
      .sort({ nome: 1 });
    const nomesLocais = locais.map((local) => local.nome);

    res.status(200).json(nomesLocais);
  } catch (error) {
    console.error("Erro ao listar nomes de locais:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao listar nomes de locais",
      erro: error.message,
    });
  }
};
