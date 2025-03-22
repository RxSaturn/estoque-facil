const express = require('express');
const router = express.Router();
const { proteger } = require('../middlewares/auth');
const Produto = require('../models/Produto');
const Estoque = require('../models/Estoque');
const Movimentacao = require('../models/Movimentacao');

// Registrar uma movimentação (entrada, saída, transferência)
router.post('/', proteger, async (req, res) => {
  try {
    const { tipo, produto, quantidade, localOrigem, localDestino, data, observacao } = req.body;
        
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
    
    // Tratar a data para garantir que seja armazenada corretamente
    const dataMovimentacao = data ? new Date(data) : new Date();

    if (tipo === 'entrada') {
      // Verificar se já existe um registro de estoque para este produto e local
      let estoque = await Estoque.findOne({ 
        produto: produto,
        local: localOrigem
      });
      
      if (estoque) {
        // Atualizar estoque existente
        estoque.quantidade += parseInt(quantidade);
        estoque.ultimaAtualizacao = dataMovimentacao;
        estoque.atualizadoPor = req.usuario.id;
        await estoque.save();
      } else {
        // Criar novo registro de estoque
        estoque = await Estoque.create({
          produto: produto,
          local: localOrigem,
          quantidade: parseInt(quantidade),
          ultimaAtualizacao: dataMovimentacao,
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
      estoqueOrigem.ultimaAtualizacao = dataMovimentacao;
      estoqueOrigem.atualizadoPor = req.usuario.id;
      await estoqueOrigem.save();
      
      // Adicionar ou atualizar estoque no destino
      let estoqueDestino = await Estoque.findOne({
        produto: produto,
        local: localDestino
      });
      
      if (estoqueDestino) {
        estoqueDestino.quantidade += parseInt(quantidade);
        estoqueDestino.ultimaAtualizacao = dataMovimentacao;
        estoqueDestino.atualizadoPor = req.usuario.id;
        await estoqueDestino.save();
      } else {
        estoqueDestino = await Estoque.create({
          produto: produto,
          local: localDestino,
          quantidade: parseInt(quantidade),
          ultimaAtualizacao: dataMovimentacao,
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
      estoque.ultimaAtualizacao = dataMovimentacao;
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
      data: dataMovimentacao,
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
    
    console.log('Parâmetros de busca recebidos:', {
      dataInicio,
      dataFim,
      produto,
      localOrigem,
      tipo
    });
    
    // Construir filtro
    const filtro = {};
    
    // Tratamento de datas com validação
    if (dataInicio && dataFim) {
      try {
        const inicio = new Date(dataInicio);
        const fim = new Date(dataFim);
        
        console.log('Datas processadas:', {
          dataInicioRaw: dataInicio,
          dataFimRaw: dataFim,
          dataInicioObj: inicio.toISOString(),
          dataFimObj: fim.toISOString()
        });
        
        // Verificar se as datas são válidas
        if (!isNaN(inicio.getTime()) && !isNaN(fim.getTime())) {
          filtro.data = {
            $gte: inicio,
            $lte: fim
          };
          console.log('Filtro de data aplicado:', filtro.data);
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
      // Caso especial para atualizações
      if (tipo === 'atualizacao') {
        // Usar operador $or para buscar tanto tipo 'atualizacao' quanto 'entrada' com observação de atualização
        filtro.$or = [
          { tipo: 'atualizacao' },
          { 
            tipo: 'entrada', 
            observacao: { $regex: /Produto atualizado/i }
          }
        ];
        console.log('Filtrando por atualizações de produto (lógica especial)');
      }
      // Caso especial para entrada - EXCLUIR atualizações
      else if (tipo === 'entrada') {
        filtro.tipo = 'entrada';
        // Excluir entradas que são atualizações
        filtro.observacao = { $not: { $regex: /Produto atualizado/i } };
        console.log('Filtrando por entradas regulares (excluindo atualizações)');
      }
      else {
        // Para outros tipos, filtro normal
        filtro.tipo = tipo;
        console.log('Filtrando por tipo:', tipo);
      }
    }
    
    console.log('Filtro final:', filtro);
    
    // Buscar todas as movimentações sem filtrar produtos nulos
    const movimentacoes = await Movimentacao.find(filtro)
      .populate('produto', 'id nome tipo categoria subcategoria')
      .populate('realizadoPor', 'nome')
      .sort({ data: -1 });
    
    // log para depuração
    console.log(`Encontradas ${movimentacoes.length} movimentações - Exemplo:`, 
      movimentacoes.length > 0 ? {
        _id: movimentacoes[0]._id,
        tipo: movimentacoes[0].tipo,
        realizadoPor: movimentacoes[0].realizadoPor
      } : 'Nenhuma');
    
    res.status(200).json({
      sucesso: true,
      contagem: movimentacoes.length,
      movimentacoes: movimentacoes
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
