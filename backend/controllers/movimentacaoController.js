const Produto = require('../models/Produto');
const Estoque = require('../models/Estoque');
const Movimentacao = require('../models/Movimentacao');
const EstoqueService = require('../services/EstoqueService');

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

    await EstoqueService.atualizarFlagsProduto(produto);

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

// Excluir uma movimentação
exports.excluirMovimentacao = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se a movimentação existe
    const movimentacao = await Movimentacao.findById(id);
    if (!movimentacao) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Movimentação não encontrada'
      });
    }
    
    // Verificar se não é uma movimentação muito antiga (regra de negócio)
    const dataMovimentacao = new Date(movimentacao.data);
    const dataAtual = new Date();
    const diferencaDias = Math.floor((dataAtual - dataMovimentacao) / (1000 * 60 * 60 * 24));
    
    if (diferencaDias > 30) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Não é possível excluir movimentações com mais de 30 dias'
      });
    }

    // Verificar se o produto existe ou foi removido
    const produtoExiste = movimentacao.produto ? 
      await Produto.findById(movimentacao.produto) : null;
    
    // Após excluir a movimentação, atualizar flags do produto se ele existir
    if (!isProdutoRemovido && movimentacao.produto) {
      await EstoqueService.atualizarFlagsProduto(movimentacao.produto);
    }
    
    const isProdutoRemovido = !produtoExiste && movimentacao.produto;
    const isAtualizacaoProduto = movimentacao.tipo === 'atualizacao' || 
      (movimentacao.tipo === 'entrada' && movimentacao.observacao?.includes('Produto atualizado'));
    
    // VERIFICAÇÃO DE ESTOQUE NEGATIVO PARA ENTRADAS
    if (movimentacao.tipo === 'entrada' && !isProdutoRemovido && !isAtualizacaoProduto) {
      // Buscar o estoque atual do produto no local de origem
      const estoqueAtual = await Estoque.findOne({
        produto: movimentacao.produto,
        local: movimentacao.localOrigem
      });
      
      // Se o estoque não existir ou for menor que a quantidade da entrada
      if (!estoqueAtual || estoqueAtual.quantidade < movimentacao.quantidade) {
        return res.status(400).json({
          sucesso: false,
          mensagem: `Não é possível excluir esta entrada de estoque. ${estoqueAtual ? 'O estoque atual é de ' + estoqueAtual.quantidade + ' unidades, mas a entrada foi de ' + movimentacao.quantidade + ' unidades.' : 'O registro de estoque não foi encontrado.'}`,
          detalhe: 'A exclusão resultaria em estoque negativo, o que indica que os itens já foram consumidos em outras operações.'
        });
      }
    }
    
    // VERIFICAÇÃO DE ESTOQUE NEGATIVO PARA TRANSFERÊNCIAS
    if (movimentacao.tipo === 'transferencia' && !isProdutoRemovido) {
      // Verificar se há estoque suficiente no local de destino para reverter
      const estoqueDestino = await Estoque.findOne({
        produto: movimentacao.produto,
        local: movimentacao.localDestino
      });
      
      if (!estoqueDestino || estoqueDestino.quantidade < movimentacao.quantidade) {
        return res.status(400).json({
          sucesso: false,
          mensagem: `Não é possível excluir esta transferência. ${estoqueDestino ? 'O estoque atual no destino é de ' + estoqueDestino.quantidade + ' unidades, mas a transferência foi de ' + movimentacao.quantidade + ' unidades.' : 'O registro de estoque no destino não foi encontrado.'}`,
          detalhe: 'A exclusão resultaria em estoque negativo no local de destino, o que indica que os itens já foram movimentados ou vendidos.'
        });
      }
    }
    
    // VERIFICAÇÃO DE DEPENDÊNCIAS DE MOVIMENTAÇÕES
    // Verificar se existem movimentações subsequentes que dependem desta
    if (movimentacao.tipo === 'entrada' || movimentacao.tipo === 'transferencia') {
      // Calcular a data da movimentação + 1 segundo para garantir que pegue apenas as posteriores
      const dataAposMovimentacao = new Date(movimentacao.data);
      dataAposMovimentacao.setSeconds(dataAposMovimentacao.getSeconds() + 1);
      
      // Buscar movimentações subsequentes do mesmo produto
      const movimentacoesPosteriores = await Movimentacao.find({
        produto: movimentacao.produto,
        data: { $gt: dataAposMovimentacao },
        _id: { $ne: movimentacao._id } // Excluir a própria movimentação
      }).sort({ data: 1 }).limit(1); // Pegar a primeira subsequente
      
      if (movimentacoesPosteriores.length > 0) {
        const primeiraMovPosterior = movimentacoesPosteriores[0];
        const dataFormatada = new Date(primeiraMovPosterior.data).toLocaleDateString();
        
        // Podemos escolher bloquear ou apenas avisar
        return res.status(400).json({
          sucesso: false,
          mensagem: `Não é possível excluir esta movimentação porque existem operações posteriores dependentes dela (${dataFormatada}).`,
          detalhe: 'Para manter a integridade do histórico e da rastreabilidade, exclua as movimentações na ordem inversa da ocorrência.'
        });
      }
    }
    
    // APLICAR REGRAS ESPECÍFICAS PARA ATUALIZAÇÃO DE ESTOQUE
    if (!isProdutoRemovido && 
        movimentacao.tipo !== 'saida' && 
        !isAtualizacaoProduto) {
      
      // Só atualiza o estoque para entradas e transferências com produto existente
      if (movimentacao.tipo === 'entrada') {
        // Se foi uma entrada, remover a quantidade do estoque
        await Estoque.findOneAndUpdate(
          { produto: movimentacao.produto, local: movimentacao.localOrigem },
          { $inc: { quantidade: -movimentacao.quantidade } }
        );
      } else if (movimentacao.tipo === 'transferencia') {
        // Se foi uma transferência, reverter ambas as operações
        await Estoque.findOneAndUpdate(
          { produto: movimentacao.produto, local: movimentacao.localOrigem },
          { $inc: { quantidade: movimentacao.quantidade } }
        );
        
        await Estoque.findOneAndUpdate(
          { produto: movimentacao.produto, local: movimentacao.localDestino },
          { $inc: { quantidade: -movimentacao.quantidade } }
        );
      }
    }

    // Remover a movimentação
    await Movimentacao.findByIdAndDelete(id);
    
    // Registrar a ação no log
    console.log(`Movimentação ${id} excluída por ${req.usuario.id} em ${new Date().toISOString()}`);
    
    res.status(200).json({
      sucesso: true,
      mensagem: 'Movimentação excluída com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir movimentação:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao excluir movimentação',
      erro: error.message
    });
  }
};

// Exclui todas as movimentações associadas a produtos que não existem mais
exports.excluirMovimentacoesProdutosRemovidos = async (req, res) => {
  try {
    // Primeiro, coletamos todas as movimentações
    const todasMovimentacoes = await Movimentacao.find({
      produto: { $ne: null } // Apenas movimentações que têm referência a um produto
    });
    
    // Lista para armazenar IDs de movimentações a serem excluídas
    const movimentacoesParaExcluir = [];
    
    // Para cada movimentação, verificamos se o produto ainda existe
    for (const movimentacao of todasMovimentacoes) {
      const produtoExiste = await Produto.findById(movimentacao.produto);
      
      if (!produtoExiste) {
        movimentacoesParaExcluir.push(movimentacao._id);
      }
    }
    
    // Se não houver movimentações para excluir
    if (movimentacoesParaExcluir.length === 0) {
      return res.status(200).json({
        sucesso: true,
        mensagem: 'Nenhuma movimentação de produto removido encontrada',
        quantidade: 0
      });
    }
    
    // Se apenas estamos verificando a quantidade (preview)
    if (req.query.preview === 'true') {
      return res.status(200).json({
        sucesso: true,
        mensagem: `Encontradas ${movimentacoesParaExcluir.length} movimentações de produtos removidos`,
        quantidade: movimentacoesParaExcluir.length
      });
    }
    
    // Excluir todas as movimentações de uma vez
    await Movimentacao.deleteMany({
      _id: { $in: movimentacoesParaExcluir }
    });
    
    // Registrar a ação no log do sistema
    console.log(`${movimentacoesParaExcluir.length} movimentações de produtos removidos excluídas por ${req.usuario.nome} (${req.usuario.id}) em ${new Date().toISOString()}`);
    
    res.status(200).json({
      sucesso: true,
      mensagem: `${movimentacoesParaExcluir.length} movimentações de produtos removidos foram excluídas com sucesso`,
      quantidade: movimentacoesParaExcluir.length
    });
  } catch (error) {
    console.error('Erro ao excluir movimentações de produtos removidos:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao excluir movimentações de produtos removidos',
      erro: error.message
    });
  }
};
