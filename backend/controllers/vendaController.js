const Estoque = require('../models/Estoque');
const Movimentacao = require('../models/Movimentacao');
const Venda = require('../models/Venda');

// Registrar uma venda
exports.registrarVenda = async (req, res) => {
  try {
    const { produto, quantidade, local, data, observacao } = req.body;
    
    // Validações básicas
    if (!produto || !quantidade || !local) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Todos os campos são obrigatórios'
      });
    }
    
    // Verificar se há estoque suficiente
    const estoque = await Estoque.findOne({ produto, local });
    if (!estoque || estoque.quantidade < quantidade) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Estoque insuficiente para venda'
      });
    }
    
    // Atualizar estoque (diminuir)
    estoque.quantidade -= parseInt(quantidade);
    estoque.ultimaAtualizacao = new Date();
    estoque.atualizadoPor = req.usuario.id;
    await estoque.save();
    
    // Registrar venda
    const venda = await Venda.create({
      produto,
      quantidade: parseInt(quantidade),
      local,
      dataVenda: data ? new Date(data) : new Date(),
      registradoPor: req.usuario.id
    });
    
    // Registrar movimentação
    await Movimentacao.create({
      tipo: 'venda',
      produto,
      quantidade: parseInt(quantidade),
      localOrigem: local,
      data: data ? new Date(data) : new Date(),
      realizadoPor: req.usuario.id,
      observacao
    });
    
    res.status(201).json({
      sucesso: true,
      mensagem: 'Venda registrada com sucesso',
      venda
    });
  } catch (error) {
    console.error('Erro ao registrar venda:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao registrar venda'
    });
  }
};

// Listar vendas
exports.listarVendas = async (req, res) => {
  try {
    const { dataInicio, dataFim, produto, local } = req.query;
    
    // Construir filtro
    const filtro = {};
    
    if (dataInicio && dataFim) {
      filtro.dataVenda = {
        $gte: new Date(dataInicio),
        $lte: new Date(dataFim)
      };
    } else if (dataInicio) {
      filtro.dataVenda = { $gte: new Date(dataInicio) };
    } else if (dataFim) {
      filtro.dataVenda = { $lte: new Date(dataFim) };
    }
    
    if (produto) {
      filtro.produto = produto;
    }
    
    if (local) {
      filtro.local = local;
    }
    
    // Buscar vendas com populate para obter detalhes do produto
    const vendas = await Venda.find(filtro)
      .populate('produto', 'id nome tipo categoria subcategoria')
      .populate('registradoPor', 'nome')
      .sort({ dataVenda: -1 });
    
    res.status(200).json({
      sucesso: true,
      contagem: vendas.length,
      vendas
    });
  } catch (error) {
    console.error('Erro ao listar vendas:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao listar vendas'
    });
  }
};