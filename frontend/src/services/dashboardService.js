import api from "./api";

// Função auxiliar para adicionar timeout em qualquer promessa - REDUZIDO para 8s
const withTimeout = (promise, timeoutMs = 8000) => {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(
      () => reject(new Error(`Timeout após ${timeoutMs}ms`)),
      timeoutMs
    );
  });

  return Promise.race([promise, timeoutPromise]);
};

// Obter estatísticas de produtos - OTIMIZADO para usar endpoint de contagem
export const getProductStats = async () => {
  try {
    console.log("🔍 Buscando estatísticas de produtos...");

    // Buscar contagem e estatísticas em paralelo
    const [countResponse, estatisticasResponse] = await Promise.all([
      withTimeout(api.get("/api/produtos/count")),
      withTimeout(api.get("/api/produtos/estatisticas"))
    ]);

    // Usar countResponse como fonte primária de dados
    const total = countResponse.data?.total ?? estatisticasResponse.data?.total ?? 0;
    const quantidadeTotal = estatisticasResponse.data?.quantidadeTotal ?? 0;

    console.log(`✅ Estatísticas carregadas - Produtos: ${total}, Estoque total: ${quantidadeTotal}`);

    return { total, quantidadeTotal };
  } catch (error) {
    console.error("❌ Erro ao buscar estatísticas de produtos:", error);
    // Retornar valores padrão ao invés de throw para não quebrar o dashboard
    return { total: 0, quantidadeTotal: 0 };
  }
};

// Obter estatísticas de vendas
export const getSalesStats = async () => {
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

    // SOLUÇÃO: Consultar ambas as fontes usando tanto o dia atual quanto o próximo dia

    // 1. Fonte 1: Coleção Venda
    let totalVendasHoje = 0;
    try {
      const vendasResponse = await withTimeout(
        api.get("/api/vendas/historico", {
          params: {
            dataInicio: dataHoje,
            dataFim: dataAmanha, // Incluir o próximo dia para compensar fuso horário
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

        // Converter para data local para comparação
        const dataVenda = new Date(venda.dataVenda);
        return dataVenda.toISOString().split("T")[0] === dataHoje;
      });

      totalVendasHoje = vendasHoje.length;
      console.log(
        `Vendas filtradas para hoje da coleção Venda: ${totalVendasHoje}`
      );
    } catch (error) {
      console.error("Erro ao buscar vendas:", error);
    }

    // 2. Fonte 2: Coleção Movimentacao
    try {
      const movResponse = await withTimeout(
        api.get("/api/movimentacoes/historico", {
          params: {
            tipo: "venda",
            dataInicio: dataHoje,
            dataFim: dataAmanha, // Incluir o próximo dia para compensar fuso horário
          },
        })
      );

      const movimentacoesDePeriodo = movResponse?.data?.movimentacoes || [];
      console.log(
        `Movimentações encontradas: ${movimentacoesDePeriodo.length}`
      );

      // Filtrar apenas movimentações de hoje
      const movimentacoesHoje = movimentacoesDePeriodo.filter((mov) => {
        if (!mov.data) return false;

        // Converter para data local para comparação
        const dataMov = new Date(mov.data);
        return dataMov.toISOString().split("T")[0] === dataHoje;
      });

      console.log(
        `Movimentações filtradas para hoje: ${movimentacoesHoje.length}`
      );
      totalVendasHoje += movimentacoesHoje.length;
    } catch (error) {
      console.error("Erro ao buscar movimentações:", error);
    }

    console.log(`Total combinado de vendas hoje: ${totalVendasHoje}`);

    return {
      vendasHoje: totalVendasHoje,
      vendasDiarias: totalVendasHoje,
      tendenciaVendas: 0,
    };
  } catch (error) {
    console.error("❌ Erro ao buscar estatísticas de vendas:", error);
    return {
      vendasHoje: 0,
      vendasDiarias: 0,
      tendenciaVendas: 0,
    };
  }
};

// Obter top produtos mais vendidos
export const getTopProducts = async (limit = 5) => {
  try {
    console.log(`🔍 Iniciando busca dos top ${limit} produtos`);

    // Definir período de 3 meses
    const dataFim = new Date();
    const dataInicio = new Date();
    dataInicio.setMonth(dataInicio.getMonth() - 3);

    // Buscar histórico com timeout
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

    console.log(`✅ Vendas analisadas: ${vendas.length}`);

    // Se não houver vendas, retornar array vazio
    if (vendas.length === 0) {
      return [];
    }

    // Agrupar vendas por produto
    const produtosMap = {};
    vendas.forEach((venda) => {
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
    return Object.values(produtosMap)
      .sort((a, b) => b.quantidadeVendas - a.quantidadeVendas)
      .slice(0, limit);
  } catch (error) {
    console.error("❌ Erro ao buscar top produtos:", error);
    return [];
  }
};

// Obter produtos com estoque baixo
export const getLowStockProducts = async () => {
  try {
    console.log("🔍 Iniciando busca de produtos com estoque baixo");

    // Usar o novo endpoint específico para produtos com estoque baixo
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
        estoqueMinimo: 20, // Usar o limite padrão definido no backend
        status: item.status || (
          item.quantidade === 0 ? "esgotado" : 
          item.quantidade < 10 ? "critico" : "baixo"
        )
      }));
    } else {
      // Fallback para o método antigo se o novo endpoint falhar
      console.log("⚠️ Endpoint específico falhou, usando método antigo");
      return getLowStockProductsLegacy();
    }

    console.log(`✅ Produtos com estoque baixo obtidos: ${produtosEstoqueBaixo.length}`);
    return produtosEstoqueBaixo;
  } catch (error) {
    console.error("❌ Erro ao buscar produtos com estoque baixo:", error);
    // Fallback para o método antigo em caso de erro
    console.log("⚠️ Tentando método alternativo");
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
        estoqueMinimo: produto.estoqueMinimo || 10,
      }));
    }

    // Filtrar produtos com estoque baixo
    const produtosBaixoEstoque = produtosComEstoque
      .filter((p) => {
        const estoqueAtual = p.estoqueAtual || 0;
        return estoqueAtual <= 20; // Usando o novo limite de 20
      })
      .map((p) => {
        const estoqueAtual = p.estoqueAtual || 0;
        let status = "baixo";
        
        if (estoqueAtual === 0) {
          status = "esgotado";
        } else if (estoqueAtual <= 10) {
          status = "critico";
        }
        
        return {
          id: p._id || p.id,
          nome: p.nome,
          estoqueAtual: estoqueAtual,
          estoqueMinimo: 20, // Novo limite padrão
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

// Obter distribuição de categorias
export const getCategoryDistribution = async () => {
  try {
    console.log("🔍 Iniciando busca de distribuição de categorias");

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

    console.log(`✅ Produtos analisados: ${produtos.length}`);

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
  } catch (error) {
    console.error("❌ Erro ao buscar distribuição de categorias:", error);
    return [];
  }
};

// Obter movimentações recentes
export const getRecentTransactions = async (limit = 8) => {
  try {
    console.log(`🔍 Iniciando busca de ${limit} movimentações recentes`);

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

    console.log(`✅ Movimentações obtidas: ${movimentacoes.length}`);

    return movimentacoes;
  } catch (error) {
    console.error("❌ Erro ao buscar movimentações:", error);
    return [];
  }
};
