const Produto = require('../models/Produto');
const Venda = require('../models/Venda');
const { validarRegistroVenda } = require('../validators/vendaValidator');
const { registrarVendaAtomico } = require('../services/vendaService');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// Registrar uma venda - Refatorado com Service Layer e Validator
exports.registrarVenda = asyncHandler(async (req, res) => {
  console.log('Dados recebidos para registrar venda:', req.body);
  
  // Validação com Zod
  const validacao = validarRegistroVenda(req.body);
  if (!validacao.success) {
    throw new ApiError(400, validacao.error.mensagem);
  }
  
  const { produto, quantidade, local, data, observacao } = validacao.data;
  
  // Usar serviço com operações atômicas e transações
  const resultado = await registrarVendaAtomico({
    produto,
    quantidade,
    local,
    data,
    observacao,
    usuarioId: req.usuario.id
  });
  
  res.status(201).json(resultado);
});

// Listar vendas
exports.listarVendas = async (req, res) => {
  try {
    const { 
      dataInicio, dataFim, produto, local,
      page = 1, limit = 20 
    } = req.query;
    
    // Converter para números
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    // Construir filtro
    const filtro = {};
    
    console.log('Parâmetros de busca recebidos:', {
      dataInicio, dataFim, produto, local,
      page: pageNum, limit: limitNum
    });
    
    // Tratamento de datas com validação melhorada para fusos horários
    if (dataInicio && dataFim) {
      try {
        // Criar objeto de data para início (começando à meia-noite no horário local)
        const inicio = new Date(dataInicio);
        inicio.setHours(0, 0, 0, 0);
        
        // Criar objeto de data para fim (terminando às 23:59:59.999 no horário local)
        const fim = new Date(dataFim);
        fim.setHours(23, 59, 59, 999);
        
        console.log('Datas processadas para filtro:', {
          dataInicioRaw: dataInicio,
          dataFimRaw: dataFim,
          dataInicioObj: inicio.toISOString(),
          dataFimObj: fim.toISOString(),
          fusoHorarioServidor: Intl.DateTimeFormat().resolvedOptions().timeZone
        });
        
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
    
    // Contar total de vendas que correspondem ao filtro
    const total = await Venda.countDocuments(filtro);
    
    // Buscar vendas com filtro e paginação
    const vendas = await Venda.find(filtro)
      .populate('produto', 'id nome tipo categoria subcategoria')
      .populate('registradoPor', 'nome')
      .sort({ dataVenda: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);
    
    console.log(`Encontradas ${total} vendas no total, mostrando ${vendas.length} resultados`);
    
    res.status(200).json({
      sucesso: true,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      vendas
    });
  } catch (error) {
    console.error('Erro ao listar histórico de vendas:', error);
    
    // Determinar o tipo de erro para feedback mais detalhado
    let mensagemErro = 'Erro ao listar histórico de vendas';
    let codigoErro = 'UNKNOWN_ERROR';
    
    if (error.name === 'CastError') {
      mensagemErro = 'Parâmetro inválido fornecido na requisição';
      codigoErro = 'INVALID_PARAMETER';
    } else if (error.name === 'MongoNetworkError' || error.name === 'MongoTimeoutError') {
      mensagemErro = 'Erro de conexão com o banco de dados';
      codigoErro = 'DATABASE_CONNECTION_ERROR';
    } else if (error.message && error.message.includes('timeout')) {
      mensagemErro = 'A consulta demorou muito para responder';
      codigoErro = 'TIMEOUT_ERROR';
    }
    
    res.status(500).json({
      sucesso: false,
      mensagem: mensagemErro,
      codigo: codigoErro,
      erro: error.message
    });
  }
};

// Novo método - Listar histórico de vendas (alias para listarVendas, para compatibilidade com frontend)
exports.listarHistorico = async (req, res) => {
  try {
    console.log('Acessando endpoint /vendas/historico');
    
    // Se as datas não estiverem definidas, definir um período padrão (último mês)
    if (!req.query.dataInicio || !req.query.dataFim) {
      console.log('Datas não fornecidas, definindo período padrão (último mês)');
      
      const dataFim = new Date();
      const dataInicio = new Date();
      dataInicio.setMonth(dataInicio.getMonth() - 1);
      
      req.query.dataInicio = dataInicio.toISOString();
      req.query.dataFim = dataFim.toISOString();
      
      console.log('Período padrão definido:', {
        dataInicio: req.query.dataInicio,
        dataFim: req.query.dataFim
      });
    }
    
    // Reutilizar a função listarVendas para manter consistência
    return await exports.listarVendas(req, res);
  } catch (error) {
    console.error('Erro ao acessar histórico de vendas:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao acessar histórico de vendas',
      erro: error.message
    });
  }
};

// Exclui todas as vendas associadas a produtos que não existem mais
// Otimizado: usa lógica baseada em conjuntos ao invés de N+1 queries
exports.excluirVendasProdutosRemovidos = async (req, res) => {
  try {
    // 1. Buscar todos os IDs de produtos válidos de uma só vez
    const produtosValidos = await Produto.distinct('_id');
    
    // 2. Contar vendas cujos produtos NÃO estão na lista de produtos válidos
    const quantidade = await Venda.countDocuments({
      produto: { $nin: produtosValidos }
    });
    
    // Se não houver vendas para excluir
    if (quantidade === 0) {
      return res.status(200).json({
        sucesso: true,
        mensagem: 'Nenhuma venda de produto removido encontrada',
        quantidade: 0
      });
    }
    
    // Se apenas estamos verificando a quantidade (preview)
    if (req.query.preview === 'true') {
      return res.status(200).json({
        sucesso: true,
        mensagem: `Encontradas ${quantidade} vendas de produtos removidos`,
        quantidade
      });
    }
    
    // 3. Excluir todas as vendas de produtos que não existem mais
    const resultado = await Venda.deleteMany({
      produto: { $nin: produtosValidos }
    });
    
    // Registrar a ação no log do sistema
    console.log(`${resultado.deletedCount} vendas de produtos removidos excluídas por ${req.usuario.nome} (${req.usuario.id}) em ${new Date().toISOString()}`);
    
    res.status(200).json({
      sucesso: true,
      mensagem: `${resultado.deletedCount} vendas de produtos removidos foram excluídas com sucesso`,
      quantidade: resultado.deletedCount
    });
  } catch (error) {
    console.error('Erro ao excluir vendas de produtos removidos:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao excluir vendas de produtos removidos',
      erro: error.message
    });
  }
};