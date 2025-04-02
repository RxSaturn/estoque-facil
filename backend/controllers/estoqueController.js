const Estoque = require("../models/Estoque");
const Movimentacao = require("../models/Movimentacao");
const Produto = require("../models/Produto");
const EstoqueService = require("../services/EstoqueService");

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

    // Calcular o status do estoque
    let status = Estoque.NIVEL_ESTOQUE.NORMAL;
    let quantidade = 0;
    
    if (estoque) {
      quantidade = estoque.quantidade;
      status = estoque.calcularStatus();
    } else {
      status = Estoque.NIVEL_ESTOQUE.ESGOTADO;
    }

    return res.status(200).json({
      sucesso: true,
      quantidade,
      status,
      limites: Estoque.LIMITE_ESTOQUE
    });
  } catch (error) {
    console.error("Erro ao verificar estoque:", error);
    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao verificar estoque",
    });
  }
};

// Obter produtos com estoque baixo
exports.obterProdutosBaixoEstoque = async (req, res) => {
  try {
    const {
      nivel = 'todos',
      local,
      categoria,
      subcategoria,
      page = 1,
      limit = 10
    } = req.query;

    // Converter parâmetros numéricos
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Usar o serviço de estoque para buscar os produtos
    const resultado = await EstoqueService.buscarProdutosEstoqueBaixo({
      nivel,
      local,
      categoria,
      subcategoria,
      page: pageNum,
      limit: limitNum
    });

    return res.status(200).json({
      sucesso: true,
      produtos: resultado.resultados,
      paginacao: resultado.paginacao,
      limites: Estoque.LIMITE_ESTOQUE,
      niveis: Estoque.NIVEL_ESTOQUE
    });
  } catch (error) {
    console.error("Erro ao buscar produtos com estoque baixo:", error);
    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao buscar produtos com estoque baixo",
      erro: error.message
    });
  }
};

// Atualizar flags de estoque em todos os produtos
exports.atualizarFlagsEstoque = async (req, res) => {
  try {
    const resultado = await EstoqueService.atualizarFlagsEstoque();
    
    if (resultado.sucesso) {
      return res.status(200).json({
        sucesso: true,
        mensagem: "Flags de estoque atualizadas com sucesso",
        detalhes: resultado.produtosAtualizados
      });
    } else {
      return res.status(500).json({
        sucesso: false,
        mensagem: "Erro ao atualizar flags de estoque",
        erro: resultado.erro
      });
    }
  } catch (error) {
    console.error("Erro ao atualizar flags de estoque:", error);
    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao atualizar flags de estoque",
      erro: error.message
    });
  }
};

// Obter estatísticas de estoque
exports.obterEstatisticasEstoque = async (req, res) => {
  try {
    const estatisticas = await EstoqueService.obterEstatisticasEstoque();
    
    return res.status(200).json({
      sucesso: true,
      estatisticas,
      limites: Estoque.LIMITE_ESTOQUE
    });
  } catch (error) {
    console.error("Erro ao obter estatísticas de estoque:", error);
    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao obter estatísticas de estoque",
      erro: error.message
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

    // Atualizar flags de estoque do produto
    await EstoqueService.atualizarFlagsProduto(produto);

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
    // Buscar locais distintos do banco de dados
    const locais = await Estoque.distinct('local');
    res.status(200).json(locais);
  } catch (error) {
    console.error("Erro ao listar locais:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao listar locais",
    });
  }
};

// Obter todo o estoque
exports.obterTodoEstoque = async (req, res) => {
  try {
    const {
      produto,
      local,
      status,
      page = 1,
      limit = 20
    } = req.query;

    // Converter para números
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    // Construir filtro
    const filtro = {};
    
    if (produto) filtro.produto = produto;
    if (local) filtro.local = local;
    
    // Filtrar por status se fornecido
    if (status) {
      switch(status) {
        case Estoque.NIVEL_ESTOQUE.ESGOTADO:
          filtro.quantidade = 0;
          break;
        case Estoque.NIVEL_ESTOQUE.CRITICO:
          filtro.quantidade = { $gt: 0, $lt: Estoque.LIMITE_ESTOQUE.CRITICO };
          break;
        case Estoque.NIVEL_ESTOQUE.BAIXO:
          filtro.quantidade = { 
            $gte: Estoque.LIMITE_ESTOQUE.CRITICO, 
            $lt: Estoque.LIMITE_ESTOQUE.BAIXO 
          };
          break;
        case Estoque.NIVEL_ESTOQUE.NORMAL:
          filtro.quantidade = { $gte: Estoque.LIMITE_ESTOQUE.BAIXO };
          break;
      }
    }
    
    // Contar total de documentos
    const total = await Estoque.countDocuments(filtro);
    
    // Buscar registros com paginação
    const estoques = await Estoque.find(filtro)
      .populate("produto")
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    // Calcular total de itens em estoque
    const totalQuantidade = estoques.reduce((sum, item) => sum + item.quantidade, 0);

    // Incluir status em cada item
    const estoquesComStatus = estoques.map(estoque => {
      const estoqueObj = estoque.toObject();
      return {
        ...estoqueObj,
        status: estoque.calcularStatus()
      };
    });

    res.status(200).json({
      sucesso: true,
      estoques: estoquesComStatus,
      paginacao: {
        total,
        pagina: pageNum,
        limite: limitNum,
        totalPaginas: Math.ceil(total / limitNum)
      },
      totalQuantidade,
      limites: Estoque.LIMITE_ESTOQUE
    });
  } catch (error) {
    console.error("Erro ao obter estoques:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao obter dados de estoque",
    });
  }
};

// Adicione este método ao estoqueController.js se não existir
exports.getEstoqueCritico = async (req, res) => {
  try {
    // Buscar estoque com quantidade menor que o limite crítico
    const estoqueCritico = await Estoque.find({
      $or: [
        { quantidade: { $lt: 20 } }, // Estoque baixo ou crítico
        { quantidade: 0 } // Estoque zerado
      ]
    }).populate('produto');

    // Formatar dados para retorno
    const produtosFormatados = estoqueCritico.map(item => {
      // Determinar status baseado na quantidade
      let status;
      if (item.quantidade === 0) {
        status = "esgotado";
      } else if (item.quantidade < 10) {
        status = "critico";
      } else if (item.quantidade < 20) {
        status = "baixo";
      }

      return {
        id: item.produto?.id || item._id.toString(),
        nome: item.produto?.nome || "Produto não disponível",
        produtoNome: item.produto?.nome || "Produto não disponível",
        tipo: item.produto?.tipo || "N/A",
        categoria: item.produto?.categoria || "N/A",
        local: item.local || "Local não especificado",
        quantidade: item.quantidade,
        estoqueMinimo: 20, // Valor padrão, pode ser ajustado
        status: status
      };
    });

    res.json(produtosFormatados);
  } catch (error) {
    console.error("Erro ao buscar estoque crítico:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao buscar estoque crítico",
      erro: error.message
    });
  }
};