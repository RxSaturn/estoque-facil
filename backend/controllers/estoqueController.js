const Estoque = require("../models/Estoque");
const Movimentacao = require("../models/Movimentacao");
const Produto = require("../models/Produto");

// Verificar estoque de um produto em um local
exports.verificarEstoque = async (req, res) => {
  try {
    const { produto, local } = req.query;

    if (!produto || !local) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Produto e local são obrigatórios",
      });
    }

    const estoque = await Estoque.findOne({
      produto,
      local,
    });

    return res.status(200).json({
      sucesso: true,
      quantidade: estoque ? estoque.quantidade : 0,
    });
  } catch (error) {
    console.error("Erro ao verificar estoque:", error);
    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao verificar estoque",
    });
  }
};

// Transferir produto entre locais
exports.transferir = async (req, res) => {
  try {
    const { produto, localOrigem, localDestino, quantidade, data, observacao } =
      req.body;

    // Validações básicas
    if (!produto || !localOrigem || !localDestino || !quantidade) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Todos os campos são obrigatórios",
      });
    }

    if (localOrigem === localDestino) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Os locais de origem e destino devem ser diferentes",
      });
    }

    // Verificar se há estoque suficiente
    const estoqueOrigem = await Estoque.findOne({
      produto,
      local: localOrigem,
    });
    if (!estoqueOrigem || estoqueOrigem.quantidade < quantidade) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Estoque insuficiente para transferência",
      });
    }

    // Atualizar estoque de origem (diminuir)
    estoqueOrigem.quantidade -= parseInt(quantidade);
    estoqueOrigem.ultimaAtualizacao = new Date();
    estoqueOrigem.atualizadoPor = req.usuario.id;
    await estoqueOrigem.save();

    // Atualizar ou criar estoque de destino (aumentar)
    let estoqueDestino = await Estoque.findOne({
      produto,
      local: localDestino,
    });
    if (estoqueDestino) {
      estoqueDestino.quantidade += parseInt(quantidade);
      estoqueDestino.ultimaAtualizacao = new Date();
      estoqueDestino.atualizadoPor = req.usuario.id;
      await estoqueDestino.save();
    } else {
      estoqueDestino = await Estoque.create({
        produto,
        local: localDestino,
        quantidade: parseInt(quantidade),
        dataRegistro: new Date(),
        ultimaAtualizacao: new Date(),
        atualizadoPor: req.usuario.id,
      });
    }

    // Registrar movimentação
    await Movimentacao.create({
      tipo: "transferencia",
      produto,
      quantidade: parseInt(quantidade),
      localOrigem,
      localDestino,
      data: data ? new Date(data) : new Date(),
      realizadoPor: req.usuario.id,
      observacao,
    });

    res.status(200).json({
      sucesso: true,
      mensagem: "Transferência realizada com sucesso",
      origem: estoqueOrigem,
      destino: estoqueDestino,
    });
  } catch (error) {
    console.error("Erro na transferência:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao processar transferência",
    });
  }
};

// Listar locais disponíveis
exports.listarLocais = async (req, res) => {
  try {
    // Implementação simplificada - em produção buscar do banco de dados
    res
      .status(200)
      .json([
        "Loja Central",
        "Depósito A",
        "Depósito B",
        "Filial 1",
        "Filial 2",
      ]);
  } catch (error) {
    console.error("Erro ao listar locais:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao listar locais",
    });
  }
};

// Obter produtos com estoque baixo
exports.obterProdutosBaixoEstoque = async (req, res) => {
  try {
    // Buscar produtos com estoque menor ou igual ao mínimo
    const produtos = await Produto.find({
      $expr: { $lte: ["$quantidade", "$estoqueMinimo"] },
    });

    // Transformar para o formato esperado
    const resultado = produtos.map((p) => ({
      id: p._id,
      nome: p.nome,
      estoqueAtual: p.quantidade || 0,
      estoqueMinimo: p.estoqueMinimo || 10,
      local: p.local || "Depósito Principal",
    }));

    res.json(resultado);
  } catch (error) {
    console.error("Erro ao buscar produtos com estoque baixo:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao buscar produtos com estoque baixo",
      erro: error.message,
    });
  }
};

// Obter todo o estoque (função que falta)
exports.obterTodoEstoque = async (req, res) => {
  try {
    const estoques = await Estoque.find().populate("produto");

    // Calcular total de itens em estoque
    const total = estoques.reduce((sum, item) => sum + item.quantidade, 0);

    res.status(200).json({
      sucesso: true,
      estoques,
      total,
    });
  } catch (error) {
    console.error("Erro ao obter estoques:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao obter dados de estoque",
    });
  }
};
