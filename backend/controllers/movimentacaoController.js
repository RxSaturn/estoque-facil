const Produto = require('../models/Produto');
const Estoque = require('../models/Estoque');
const Movimentacao = require('../models/Movimentacao');

// Criar movimentação de estoque
exports.criarMovimentacao = async (req, res) => {
  try {
    const { tipo, produto, quantidade, localOrigem, localDestino, data, observacao } = req.body;
    
    // Logs detalhados para depuração
    console.log('Recebido no backend - CORPO COMPLETO:', req.body);
    console.log('Data recebida:', data);
    console.log('Tipo da data:', typeof data);

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

    console.log('Data após processamento:', dataMovimentacao);

    if (tipo === 'entrada') {
      // Verificar se já existe um registro de estoque para este produto e local
      let estoque = await Estoque.findOne({
        produto: produto,
        local: localOrigem
      });

      if (estoque) {
        // Atualizar estoque existente
        estoque.quantidade += parseInt(quantidade);
        estoque.ultimaAtualizacao = dataMovimentacao; // Usar a data fornecida
        estoque.atualizadoPor = req.usuario.id;
        await estoque.save();
      } else {
        // Criar novo registro de estoque
        estoque = await Estoque.create({
          produto: produto,
          local: localOrigem,
          quantidade: parseInt(quantidade),
          ultimaAtualizacao: dataMovimentacao, // Usar a data fornecida
          atualizadoPor: req.usuario.id
        });
      }

      resultadoOperacao = estoque;
    } else if (tipo === 'transferencia') {
      // Subtrair do estoque de origem
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

      estoqueOrigem.quantidade -= parseInt(quantidade);
      estoqueOrigem.ultimaAtualizacao = new Date();
      estoqueOrigem.atualizadoPor = req.usuario.id;
      await estoqueOrigem.save();

      // Adicionar ao estoque de destino
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
          ultimaAtualizacao: new Date(),
          atualizadoPor: req.usuario.id
        });
      }

      resultadoOperacao = { origem: estoqueOrigem, destino: estoqueDestino };
    } else {
      // Para saída ou venda, subtrair do estoque de origem
      let estoque = await Estoque.findOne({
        produto: produto,
        local: localOrigem
      });

      if (!estoque || estoque.quantidade < quantidade) {
        return res.status(400).json({
          sucesso: false,
          mensagem: 'Estoque insuficiente para esta movimentação'
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
      data: dataMovimentacao, // Usar o objeto Date já convertido
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
};
