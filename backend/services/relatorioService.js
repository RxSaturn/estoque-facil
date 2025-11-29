/**
 * Relatório Service - Geração de dados para relatórios
 * @module services/relatorioService
 */

const Produto = require('../models/Produto');
const Estoque = require('../models/Estoque');
const Venda = require('../models/Venda');
const Movimentacao = require('../models/Movimentacao');

/**
 * Obtém dados de relatório de vendas para o período especificado
 * @param {Object} filtros - Filtros do relatório
 * @param {Date} filtros.dataInicio - Data de início (formato YYYY-MM-DD)
 * @param {Date} filtros.dataFim - Data de fim (formato YYYY-MM-DD)
 * @param {string} [filtros.tipo] - Tipo de produto
 * @param {string} [filtros.categoria] - Categoria do produto
 * @param {string} [filtros.subcategoria] - Subcategoria do produto
 * @param {string} [filtros.local] - Local do estoque
 * @param {string} [filtros.metodoCalculo] - Método de cálculo (transacoes ou quantidade)
 * @returns {Promise<Object>} Dados do relatório
 */
const getReportData = async (filtros) => {
  try {
    const {
      dataInicio,
      dataFim,
      tipo,
      categoria,
      subcategoria,
      local,
      metodoCalculo = 'transacoes'
    } = filtros;

    // Validar formato de data
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dataInicio) || !dateRegex.test(dataFim)) {
      throw new Error('Formato de data inválido. Use YYYY-MM-DD');
    }

    const dataInicioObj = new Date(`${dataInicio}T00:00:00.000Z`);
    const dataFimObj = new Date(`${dataFim}T23:59:59.999Z`);
    
    // Validar se as datas são válidas
    if (isNaN(dataInicioObj.getTime()) || isNaN(dataFimObj.getTime())) {
      throw new Error('Data inválida fornecida');
    }

    // Construir filtros
    const filtroVendas = {
      dataVenda: { $gte: dataInicioObj, $lte: dataFimObj }
    };
    const filtroProdutos = {};
    const filtroEstoque = {};

    if (tipo) filtroProdutos.tipo = tipo;
    if (categoria) filtroProdutos.categoria = categoria;
    if (subcategoria) filtroProdutos.subcategoria = subcategoria;

    // Aplicar filtros de produto
    if (Object.keys(filtroProdutos).length > 0) {
      const produtosFiltrados = await Produto.find(filtroProdutos).select('_id').lean();
      const idsProdutos = produtosFiltrados.map(p => p._id);
      filtroVendas.produto = { $in: idsProdutos };
      filtroEstoque.produto = { $in: idsProdutos };
    }

    if (local) {
      filtroVendas.local = local;
      filtroEstoque.local = local;
    }

    // Executar consultas em paralelo
    const [
      totalProdutos,
      totalVendas,
      estatisticas,
      vendasPorCategoria,
      estoquePorLocal,
      topProdutos
    ] = await Promise.all([
      Produto.countDocuments(filtroProdutos),
      Venda.countDocuments(filtroVendas),
      calcularEstatisticas(filtroVendas, dataInicioObj, dataFimObj, metodoCalculo),
      calcularVendasPorCategoria(filtroVendas),
      calcularEstoquePorLocal(filtroEstoque),
      metodoCalculo === 'transacoes'
        ? obterTopProdutosPorTransacoes(filtroVendas)
        : obterTopProdutosPorQuantidade(filtroVendas)
    ]);

    return {
      sucesso: true,
      totalProdutos,
      totalVendas,
      totalItensVendidos: estatisticas.totalItensVendidos,
      mediaVendasDiarias: estatisticas.mediaVendasDiarias,
      diaMaiorVenda: estatisticas.diaMaiorVenda,
      topProdutos,
      vendasPorCategoria,
      estoquePorLocal
    };
  } catch (error) {
    console.error('Erro ao obter dados do relatório:', error);
    throw error;
  }
};

/**
 * Calcula estatísticas de vendas
 * @private
 */
const calcularEstatisticas = async (filtroVendas, dataInicio, dataFim, metodoCalculo) => {
  try {
    const [resultadoQuantidade, resultadoTransacoes] = await Promise.all([
      Venda.aggregate([
        { $match: filtroVendas },
        { $group: { _id: null, total: { $sum: '$quantidade' } } }
      ]),
      Venda.aggregate([
        { $match: filtroVendas },
        { $group: { _id: null, total: { $count: {} } } }
      ])
    ]);

    const totalItensVendidos = resultadoQuantidade[0]?.total || 0;
    const totalTransacoes = resultadoTransacoes[0]?.total || 0;

    // Calcular dias no período
    const diferencaEmMs = dataFim - dataInicio;
    const numeroDias = Math.max(1, Math.ceil(diferencaEmMs / (1000 * 60 * 60 * 24)));

    const mediaVendasDiarias = metodoCalculo === 'transacoes'
      ? totalTransacoes / numeroDias
      : totalItensVendidos / numeroDias;

    // Encontrar dia com maior venda
    const vendasPorDia = await Venda.aggregate([
      { $match: filtroVendas },
      {
        $addFields: {
          dataString: {
            $dateToString: { format: '%Y-%m-%d', date: '$dataVenda', timezone: 'UTC' }
          }
        }
      },
      {
        $group: {
          _id: '$dataString',
          total: metodoCalculo === 'transacoes' ? { $count: {} } : { $sum: '$quantidade' }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 1 }
    ]);

    return {
      totalItensVendidos,
      totalTransacoes,
      mediaVendasDiarias,
      diaMaiorVenda: vendasPorDia[0]?._id || null,
      numeroDias
    };
  } catch (error) {
    console.error('Erro ao calcular estatísticas:', error);
    throw error;
  }
};

/**
 * Calcula vendas agrupadas por categoria
 * @private
 */
const calcularVendasPorCategoria = async (filtroVendas) => {
  try {
    const vendas = await Venda.find(filtroVendas).select('produto quantidade').lean();
    const produtosIds = [...new Set(vendas.map(v => v.produto))];
    
    const produtosInfo = await Produto.find({ _id: { $in: produtosIds } }).lean();
    const produtosMap = {};
    produtosInfo.forEach(p => { produtosMap[p._id.toString()] = p; });

    const categorias = {};
    vendas.forEach(venda => {
      const produto = produtosMap[venda.produto.toString()];
      if (!produto) return;
      
      const categoria = produto.categoria || 'Sem categoria';
      categorias[categoria] = (categorias[categoria] || 0) + venda.quantidade;
    });

    return {
      labels: Object.keys(categorias),
      dados: Object.values(categorias)
    };
  } catch (error) {
    console.error('Erro ao calcular vendas por categoria:', error);
    throw error;
  }
};

/**
 * Calcula estoque por local
 * @private
 */
const calcularEstoquePorLocal = async (filtroEstoque) => {
  try {
    const estoquePorLocal = await Estoque.aggregate([
      { $match: filtroEstoque },
      { $group: { _id: '$local', total: { $sum: '$quantidade' } } },
      { $sort: { total: -1 } }
    ]);

    return {
      labels: estoquePorLocal.map(item => item._id),
      dados: estoquePorLocal.map(item => item.total)
    };
  } catch (error) {
    console.error('Erro ao calcular estoque por local:', error);
    throw error;
  }
};

/**
 * Obtém top produtos por número de transações
 * @private
 */
const obterTopProdutosPorTransacoes = async (filtroVendas) => {
  try {
    const vendasPorProduto = await Venda.aggregate([
      { $match: filtroVendas },
      { $group: { _id: '$produto', transacoes: { $sum: 1 } } },
      { $sort: { transacoes: -1 } },
      { $limit: 20 }
    ]);

    if (vendasPorProduto.length === 0) return [];

    const produtosIds = vendasPorProduto.map(v => v._id);
    const produtosInfo = await Produto.find({ _id: { $in: produtosIds } }).lean();
    const produtosMap = {};
    produtosInfo.forEach(p => { produtosMap[p._id.toString()] = p; });

    const vendasFiltradas = vendasPorProduto.filter(v => produtosMap[v._id.toString()]);
    const totalTransacoes = vendasFiltradas.reduce((sum, item) => sum + item.transacoes, 0);

    return vendasFiltradas.map(venda => {
      const produto = produtosMap[venda._id.toString()];
      return {
        id: produto.id,
        nome: produto.nome,
        tipo: produto.tipo,
        categoria: produto.categoria,
        subcategoria: produto.subcategoria || '',
        transacoes: venda.transacoes,
        percentual: totalTransacoes > 0 
          ? parseFloat(((venda.transacoes / totalTransacoes) * 100).toFixed(2))
          : 0
      };
    });
  } catch (error) {
    console.error('Erro ao obter top produtos por transações:', error);
    throw error;
  }
};

/**
 * Obtém top produtos por quantidade vendida
 * @private
 */
const obterTopProdutosPorQuantidade = async (filtroVendas) => {
  try {
    const vendasPorProduto = await Venda.aggregate([
      { $match: filtroVendas },
      { $group: { _id: '$produto', quantidade: { $sum: '$quantidade' } } },
      { $sort: { quantidade: -1 } },
      { $limit: 20 }
    ]);

    if (vendasPorProduto.length === 0) return [];

    const produtosIds = vendasPorProduto.map(v => v._id);
    const produtosInfo = await Produto.find({ _id: { $in: produtosIds } }).lean();
    const produtosMap = {};
    produtosInfo.forEach(p => { produtosMap[p._id.toString()] = p; });

    const vendasFiltradas = vendasPorProduto.filter(v => produtosMap[v._id.toString()]);
    const totalQuantidade = vendasFiltradas.reduce((sum, item) => sum + item.quantidade, 0);

    return vendasFiltradas.map(venda => {
      const produto = produtosMap[venda._id.toString()];
      return {
        id: produto.id,
        nome: produto.nome,
        tipo: produto.tipo,
        categoria: produto.categoria,
        subcategoria: produto.subcategoria || '',
        quantidade: venda.quantidade,
        percentual: totalQuantidade > 0
          ? parseFloat(((venda.quantidade / totalQuantidade) * 100).toFixed(2))
          : 0
      };
    });
  } catch (error) {
    console.error('Erro ao obter top produtos por quantidade:', error);
    throw error;
  }
};

/**
 * Obtém produtos sem movimentação no período
 * @param {Object} filtros - Filtros do relatório
 * @returns {Promise<Array>} Lista de produtos sem movimentação
 */
const getProdutosSemMovimentacao = async (filtros) => {
  try {
    const { dataInicio, dataFim, tipo, categoria, subcategoria, local } = filtros;
    
    const dataInicioObj = new Date(`${dataInicio}T00:00:00.000Z`);
    const dataFimObj = new Date(`${dataFim}T23:59:59.999Z`);

    const filtroProdutos = {};
    if (tipo) filtroProdutos.tipo = tipo;
    if (categoria) filtroProdutos.categoria = categoria;
    if (subcategoria) filtroProdutos.subcategoria = subcategoria;

    const todosProdutos = await Produto.find(filtroProdutos).lean();
    if (todosProdutos.length === 0) return [];

    const todosProdutosIds = todosProdutos.map(p => p._id);

    // Encontrar produtos com movimentação/vendas
    const [movimentacoes, vendas] = await Promise.all([
      Movimentacao.find({
        data: { $gte: dataInicioObj, $lte: dataFimObj },
        produto: { $in: todosProdutosIds }
      }).select('produto').lean(),
      Venda.find({
        dataVenda: { $gte: dataInicioObj, $lte: dataFimObj },
        produto: { $in: todosProdutosIds }
      }).select('produto').lean()
    ]);

    const produtosComAtividade = new Set([
      ...movimentacoes.map(m => m.produto.toString()),
      ...vendas.map(v => v.produto.toString())
    ]);

    const produtosSemAtividade = todosProdutos.filter(
      p => !produtosComAtividade.has(p._id.toString())
    );

    // Obter informações de estoque
    const resultado = [];
    for (const produto of produtosSemAtividade) {
      const filtroEstoque = { produto: produto._id };
      if (local) filtroEstoque.local = local;

      const estoques = await Estoque.find(filtroEstoque).lean();
      
      for (const estoque of estoques) {
        resultado.push({
          id: produto.id,
          nome: produto.nome,
          tipo: produto.tipo,
          categoria: produto.categoria,
          subcategoria: produto.subcategoria,
          local: estoque.local,
          quantidade: estoque.quantidade,
          ultimaMovimentacao: null
        });
      }
    }

    return resultado;
  } catch (error) {
    console.error('Erro ao obter produtos sem movimentação:', error);
    throw error;
  }
};

module.exports = {
  getReportData,
  getProdutosSemMovimentacao,
  calcularVendasPorCategoria,
  calcularEstoquePorLocal,
  obterTopProdutosPorTransacoes,
  obterTopProdutosPorQuantidade
};
