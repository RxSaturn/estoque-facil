/**
 * Aggregation pipelines reutilizáveis para MongoDB
 * @module utils/aggregations
 */

/**
 * Pipeline para calcular distribuição de produtos por categoria
 * @returns {Array} Pipeline de agregação
 */
const getCategoryDistributionPipeline = () => [
  {
    $group: {
      _id: '$categoria',
      count: { $sum: 1 }
    }
  },
  {
    $project: {
      _id: 0,
      nome: '$_id',
      quantidade: '$count'
    }
  },
  { $sort: { quantidade: -1 } }
];

/**
 * Pipeline para calcular total de itens em estoque por local
 * @returns {Array} Pipeline de agregação
 */
const getStockByLocationPipeline = () => [
  {
    $group: {
      _id: '$local',
      total: { $sum: '$quantidade' }
    }
  },
  {
    $project: {
      _id: 0,
      local: '$_id',
      quantidade: '$total'
    }
  },
  { $sort: { quantidade: -1 } }
];

/**
 * Pipeline para obter produtos com estoque baixo/crítico
 * @param {Object} limites - Limites de estoque { CRITICO, BAIXO }
 * @param {number} limit - Número máximo de resultados
 * @returns {Array} Pipeline de agregação
 */
const getLowStockPipeline = (limites, limit = 5) => [
  {
    $match: {
      quantidade: { $lt: limites.BAIXO }
    }
  },
  {
    $lookup: {
      from: 'produtos',
      localField: 'produto',
      foreignField: '_id',
      as: 'produtoInfo'
    }
  },
  { $unwind: '$produtoInfo' },
  {
    $addFields: {
      status: {
        $cond: [
          { $eq: ['$quantidade', 0] },
          'esgotado',
          {
            $cond: [
              { $lt: ['$quantidade', limites.CRITICO] },
              'critico',
              'baixo'
            ]
          }
        ]
      }
    }
  },
  {
    $project: {
      _id: 1,
      produto: '$produtoInfo._id',
      produtoId: '$produtoInfo.id',
      produtoNome: '$produtoInfo.nome',
      produtoCategoria: '$produtoInfo.categoria',
      local: 1,
      quantidade: 1,
      status: 1
    }
  },
  { $sort: { quantidade: 1, produtoNome: 1 } },
  { $limit: limit }
];

/**
 * Pipeline para calcular vendas do dia
 * @param {Date} startOfDay - Início do dia
 * @param {Date} endOfDay - Fim do dia
 * @returns {Array} Pipeline de agregação
 */
const getDailySalesPipeline = (startOfDay, endOfDay) => [
  {
    $match: {
      dataVenda: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }
  },
  {
    $group: {
      _id: null,
      totalVendas: { $sum: 1 },
      totalQuantidade: { $sum: '$quantidade' },
      valorTotal: { $sum: '$valorTotal' }
    }
  }
];

/**
 * Pipeline para calcular vendas por período (semana/mês)
 * @param {Date} startDate - Data de início
 * @param {Date} endDate - Data de fim
 * @returns {Array} Pipeline de agregação
 */
const getSalesByPeriodPipeline = (startDate, endDate) => [
  {
    $match: {
      dataVenda: {
        $gte: startDate,
        $lte: endDate
      }
    }
  },
  {
    $group: {
      _id: {
        $dateToString: { format: '%Y-%m-%d', date: '$dataVenda' }
      },
      vendas: { $sum: 1 },
      quantidade: { $sum: '$quantidade' }
    }
  },
  { $sort: { _id: 1 } }
];

/**
 * Pipeline para obter top produtos vendidos
 * @param {Date} startDate - Data de início
 * @param {Date} endDate - Data de fim
 * @param {number} limit - Número máximo de resultados
 * @returns {Array} Pipeline de agregação
 */
const getTopProductsPipeline = (startDate, endDate, limit = 5) => [
  {
    $match: {
      dataVenda: {
        $gte: startDate,
        $lte: endDate
      }
    }
  },
  {
    $group: {
      _id: '$produto',
      quantidadeVendas: { $sum: 1 },
      quantidadeTotal: { $sum: '$quantidade' }
    }
  },
  { $sort: { quantidadeVendas: -1 } },
  { $limit: limit },
  {
    $lookup: {
      from: 'produtos',
      localField: '_id',
      foreignField: '_id',
      as: 'produtoInfo'
    }
  },
  { $unwind: '$produtoInfo' },
  {
    $project: {
      _id: 1,
      nome: '$produtoInfo.nome',
      categoria: '$produtoInfo.categoria',
      quantidadeVendas: 1,
      quantidadeTotal: 1
    }
  }
];

/**
 * Pipeline para obter movimentações recentes
 * @param {number} limit - Número máximo de resultados
 * @returns {Array} Pipeline de agregação
 */
const getRecentMovementsPipeline = (limit = 10) => [
  { $sort: { data: -1 } },
  { $limit: limit },
  {
    $lookup: {
      from: 'produtos',
      localField: 'produto',
      foreignField: '_id',
      as: 'produtoInfo'
    }
  },
  { $unwind: { path: '$produtoInfo', preserveNullAndEmptyArrays: true } },
  {
    $project: {
      _id: 1,
      tipo: 1,
      quantidade: 1,
      localOrigem: 1,
      localDestino: 1,
      data: 1,
      observacao: 1,
      produtoNome: '$produtoInfo.nome',
      produtoId: '$produtoInfo.id'
    }
  }
];

/**
 * Pipeline para estatísticas gerais do estoque
 * @returns {Array} Pipeline de agregação
 */
const getStockStatsPipeline = () => [
  {
    $group: {
      _id: null,
      totalItens: { $sum: '$quantidade' },
      totalRegistros: { $sum: 1 },
      mediaQuantidade: { $avg: '$quantidade' }
    }
  }
];

module.exports = {
  getCategoryDistributionPipeline,
  getStockByLocationPipeline,
  getLowStockPipeline,
  getDailySalesPipeline,
  getSalesByPeriodPipeline,
  getTopProductsPipeline,
  getRecentMovementsPipeline,
  getStockStatsPipeline
};
