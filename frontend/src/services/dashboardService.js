import api from "./api";
import { toast } from "react-toastify";

// Configurações de timeout e retry otimizadas
const CONFIG = {
  TIMEOUT_MS: 15000, // Aumentado para 15s para dar mais tempo em conexões lentas
  MAX_RETRIES: 3, // Aumentado para 3 retries
  RETRY_DELAY_BASE_MS: 500, // Delay base de 500ms para backoff exponencial
  CACHE_DURATION_MS: 180000, // 3 minutos de cache
  MIN_STOCK_THRESHOLD: 20, // Limite mínimo de estoque
};

// Tipos de erro para feedback contextual
const ERROR_TYPES = {
  CONNECTION: 'CONNECTION',
  TIMEOUT: 'TIMEOUT',
  AUTH: 'AUTH',
  SERVER: 'SERVER',
  UNKNOWN: 'UNKNOWN'
};

// Códigos de erro conhecidos para categorização
const CONNECTION_ERROR_CODES = ['ECONNABORTED', 'ERR_NETWORK', 'ECONNREFUSED'];
const TIMEOUT_ERROR_CODES = ['TIMEOUT_ERROR', 'ETIMEDOUT'];

// Função para categorizar erros
const categorizeError = (error) => {
  if (!error) return { type: ERROR_TYPES.UNKNOWN, message: 'Erro desconhecido' };
  
  const errorCode = error.code || '';
  const errorMessage = error.message || '';
  
  // Erros de conexão - verificar por propriedade ou código
  if (error.isConnectionError || 
      CONNECTION_ERROR_CODES.includes(errorCode) ||
      errorMessage.includes('Network Error')) {
    return { 
      type: ERROR_TYPES.CONNECTION, 
      message: 'Não foi possível conectar ao servidor. Verifique sua conexão de internet.',
      canRetry: true
    };
  }
  
  // Erros de timeout - verificar por código ou mensagem
  if (TIMEOUT_ERROR_CODES.includes(errorCode) ||
      errorMessage.toLowerCase().includes('timeout')) {
    return { 
      type: ERROR_TYPES.TIMEOUT, 
      message: 'A conexão demorou muito para responder. Tentando novamente...',
      canRetry: true
    };
  }
  
  // Erros de autenticação - verificar status HTTP
  const httpStatus = error.response?.status;
  if (httpStatus === 401 || httpStatus === 403) {
    return { 
      type: ERROR_TYPES.AUTH, 
      message: 'Sessão expirada. Por favor, faça login novamente.',
      canRetry: false
    };
  }
  
  // Erros do servidor - verificar status HTTP 5xx
  if (httpStatus >= 500) {
    return { 
      type: ERROR_TYPES.SERVER, 
      message: 'Erro interno do servidor. Tente novamente mais tarde.',
      canRetry: true
    };
  }
  
  return { 
    type: ERROR_TYPES.UNKNOWN, 
    message: errorMessage || 'Erro desconhecido',
    canRetry: true
  };
};

// Cache em memória para dados do dashboard
const dataCache = new Map();

/**
 * Verifica se o cache ainda é válido
 */
const isCacheValid = (key) => {
  const cached = dataCache.get(key);
  if (!cached) return false;
  return Date.now() - cached.timestamp < CONFIG.CACHE_DURATION_MS;
};

/**
 * Obtém dados do cache
 */
const getFromCache = (key) => {
  const cached = dataCache.get(key);
  return cached ? cached.data : null;
};

/**
 * Armazena dados no cache
 */
const setCache = (key, data) => {
  dataCache.set(key, { data, timestamp: Date.now() });
};

/**
 * Limpa todo o cache
 */
export const clearDashboardCache = () => {
  dataCache.clear();
  console.log("🗑️ Cache do dashboard limpo");
};

/**
 * Função auxiliar para adicionar timeout em qualquer promessa
 */
const withTimeout = (promise, timeoutMs = CONFIG.TIMEOUT_MS) => {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(
      () => reject(new Error(`Timeout após ${timeoutMs}ms`)),
      timeoutMs
    );
  });

  return Promise.race([promise, timeoutPromise]);
};

/**
 * Função para retry com backoff exponencial e feedback de progresso
 */
const withRetry = async (fn, retries = CONFIG.MAX_RETRIES, context = "operação") => {
  let lastError;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const errorInfo = categorizeError(error);
      
      // Se não pode fazer retry, lançar o erro imediatamente
      if (!errorInfo.canRetry) {
        console.error(`❌ Erro não recuperável para ${context}:`, errorInfo.message);
        throw error;
      }
      
      if (attempt < retries) {
        // Delay exponencial: 500ms, 1000ms, 2000ms
        const delay = CONFIG.RETRY_DELAY_BASE_MS * Math.pow(2, attempt);
        console.log(`⏳ Tentativa ${attempt + 1}/${retries + 1} falhou para ${context}. Tipo: ${errorInfo.type}. Retry em ${delay}ms...`);
        
        // Toast informativo apenas na primeira falha
        if (attempt === 0) {
          toast.info(`Carregando ${context}... Aguarde.`, {
            toastId: `retry-${context}`,
            autoClose: delay + 1000
          });
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

// Obter estatísticas de produtos - OTIMIZADO com cache e retry
export const getProductStats = async (useCache = true) => {
  const cacheKey = "productStats";
  
  // Verificar cache primeiro
  if (useCache && isCacheValid(cacheKey)) {
    console.log("📦 Usando cache para estatísticas de produtos");
    return getFromCache(cacheKey);
  }
  
  try {
    console.log("🔍 Buscando estatísticas de produtos...");

    const result = await withRetry(async () => {
      // Buscar contagem e estatísticas em paralelo
      const [countResponse, estatisticasResponse] = await Promise.all([
        withTimeout(api.get("/api/produtos/count")),
        withTimeout(api.get("/api/produtos/estatisticas"))
      ]);

      // Usar countResponse como fonte primária de dados
      const total = countResponse.data?.total ?? estatisticasResponse.data?.total ?? 0;
      const quantidadeTotal = estatisticasResponse.data?.quantidadeTotal ?? 0;

      return { total, quantidadeTotal };
    }, CONFIG.MAX_RETRIES, "estatísticas de produtos");
    
    console.log(`✅ Estatísticas carregadas - Produtos: ${result.total}, Estoque total: ${result.quantidadeTotal}`);
    
    // Armazenar no cache
    setCache(cacheKey, result);
    
    return result;
  } catch (error) {
    console.error("❌ Erro ao buscar estatísticas de produtos:", error);
    
    // Tentar usar cache expirado como fallback
    const expiredCache = getFromCache(cacheKey);
    if (expiredCache) {
      console.log("⚠️ Usando cache expirado como fallback para produtos");
      toast.warning("Usando dados em cache. Algumas informações podem estar desatualizadas.", {
        toastId: "products-cache-fallback",
        autoClose: 4000
      });
      return expiredCache;
    }
    
    // Retornar valores padrão ao invés de throw para não quebrar o dashboard
    return { total: 0, quantidadeTotal: 0 };
  }
};

// Obter estatísticas de vendas com cache e melhor feedback
export const getSalesStats = async (useCache = true) => {
  const cacheKey = "salesStats";
  
  // Verificar cache primeiro
  if (useCache && isCacheValid(cacheKey)) {
    console.log("📦 Usando cache para estatísticas de vendas");
    return getFromCache(cacheKey);
  }
  
  try {
    console.log("🔍 Iniciando busca de estatísticas de vendas");

    // Obter data atual
    const hoje = new Date();
    // Converter para string no formato YYYY-MM-DD
    const dataHoje = hoje.toISOString().split("T")[0];

    // Calcular o dia seguinte para capturar vendas em todos os fusos horários
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);
    const dataAmanha = amanha.toISOString().split("T")[0];

    console.log(`Buscando vendas entre: ${dataHoje} e ${dataAmanha}`);

    // Rastrear qual fonte de dados foi usada para feedback
    let fonteVendas = { venda: false, movimentacao: false };

    // 1. Fonte 1: Coleção Venda
    let totalVendasHoje = 0;
    let vendasDaColecaoVenda = 0;
    try {
      const vendasResponse = await withTimeout(
        api.get("/api/vendas/historico", {
          params: {
            dataInicio: dataHoje,
            dataFim: dataAmanha,
          },
        })
      );

      const vendasDePeriodo = vendasResponse?.data?.vendas || [];
      console.log(
        `Vendas encontradas na coleção Venda: ${vendasDePeriodo.length}`
      );

      // Filtrar apenas vendas de hoje
      const vendasHoje = vendasDePeriodo.filter((venda) => {
        if (!venda.dataVenda) return false;
        const dataVenda = new Date(venda.dataVenda);
        return dataVenda.toISOString().split("T")[0] === dataHoje;
      });

      vendasDaColecaoVenda = vendasHoje.length;
      totalVendasHoje = vendasDaColecaoVenda;
      fonteVendas.venda = true;
      console.log(
        `Vendas filtradas para hoje da coleção Venda: ${vendasDaColecaoVenda}`
      );
    } catch (error) {
      console.error("⚠️ Erro ao buscar vendas da coleção Venda:", error.message);
    }

    // 2. Fonte 2: Coleção Movimentacao (fallback e complemento)
    let vendasDaColecaoMovimentacao = 0;
    try {
      const movResponse = await withTimeout(
        api.get("/api/movimentacoes/historico", {
          params: {
            tipo: "venda",
            dataInicio: dataHoje,
            dataFim: dataAmanha,
          },
        })
      );

      const movimentacoesDePeriodo = movResponse?.data?.movimentacoes || [];
      console.log(
        `Movimentações de venda encontradas: ${movimentacoesDePeriodo.length}`
      );

      // Filtrar apenas movimentações de hoje
      const movimentacoesHoje = movimentacoesDePeriodo.filter((mov) => {
        if (!mov.data) return false;
        const dataMov = new Date(mov.data);
        return dataMov.toISOString().split("T")[0] === dataHoje;
      });

      vendasDaColecaoMovimentacao = movimentacoesHoje.length;
      fonteVendas.movimentacao = true;
      console.log(
        `Movimentações de venda filtradas para hoje: ${vendasDaColecaoMovimentacao}`
      );
      
      // Usar movimentações se não houver vendas da coleção Venda
      if (vendasDaColecaoVenda === 0) {
        totalVendasHoje = vendasDaColecaoMovimentacao;
        console.log("📊 Usando dados de movimentações como fonte primária");
      }
    } catch (error) {
      console.error("⚠️ Erro ao buscar movimentações de venda:", error.message);
    }

    // Feedback sobre fonte de dados
    if (!fonteVendas.venda && !fonteVendas.movimentacao) {
      console.warn("⚠️ Nenhuma fonte de dados de vendas disponível");
      toast.warning("Não foi possível carregar dados de vendas. Tente novamente.", {
        toastId: "sales-no-data",
        autoClose: 5000
      });
    } else if (!fonteVendas.venda && fonteVendas.movimentacao) {
      console.log("📊 Usando apenas dados de movimentações para vendas");
    }

    console.log(`Total de vendas hoje: ${totalVendasHoje}`);

    const result = {
      vendasHoje: totalVendasHoje,
      vendasDiarias: totalVendasHoje,
      tendenciaVendas: 0,
      fontes: {
        vendas: vendasDaColecaoVenda,
        movimentacoes: vendasDaColecaoMovimentacao
      }
    };
    
    // Armazenar no cache
    setCache(cacheKey, result);
    
    return result;
  } catch (error) {
    console.error("❌ Erro ao buscar estatísticas de vendas:", error);
    
    const errorInfo = categorizeError(error);
    
    // Tentar usar cache expirado como fallback
    const expiredCache = getFromCache(cacheKey);
    if (expiredCache) {
      console.log("⚠️ Usando cache expirado como fallback para vendas");
      toast.warning("Usando dados de vendas em cache.", {
        toastId: "sales-cache-fallback",
        autoClose: 4000
      });
      return expiredCache;
    }
    
    // Mostrar erro contextualizado
    toast.error(errorInfo.message, {
      toastId: "sales-error",
      autoClose: 5000
    });
    
    return {
      vendasHoje: 0,
      vendasDiarias: 0,
      tendenciaVendas: 0,
      errorType: errorInfo.type
    };
  }
};

// Obter top produtos mais vendidos com cache
export const getTopProducts = async (limit = 5, useCache = true) => {
  const cacheKey = `topProducts_${limit}`;
  
  // Verificar cache primeiro
  if (useCache && isCacheValid(cacheKey)) {
    console.log("📦 Usando cache para top produtos");
    return getFromCache(cacheKey);
  }
  
  try {
    console.log(`🔍 Iniciando busca dos top ${limit} produtos`);

    // Definir período de 3 meses
    const dataFim = new Date();
    const dataInicio = new Date();
    dataInicio.setMonth(dataInicio.getMonth() - 3);

    const result = await withRetry(async () => {
      // Buscar histórico de vendas
      const historicoResponse = await withTimeout(
        api.get("/api/vendas/historico", {
          params: {
            dataInicio: dataInicio.toISOString().split("T")[0],
            dataFim: dataFim.toISOString().split("T")[0],
            limit: 1000,
          },
        })
      );

      // Processar vendas
      let vendas = [];
      if (historicoResponse?.data) {
        if (Array.isArray(historicoResponse.data)) {
          vendas = historicoResponse.data;
        } else if (
          historicoResponse.data.vendas &&
          Array.isArray(historicoResponse.data.vendas)
        ) {
          vendas = historicoResponse.data.vendas;
        }
      }

      // Se não houver vendas na coleção Venda, tentar buscar nas movimentações
      if (vendas.length === 0) {
        console.log("📊 Buscando vendas na coleção de movimentações...");
        
        const movResponse = await withTimeout(
          api.get("/api/movimentacoes/historico", {
            params: {
              tipo: "venda",
              dataInicio: dataInicio.toISOString().split("T")[0],
              dataFim: dataFim.toISOString().split("T")[0],
              limit: 1000,
            },
          })
        );
        
        if (movResponse?.data?.movimentacoes) {
          vendas = movResponse.data.movimentacoes
            .filter(mov => mov.produto && mov.quantidade) // Filter out invalid entries
            .map(mov => ({
              produto: mov.produto,
              quantidade: mov.quantidade
            }));
          console.log(`📊 Vendas obtidas de movimentações: ${vendas.length}`);
        }
      }

      return vendas;
    }, CONFIG.MAX_RETRIES, "top produtos");

    console.log(`✅ Vendas analisadas: ${result.length}`);

    // Se não houver vendas, retornar array vazio
    if (result.length === 0) {
      return [];
    }

    // Agrupar vendas por produto
    const produtosMap = {};
    result.forEach((venda) => {
      const produtoId = venda.produto?._id || venda.produto;
      if (!produtoId) return;

      const produtoNome = venda.produto?.nome || "Produto";

      if (!produtosMap[produtoId]) {
        produtosMap[produtoId] = {
          id: produtoId,
          nome: produtoNome,
          quantidadeVendas: 0,
        };
      }

      produtosMap[produtoId].quantidadeVendas += 1;
    });

    // Converter para array, ordenar e limitar
    const topProdutos = Object.values(produtosMap)
      .sort((a, b) => b.quantidadeVendas - a.quantidadeVendas)
      .slice(0, limit);
    
    // Armazenar no cache
    setCache(cacheKey, topProdutos);
    
    return topProdutos;
  } catch (error) {
    console.error("❌ Erro ao buscar top produtos:", error);
    
    // Tentar usar cache expirado como fallback
    const expiredCache = getFromCache(cacheKey);
    if (expiredCache) {
      console.log("⚠️ Usando cache expirado como fallback para top produtos");
      return expiredCache;
    }
    
    return [];
  }
};

// Obter produtos com estoque baixo com cache e feedback melhorado
export const getLowStockProducts = async (useCache = true) => {
  const cacheKey = "lowStockProducts";
  
  // Verificar cache primeiro
  if (useCache && isCacheValid(cacheKey)) {
    console.log("📦 Usando cache para produtos com estoque baixo");
    return getFromCache(cacheKey);
  }
  
  try {
    console.log("🔍 Iniciando busca de produtos com estoque baixo");

    const result = await withRetry(async () => {
      // Usar o endpoint específico para produtos com estoque baixo
      const estoqueResponse = await withTimeout(
        api.get("/api/estoque/produtos-baixo-estoque", {
          params: { 
            nivel: 'todos',
            limit: 10 
          }
        })
      );

      // Processar a resposta
      let produtosEstoqueBaixo = [];
      if (estoqueResponse?.data?.produtos) {
        produtosEstoqueBaixo = estoqueResponse.data.produtos.map(item => ({
          id: item.produto || item._id,
          nome: item.produtoNome || "Produto",
          local: item.local || "Local não especificado",
          estoqueAtual: item.quantidade || 0,
          estoqueMinimo: CONFIG.MIN_STOCK_THRESHOLD,
          status: item.status || (
            item.quantidade === 0 ? "esgotado" : 
            item.quantidade < CONFIG.MIN_STOCK_THRESHOLD / 2 ? "critico" : "baixo"
          )
        }));
      }
      
      return produtosEstoqueBaixo;
    }, CONFIG.MAX_RETRIES, "produtos com estoque baixo");

    console.log(`✅ Produtos com estoque baixo obtidos: ${result.length}`);
    
    // Armazenar no cache
    setCache(cacheKey, result);
    
    return result;
  } catch (error) {
    console.error("❌ Erro ao buscar produtos com estoque baixo:", error);
    
    // Tentar usar cache expirado como fallback
    const expiredCache = getFromCache(cacheKey);
    if (expiredCache) {
      console.log("⚠️ Usando cache expirado como fallback para estoque baixo");
      toast.warning("Usando dados de estoque em cache.", {
        toastId: "stock-cache-fallback",
        autoClose: 4000
      });
      return expiredCache;
    }
    
    // Fallback para o método antigo em caso de erro
    console.log("⚠️ Tentando método alternativo para estoque baixo");
    return getLowStockProductsLegacy();
  }
};

// Método legado mantido como fallback
const getLowStockProductsLegacy = async () => {
  try {
    console.log("🔍 Iniciando busca legada de produtos com estoque baixo");

    // Buscar produtos com timeout
    const produtosResponse = await withTimeout(api.get("/api/produtos"));

    // Processar produtos
    let produtos = [];
    if (produtosResponse?.data) {
      if (Array.isArray(produtosResponse.data)) {
        produtos = produtosResponse.data;
      } else if (
        produtosResponse.data.produtos &&
        Array.isArray(produtosResponse.data.produtos)
      ) {
        produtos = produtosResponse.data.produtos;
      }
    }

    console.log(`✅ Produtos analisados: ${produtos.length}`);

    // Se não houver produtos, retornar array vazio
    if (produtos.length === 0) {
      return [];
    }

    // Buscar dados de estoque
    let produtosComEstoque = [...produtos];

    try {
      // Tentar obter estoque direto
      const estoqueResponse = await withTimeout(api.get("/api/estoque"));

      if (estoqueResponse?.data) {
        let estoques = [];
        if (Array.isArray(estoqueResponse.data)) {
          estoques = estoqueResponse.data;
        } else if (
          estoqueResponse.data.estoques &&
          Array.isArray(estoqueResponse.data.estoques)
        ) {
          estoques = estoqueResponse.data.estoques;
        }

        // Relacionar estoque com produtos
        produtosComEstoque = produtos.map((produto) => {
          const estoquesDoProduto = estoques.filter(
            (e) => e.produto === produto._id || e.produto?._id === produto._id
          );

          const estoqueTotal = estoquesDoProduto.reduce(
            (total, e) => total + (Number(e.quantidade) || 0),
            0
          );

          return {
            ...produto,
            estoqueAtual: estoqueTotal,
            estoqueMinimo: produto.estoqueMinimo || 10,
          };
        });
      }
    } catch (error) {
      console.log("⚠️ Usando dados de estoque dos próprios produtos");

      // Se falhar, usar estoque do próprio produto
      produtosComEstoque = produtos.map((produto) => ({
        ...produto,
        estoqueAtual:
          Number(produto.estoque) || Number(produto.quantidade) || 0,
        estoqueMinimo: produto.estoqueMinimo || CONFIG.MIN_STOCK_THRESHOLD,
      }));
    }

    // Filtrar produtos com estoque baixo
    const produtosBaixoEstoque = produtosComEstoque
      .filter((p) => {
        const estoqueAtual = p.estoqueAtual || 0;
        return estoqueAtual <= CONFIG.MIN_STOCK_THRESHOLD;
      })
      .map((p) => {
        const estoqueAtual = p.estoqueAtual || 0;
        let status = "baixo";
        
        if (estoqueAtual === 0) {
          status = "esgotado";
        } else if (estoqueAtual <= CONFIG.MIN_STOCK_THRESHOLD / 2) {
          status = "critico";
        }
        
        return {
          id: p._id || p.id,
          nome: p.nome,
          estoqueAtual: estoqueAtual,
          estoqueMinimo: CONFIG.MIN_STOCK_THRESHOLD,
          local: p.local || "Depósito Principal",
          status: status
        };
      })
      .slice(0, 10);

    return produtosBaixoEstoque;
  } catch (error) {
    console.error("❌ Erro ao buscar produtos com estoque baixo (legado):", error);
    return [];
  }
};

// Obter distribuição de categorias com cache
export const getCategoryDistribution = async (useCache = true) => {
  const cacheKey = "categoryDistribution";
  
  // Verificar cache primeiro
  if (useCache && isCacheValid(cacheKey)) {
    console.log("📦 Usando cache para distribuição de categorias");
    return getFromCache(cacheKey);
  }
  
  try {
    console.log("🔍 Iniciando busca de distribuição de categorias");

    const result = await withRetry(async () => {
      // Buscar produtos com timeout
      const response = await withTimeout(api.get("/api/produtos"));

      // Processar produtos
      let produtos = [];
      if (response?.data) {
        if (Array.isArray(response.data)) {
          produtos = response.data;
        } else if (
          response.data.produtos &&
          Array.isArray(response.data.produtos)
        ) {
          produtos = response.data.produtos;
        }
      }

      console.log(`✅ Produtos analisados para categorias: ${produtos.length}`);

      // Se não houver produtos, retornar array vazio
      if (produtos.length === 0) {
        return [];
      }

      // Agrupar por categoria
      const categorias = {};
      produtos.forEach((produto) => {
        const categoria = produto.categoria || "Sem categoria";

        if (!categorias[categoria]) {
          categorias[categoria] = 0;
        }

        categorias[categoria]++;
      });

      // Converter para array e ordenar
      return Object.keys(categorias)
        .map((categoria) => ({
          nome: categoria,
          quantidade: categorias[categoria],
        }))
        .sort((a, b) => b.quantidade - a.quantidade);
    }, CONFIG.MAX_RETRIES, "distribuição de categorias");
    
    // Armazenar no cache
    setCache(cacheKey, result);
    
    return result;
  } catch (error) {
    console.error("❌ Erro ao buscar distribuição de categorias:", error);
    
    // Tentar usar cache expirado como fallback
    const expiredCache = getFromCache(cacheKey);
    if (expiredCache) {
      console.log("⚠️ Usando cache expirado como fallback para categorias");
      return expiredCache;
    }
    
    return [];
  }
};

// Obter movimentações recentes com cache e fallback melhorado
export const getRecentTransactions = async (limit = 8, useCache = true) => {
  const cacheKey = `recentTransactions_${limit}`;
  
  // Verificar cache primeiro
  if (useCache && isCacheValid(cacheKey)) {
    console.log("📦 Usando cache para movimentações recentes");
    return getFromCache(cacheKey);
  }
  
  try {
    console.log(`🔍 Iniciando busca de ${limit} movimentações recentes`);

    const result = await withRetry(async () => {
      // Buscar movimentações com timeout
      const response = await withTimeout(
        api.get("/api/movimentacoes/historico", {
          params: { limit },
        })
      );

      // Processar movimentações
      let movimentacoes = [];
      if (response?.data) {
        if (Array.isArray(response.data)) {
          movimentacoes = response.data;
        } else if (
          response.data.movimentacoes &&
          Array.isArray(response.data.movimentacoes)
        ) {
          movimentacoes = response.data.movimentacoes;
        }
      }

      return movimentacoes;
    }, CONFIG.MAX_RETRIES, "movimentações recentes");

    console.log(`✅ Movimentações obtidas: ${result.length}`);
    
    // Armazenar no cache
    setCache(cacheKey, result);
    
    return result;
  } catch (error) {
    console.error("❌ Erro ao buscar movimentações:", error);
    
    const errorInfo = categorizeError(error);
    
    // Tentar usar cache expirado como fallback
    const expiredCache = getFromCache(cacheKey);
    if (expiredCache) {
      console.log("⚠️ Usando cache expirado como fallback para movimentações");
      toast.warning("Usando dados de movimentações em cache.", {
        toastId: "movements-cache-fallback",
        autoClose: 4000
      });
      return expiredCache;
    }
    
    // Mostrar erro contextualizado
    toast.error(`Erro ao carregar movimentações: ${errorInfo.message}`, {
      toastId: "movements-error",
      autoClose: 5000
    });
    
    return [];
  }
};
