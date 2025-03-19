const Estoque = require('../models/Estoque');
const Movimentacao = require('../models/Movimentacao');
const Venda = require('../models/Venda');

// Registrar uma venda
exports.registrarVenda = async (req, res) => {
  try {
    const { produto, quantidade, local, data, observacao } = req.body;
    
    console.log('Dados recebidos para registrar venda:', req.body);
    
    // Validações básicas mais detalhadas
    const camposFaltantes = [];
    if (!produto) camposFaltantes.push('produto');
    if (!quantidade) camposFaltantes.push('quantidade');
    if (!local) camposFaltantes.push('local');
    
    if (camposFaltantes.length > 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: `Campos obrigatórios não informados: ${camposFaltantes.join(', ')}`
      });
    }
    
    // Verificar se há estoque suficiente
    const estoque = await Estoque.findOne({ produto, local });
    if (!estoque) {
      return res.status(400).json({
        sucesso: false,
        mensagem: `Não há estoque cadastrado para este produto no local ${local}`
      });
    }
    
    if (estoque.quantidade < quantidade) {
      return res.status(400).json({
        sucesso: false,
        mensagem: `Estoque insuficiente. Disponível: ${estoque.quantidade}, Solicitado: ${quantidade}`
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
      observacao: observacao || 'Venda de produto'
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
      mensagem: 'Erro ao registrar venda',
      erro: error.message
    });
  }
};

// Listar vendas
exports.listarVendas = async (req, res) => {
  try {
    const { dataInicio, dataFim, produto, local } = req.query;
    
    console.log('Parâmetros de busca recebidos:', { dataInicio, dataFim, produto, local });
    
    // Construir filtro
    const filtro = {};
    
    // Tratamento de datas com validação
    if (dataInicio && dataFim) {
      try {
        const inicio = new Date(dataInicio);
        const fim = new Date(dataFim);
        
        // Verificar se as datas são válidas
        if (!isNaN(inicio.getTime()) && !isNaN(fim.getTime())) {
          filtro.dataVenda = {
            $gte: inicio,
            $lte: fim
          };
          console.log('Filtrando por período:', inicio, 'até', fim);
        } else {
          console.warn('Datas inválidas fornecidas:', { dataInicio, dataFim });
        }
      } catch (err) {
        console.error('Erro ao processar datas:', err);
      }
    }
    
    if (produto) {
      filtro.produto = produto;
      console.log('Filtrando por produto:', produto);
    }
    
    if (local) {
      filtro.local = local;
      console.log('Filtrando por local:', local);
    }
    
    console.log('Filtro de busca montado:', JSON.stringify(filtro));
    
    // Buscar vendas com populate para obter detalhes do produto
    const vendas = await Venda.find(filtro)
      .populate('produto', 'id nome tipo categoria subcategoria')
      .populate('registradoPor', 'nome')
      .sort({ dataVenda: -1 });
    
    console.log(`Encontradas ${vendas.length} vendas`);
    
    res.status(200).json({
      sucesso: true,
      contagem: vendas.length,
      vendas
    });
  } catch (error) {
    console.error('Erro ao listar vendas:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao listar vendas',
      erro: error.message
    });
  }
};
