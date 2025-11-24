const Estoque = require('../models/Estoque');
const Produto = require('../models/Produto');
const mongoose = require('mongoose');

class EstoqueService {
  /**
   * Busca produtos com estoque baixo/crítico/esgotado por local
   * @param {Object} options - Opções de filtro
   * @returns {Promise<Object>} - Resultados paginados
   */
  static async buscarProdutosEstoqueBaixo(options = {}) {
    const {
      nivel = 'todos', // 'baixo', 'critico', 'esgotado', 'todos'
      local = null,
      categoria = null,
      subcategoria = null,
      page = 1,
      limit = 10
    } = options;

    // Construir filtro de quantidade baseado no nível
    let filtroQuantidade = {};
    
    if (nivel === 'baixo') {
      filtroQuantidade = { 
        $gte: Estoque.LIMITE_ESTOQUE.CRITICO, 
        $lt: Estoque.LIMITE_ESTOQUE.BAIXO 
      };
    } else if (nivel === 'critico') {
      filtroQuantidade = { 
        $gt: 0, 
        $lt: Estoque.LIMITE_ESTOQUE.CRITICO 
      };
    } else if (nivel === 'esgotado') {
      filtroQuantidade = { $eq: 0 };
    } else if (nivel === 'todos') {
      filtroQuantidade = { $lt: Estoque.LIMITE_ESTOQUE.BAIXO };
    }

    // Pipeline de agregação
    const pipeline = [];
    
    // Match inicial por quantidade
    pipeline.push({
      $match: {
        quantidade: filtroQuantidade
      }
    });
    
    // Filtrar por local se especificado
    if (local) {
      pipeline.push({
        $match: { local }
      });
    }
    
    // Lookup no modelo de Produto
    pipeline.push({
      $lookup: {
        from: 'produtos',
        localField: 'produto',
        foreignField: '_id',
        as: 'produtoInfo'
      }
    });
    
    // Unwind para facilitar acesso ao produto
    pipeline.push({
      $unwind: '$produtoInfo'
    });
    
    // Filtros adicionais por categoria ou subcategoria
    if (categoria || subcategoria) {
      const matchProduto = {};
      if (categoria) matchProduto['produtoInfo.categoria'] = categoria;
      if (subcategoria) matchProduto['produtoInfo.subcategoria'] = subcategoria;
      
      pipeline.push({
        $match: matchProduto
      });
    }
    
    // Adicionar campo de status calculado
    pipeline.push({
      $addFields: {
        status: {
          $cond: [
            { $eq: ['$quantidade', 0] },
            Estoque.NIVEL_ESTOQUE.ESGOTADO,
            {
              $cond: [
                { $lt: ['$quantidade', Estoque.LIMITE_ESTOQUE.CRITICO] },
                Estoque.NIVEL_ESTOQUE.CRITICO,
                {
                  $cond: [
                    { $lt: ['$quantidade', Estoque.LIMITE_ESTOQUE.BAIXO] },
                    Estoque.NIVEL_ESTOQUE.BAIXO,
                    Estoque.NIVEL_ESTOQUE.NORMAL
                  ]
                }
              ]
            }
          ]
        }
      }
    });
    
    // Projetar apenas os campos necessários
    pipeline.push({
      $project: {
        _id: 1,
        produto: '$produtoInfo._id',
        produtoId: '$produtoInfo.id',
        produtoNome: '$produtoInfo.nome',
        produtoCategoria: '$produtoInfo.categoria',
        produtoSubcategoria: '$produtoInfo.subcategoria',
        produtoImagem: '$produtoInfo.imagemUrl',
        local: 1,
        quantidade: 1,
        status: 1,
        ultimaAtualizacao: 1
      }
    });
    
    // Ordenação: primeiro por status mais crítico, depois por quantidade
    pipeline.push({
      $sort: {
        quantidade: 1,
        produtoNome: 1
      }
    });
    
    // Contar total de resultados
    const resultadoContagem = await Estoque.aggregate([...pipeline, { $count: 'total' }]);
    const total = resultadoContagem.length > 0 ? resultadoContagem[0].total : 0;
    
    // Aplicar paginação
    pipeline.push({ $skip: (page - 1) * limit });
    pipeline.push({ $limit: limit });
    
    // Executar a agregação
    const resultados = await Estoque.aggregate(pipeline);
    
    return {
      resultados,
      paginacao: {
        total,
        pagina: page,
        limite: limit,
        totalPaginas: Math.ceil(total / limit)
      }
    };
  }
  
  /**
   * Atualiza as flags de estoque em todos os produtos
   * @returns {Promise<Object>} - Status da atualização
   */
  static async atualizarFlagsEstoque() {
    try {
      // Passo 1: Limpar todas as flags
      await Produto.updateMany(
        {},
        { 
          $set: { 
            temEstoqueBaixo: false,
            temEstoqueCritico: false,
            temEstoqueEsgotado: false
          }
        }
      );
      
      // Passo 2: Produtos com estoque esgotado em algum local
      const produtosComEstoqueEsgotado = await Estoque.aggregate([
        { $match: { quantidade: 0 } },
        { $group: { _id: '$produto' } }
      ]);
      
      if (produtosComEstoqueEsgotado.length > 0) {
        const idsEstoqueEsgotado = produtosComEstoqueEsgotado.map(p => p._id);
        await Produto.updateMany(
          { _id: { $in: idsEstoqueEsgotado } },
          { $set: { temEstoqueEsgotado: true } }
        );
      }
      
      // Passo 3: Produtos com estoque crítico em algum local
      const produtosComEstoqueCritico = await Estoque.aggregate([
        { 
          $match: { 
            quantidade: { 
              $gt: 0, 
              $lt: Estoque.LIMITE_ESTOQUE.CRITICO 
            } 
          }
        },
        { $group: { _id: '$produto' } }
      ]);
      
      if (produtosComEstoqueCritico.length > 0) {
        const idsEstoqueCritico = produtosComEstoqueCritico.map(p => p._id);
        await Produto.updateMany(
          { _id: { $in: idsEstoqueCritico } },
          { $set: { temEstoqueCritico: true } }
        );
      }
      
      // Passo 4: Produtos com estoque baixo em algum local
      const produtosComEstoqueBaixo = await Estoque.aggregate([
        { 
          $match: { 
            quantidade: { 
              $gte: Estoque.LIMITE_ESTOQUE.CRITICO, 
              $lt: Estoque.LIMITE_ESTOQUE.BAIXO 
            } 
          }
        },
        { $group: { _id: '$produto' } }
      ]);
      
      if (produtosComEstoqueBaixo.length > 0) {
        const idsEstoqueBaixo = produtosComEstoqueBaixo.map(p => p._id);
        await Produto.updateMany(
          { _id: { $in: idsEstoqueBaixo } },
          { $set: { temEstoqueBaixo: true } }
        );
      }
      
      return {
        sucesso: true,
        produtosAtualizados: {
          baixo: produtosComEstoqueBaixo.length,
          critico: produtosComEstoqueCritico.length,
          esgotado: produtosComEstoqueEsgotado.length
        }
      };
    } catch (error) {
      console.error('Erro ao atualizar flags de estoque:', error);
      return {
        sucesso: false,
        erro: error.message
      };
    }
  }
  
  /**
   * Atualiza flags de estoque para um único produto
   * @param {string} produtoId - ID do produto
   * @returns {Promise<Object>} - Status da atualização
   */
  static async atualizarFlagsProduto(produtoId) {
    try {
      // Verificar se o produto existe
      const produto = await Produto.findById(produtoId);
      if (!produto) {
        return {
          sucesso: false,
          mensagem: 'Produto não encontrado'
        };
      }
      
      // Limpar flags atuais
      produto.temEstoqueBaixo = false;
      produto.temEstoqueCritico = false;
      produto.temEstoqueEsgotado = false;
      
      // Buscar todos os estoques do produto
      const estoques = await Estoque.find({ produto: produtoId });
      
      // Verificar cada tipo de estoque
      let temEsgotado = false;
      let temCritico = false;
      let temBaixo = false;
      
      for (const estoque of estoques) {
        if (estoque.quantidade === 0) {
          temEsgotado = true;
        } else if (estoque.quantidade < Estoque.LIMITE_ESTOQUE.CRITICO) {
          temCritico = true;
        } else if (estoque.quantidade < Estoque.LIMITE_ESTOQUE.BAIXO) {
          temBaixo = true;
        }
      }
      
      // Atualizar flags
      produto.temEstoqueEsgotado = temEsgotado;
      produto.temEstoqueCritico = temCritico;
      produto.temEstoqueBaixo = temBaixo;
      
      await produto.save();
      
      return {
        sucesso: true,
        produto: produto.toObject(),
        flags: {
          baixo: temBaixo,
          critico: temCritico,
          esgotado: temEsgotado
        }
      };
    } catch (error) {
      console.error(`Erro ao atualizar flags do produto ${produtoId}:`, error);
      return {
        sucesso: false,
        erro: error.message
      };
    }
  }
  
  /**
   * Obtém estatísticas de produtos com estoque baixo/crítico/esgotado
   * @returns {Promise<Object>} - Estatísticas de estoque
   */
  static async obterEstatisticasEstoque() {
    // Consulta para produtos com estoque esgotado (por local)
    const produtosEsgotados = await Estoque.countDocuments({ quantidade: 0 });
    
    // Consulta para produtos com estoque crítico (por local)
    const produtosCriticos = await Estoque.countDocuments({
      quantidade: { $gt: 0, $lt: Estoque.LIMITE_ESTOQUE.CRITICO }
    });
    
    // Consulta para produtos com estoque baixo (por local)
    const produtosBaixos = await Estoque.countDocuments({
      quantidade: { 
        $gte: Estoque.LIMITE_ESTOQUE.CRITICO, 
        $lt: Estoque.LIMITE_ESTOQUE.BAIXO 
      }
    });
    
    // Consulta para total de produtos com algum estoque
    const produtosComEstoque = await Estoque.countDocuments({
      quantidade: { $gt: 0 }
    });
    
    // Consulta para total de produtos únicos
    const produtosUnicos = await Estoque.distinct('produto').countDocuments();
    
    // Consulta para total de itens em estoque (soma de todas as quantidades)
    const resultadoSoma = await Estoque.aggregate([
      { $group: { _id: null, total: { $sum: '$quantidade' } } }
    ]);
    
    const totalItensEstoque = resultadoSoma.length > 0 ? resultadoSoma[0].total : 0;
    
    return {
      produtosEsgotados,
      produtosCriticos,
      produtosBaixos,
      produtosComAlerta: produtosEsgotados + produtosCriticos + produtosBaixos,
      produtosComEstoque,
      produtosUnicos,
      totalItensEstoque
    };
  }
}

module.exports = EstoqueService;