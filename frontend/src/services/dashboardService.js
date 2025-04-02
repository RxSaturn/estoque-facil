import api from "./api";

// Função auxiliar para adicionar timeout em qualquer promessa
const withTimeout = (promise, timeoutMs = 5000) => {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(
      () => reject(new Error(`Timeout após ${timeoutMs}ms`)),
      timeoutMs
    );
  });

  return Promise.race([promise, timeoutPromise]);
};

// Obter estatísticas de produtos
export const getProductStats = async () => {
  try {
    console.log("🔍 Buscando estatísticas de produtos...");

    // Usar a rota específica de estatísticas com timeout
    const estatisticasPromise = api.get("/api/produtos/estatisticas");
    const estatisticasResponse = await withTimeout(estatisticasPromise);

    if (estatisticasResponse?.data?.total) {
      console.log(
        "✅ Estatísticas de produtos obtidas com sucesso:",
        estatisticasResponse.data
      );
      return estatisticasResponse.data;
    }

    // Fallback: Buscar usando a API normal de produtos
    console.log("⚠️ Usando fallback para obter total de produtos...");
    const produtosPromise = api.get("/api/produtos?limit=1");
    const produtosResponse = await withTimeout(produtosPromise);

    console.log("Resposta da API de produtos:", produtosResponse.data);

    // Extrair o total dependendo do formato da resposta
    let total = 0;
    let quantidadeTotal = 0;

    if (produtosResponse.data && typeof produtosResponse.data === "object") {
      // Formato 1: { total: X, produtos: [...] }
      if (typeof produtosResponse.data.total === "number") {
        total = produtosResponse.data.total;
        console.log(`Total de produtos encontrado na resposta: ${total}`);
      }
      // Formato 2: produtos é um array diretamente
      else if (Array.isArray(produtosResponse.data)) {
        total = produtosResponse.data.length;
        console.log(`Total de produtos inferido do tamanho do array: ${total}`);
      }
    }

    return { total, quantidadeTotal };
  } catch (error) {
    console.error("❌ Erro ao buscar estatísticas de produtos:", error);
    throw error;
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
    return produtosComEstoque
      .filter((p) => {
        const estoqueAtual = p.estoqueAtual || 0;
        const estoqueMinimo = p.estoqueMinimo || 10;
        return estoqueAtual <= estoqueMinimo;
      })
      .map((p) => ({
        id: p._id || p.id,
        nome: p.nome,
        estoqueAtual: p.estoqueAtual || 0,
        estoqueMinimo: p.estoqueMinimo || 10,
        local: p.local || "Depósito Principal",
      }))
      .slice(0, 10);
  } catch (error) {
    console.error("❌ Erro ao buscar produtos com estoque baixo:", error);
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
