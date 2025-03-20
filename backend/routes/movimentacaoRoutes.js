const express = require('express');
const router = express.Router();
const { proteger } = require('../middlewares/auth');
const Produto = require('../models/Produto');
const Estoque = require('../models/Estoque');
const Movimentacao = require('../models/Movimentacao');

// Registrar uma movimentação (entrada, saída, transferência)
router.post('/', proteger, async (req, res) => {
  try {
    const { tipo, produto, quantidade, localOrigem, localDestino, observacao } = req.body;
    
    console.log('Dados recebidos:', { tipo, produto, quantidade, localOrigem, localDestino });
    
    // Validar tipo de movimentação
    if (!['entrada', 'saida', 'transferencia', 'venda'].includes(tipo)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Tipo de movimentação inválido'
      });
    }
    
    // Validar campos obrigatórios
    if (!produto || !quantidade || quantidade <= 0 || !localOrigem) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Dados incompletos ou inválidos para a movimentação'
      });
    }
    
    // Validar produto
    const produtoExiste = await Produto.findById(produto);
    if (!produtoExiste) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Produto não encontrado'
      });
    }
    
    // Para transferência, verificar se localDestino foi informado
    if (tipo === 'transferencia' && !localDestino) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Local de destino é obrigatório para transferências'
      });
    }
    
    // Para tipos que não são entrada, verificar estoque disponível
    if (tipo !== 'entrada') {
      const estoque = await Estoque.findOne({
        produto: produto,
        local: localOrigem
      });
      
      if (!estoque || estoque.quantidade < quantidade) {
        return res.status(400).json({
          sucesso: false,
          mensagem: 'Estoque insuficiente para esta movimentação'
        });
      }
    }
    
    // Processar movimentação com base no tipo
    let resultadoOperacao;
    
    if (tipo === 'entrada') {
      // Verificar se já existe um registro de estoque para este produto e local
      let estoque = await Estoque.findOne({ 
        produto: produto,
        local: localOrigem
      });
      
      if (estoque) {
        // Atualizar estoque existente
        estoque.quantidade += parseInt(quantidade);
        estoque.ultimaAtualizacao = new Date();
        estoque.atualizadoPor = req.usuario.id;
        await estoque.save();
      } else {
        // Criar novo registro de estoque
        estoque = await Estoque.create({
          produto: produto,
          local: localOrigem,
          quantidade: parseInt(quantidade),
          atualizadoPor: req.usuario.id
        });
      }
      
      resultadoOperacao = estoque;
    } else if (tipo === 'transferencia') {
      // Verificar estoque na origem
      let estoqueOrigem = await Estoque.findOne({
        produto: produto,
        local: localOrigem
      });
      
      if (!estoqueOrigem || estoqueOrigem.quantidade < quantidade) {
        return res.status(400).json({
          sucesso: false,
          mensagem: 'Estoque insuficiente para transferência'
        });
      }
      
      // Reduzir estoque na origem
      estoqueOrigem.quantidade -= parseInt(quantidade);
      estoqueOrigem.ultimaAtualizacao = new Date();
      estoqueOrigem.atualizadoPor = req.usuario.id;
      await estoqueOrigem.save();
      
      // Adicionar ou atualizar estoque no destino
      let estoqueDestino = await Estoque.findOne({
        produto: produto,
        local: localDestino
      });
      
      if (estoqueDestino) {
        estoqueDestino.quantidade += parseInt(quantidade);
        estoqueDestino.ultimaAtualizacao = new Date();
        estoqueDestino.atualizadoPor = req.usuario.id;
        await estoqueDestino.save();
      } else {
        estoqueDestino = await Estoque.create({
          produto: produto,
          local: localDestino,
          quantidade: parseInt(quantidade),
          atualizadoPor: req.usuario.id
        });
      }
      
      resultadoOperacao = { origem: estoqueOrigem, destino: estoqueDestino };
    } else {
      // Saída ou venda - reduzir estoque
      let estoque = await Estoque.findOne({
        produto: produto,
        local: localOrigem
      });
      
      if (!estoque || estoque.quantidade < quantidade) {
        return res.status(400).json({
          sucesso: false,
          mensagem: 'Estoque insuficiente'
        });
      }
      
      estoque.quantidade -= parseInt(quantidade);
      estoque.ultimaAtualizacao = new Date();
      estoque.atualizadoPor = req.usuario.id;
      await estoque.save();
      
      resultadoOperacao = estoque;
    }
    
    // Registrar a movimentação
    const movimentacao = await Movimentacao.create({
      tipo,
      produto,
      quantidade: parseInt(quantidade),
      localOrigem,
      localDestino: localDestino || undefined,
      realizadoPor: req.usuario.id,
      observacao
    });
    
    res.status(201).json({
      sucesso: true,
      mensagem: 'Movimentação registrada com sucesso',
      movimentacao,
      resultado: resultadoOperacao
    });
  } catch (error) {
    console.error('Erro ao criar movimentação:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao processar movimentação'
    });
  }
});

// Listar histórico de movimentações
router.get('/historico', proteger, async (req, res) => {
  try {
    const { dataInicio, dataFim, produto, localOrigem, tipo } = req.query;
    
    console.log('Parâmetros de busca recebidos:', { dataInicio, dataFim, produto, localOrigem, tipo });
    
    // Construir filtro
    const filtro = {};
    
    // Tratamento de datas com validação
    if (dataInicio && dataFim) {
      try {
        const inicio = new Date(dataInicio);
        const fim = new Date(dataFim);
        
        // Ajustar dataFim para incluir todo o dia
        fim.setHours(23, 59, 59, 999);
        
        // Verificar se as datas são válidas
        if (!isNaN(inicio.getTime()) && !isNaN(fim.getTime())) {
          filtro.data = {
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
    
    if (localOrigem) {
      filtro.localOrigem = localOrigem;
      console.log('Filtrando por localOrigem:', localOrigem);
    }
    
    if (tipo) {
      filtro.tipo = tipo;
      console.log('Filtrando por tipo:', tipo);
    }
    
    // Garantir que apenas movimentações com produtos válidos sejam retornadas
    filtro.produto = { $ne: null };
    
    console.log('Filtro de busca montado:', JSON.stringify(filtro));
    
    // Buscar movimentações com populate para obter detalhes do produto e realizador
    const movimentacoes = await Movimentacao.find(filtro)
      .populate('produto', 'id nome tipo categoria subcategoria')
      .populate('realizadoPor', 'nome')
      .sort({ data: -1 });
    
    // Filtrar movimentações para garantir que apenas aquelas com produto preenchido sejam retornadas
    const movimentacoesFiltradas = movimentacoes.filter(m => m.produto !== null);
    
    console.log(`Encontradas ${movimentacoesFiltradas.length} movimentações válidas`);
    
    res.status(200).json({
      sucesso: true,
      contagem: movimentacoesFiltradas.length,
      movimentacoes: movimentacoesFiltradas
    });
  } catch (error) {
    console.error('Erro ao listar movimentações:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao listar movimentações',
      erro: error.message
    });
  }
});

module.exports = router;
