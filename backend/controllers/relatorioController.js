const Produto = require("../models/Produto");
const Estoque = require("../models/Estoque");
const Venda = require("../models/Venda");
const Movimentacao = require("../models/Movimentacao");
const PDFDocument = require("pdfkit");

// Gerar um resumo para relatório com dados reais do banco
exports.gerarResumo = async (req, res) => {
  try {
    console.log(
      `Gerando relatório para ${req.usuario?.nome || "usuário"} (${
        req.usuario?.email || "N/A"
      })`
    );
    const { dataInicio, dataFim, tipo, categoria, subcategoria, local } =
      req.query;

    // Validar parâmetros de data
    if (!dataInicio || !dataFim) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Período é obrigatório",
      });
    }

    // Data de início e fim para filtros
    const dataInicioObj = new Date(dataInicio);
    const dataFimObj = new Date(dataFim);
    dataFimObj.setHours(23, 59, 59, 999); // Incluir o dia inteiro

    console.log(
      `Período do relatório: ${dataInicioObj.toISOString()} a ${dataFimObj.toISOString()}`
    );

    // Construir filtros
    const filtroVendas = {
      dataVenda: {
        $gte: dataInicioObj,
        $lte: dataFimObj,
      },
    };

    const filtroProdutos = {};
    const filtroEstoque = {};

    if (tipo) {
      filtroProdutos.tipo = tipo;
      console.log(`Filtro por tipo: ${tipo}`);
    }

    if (categoria) {
      filtroProdutos.categoria = categoria;
      console.log(`Filtro por categoria: ${categoria}`);
    }

    if (subcategoria) {
      filtroProdutos.subcategoria = subcategoria;
      console.log(`Filtro por subcategoria: ${subcategoria}`);
    }

    // Apenas incluir produtos que atendem aos filtros, se houver
    if (Object.keys(filtroProdutos).length > 0) {
      const produtosFiltrados = await Produto.find(filtroProdutos).select(
        "_id"
      );
      const idsProdutos = produtosFiltrados.map((p) => p._id);

      filtroVendas.produto = { $in: idsProdutos };
      filtroEstoque.produto = { $in: idsProdutos };
    }

    if (local) {
      filtroVendas.local = local;
      filtroEstoque.local = local;
      console.log(`Filtro por local: ${local}`);
    }

    // ----- Cálculos reais para o relatório -----

    // 1. Contagens básicas
    const totalProdutos = await Produto.countDocuments(filtroProdutos);
    const totalVendas = await Venda.countDocuments(filtroVendas);

    // 2. Calcular vendas por categoria
    const vendasPorCategoria = await calcularVendasPorCategoria(
      filtroVendas,
      dataInicioObj,
      dataFimObj
    );

    // 3. Calcular estoque por local
    const estoquePorLocal = await calcularEstoquePorLocal(filtroEstoque);

    // 4. Produtos sem movimentação no período
    const produtosSemMovimentacao = await obterProdutosSemMovimentacao(
      dataInicioObj,
      dataFimObj,
      filtroProdutos,
      local
    );

    // 5. Top produtos vendidos
    const topProdutos = await obterTopProdutos(
      filtroVendas,
      dataInicioObj,
      dataFimObj
    );

    // 6. Estatísticas adicionais
    const estatisticas = await calcularEstatisticas(
      filtroVendas,
      dataInicioObj,
      dataFimObj
    );

    // 7. Distribuição de produtos sem movimentação por local
    const estoqueSemMovimentacao = await calcularEstoqueSemMovimentacao(
      produtosSemMovimentacao
    );

    // Construir objeto de resposta
    const resumo = {
      totalProdutos,
      totalVendas,
      semMovimentacao: produtosSemMovimentacao.length,
      mediaVendasDiarias: estatisticas.mediaVendasDiarias,
      totalItensVendidos: estatisticas.totalItensVendidos,
      diaMaiorVenda: estatisticas.diaMaiorVenda,
      produtosEstoqueCritico: estatisticas.produtosEstoqueCritico,
      vendasPorCategoria,
      estoquePorLocal,
      topProdutos,
      produtosSemMovimentacao,
      estoqueSemMovimentacao,
    };

    res.status(200).json(resumo);
  } catch (error) {
    console.error("Erro ao gerar resumo do relatório:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao gerar resumo",
      erro: error.message,
    });
  }
};

// Função para calcular vendas por categoria
async function calcularVendasPorCategoria(filtroVendas, dataInicio, dataFim) {
  try {
    // Pipeline de agregação para vendas por categoria
    const resultado = await Venda.aggregate([
      {
        $match: {
          dataVenda: { $gte: dataInicio, $lte: dataFim },
          ...filtroVendas,
        },
      },
      {
        $lookup: {
          from: "produtos",
          localField: "produto",
          foreignField: "_id",
          as: "produtoInfo",
        },
      },
      { $unwind: "$produtoInfo" },
      {
        $group: {
          _id: "$produtoInfo.categoria",
          total: { $sum: "$quantidade" },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // Formatar para o frontend
    return {
      labels: resultado.map((item) => item._id || "Sem categoria"),
      dados: resultado.map((item) => item.total),
    };
  } catch (error) {
    console.error("Erro ao calcular vendas por categoria:", error);
    return { labels: [], dados: [] };
  }
}

// Função para calcular estoque por local
async function calcularEstoquePorLocal(filtroEstoque) {
  try {
    // Pipeline de agregação para estoque por local
    const resultado = await Estoque.aggregate([
      { $match: filtroEstoque },
      {
        $group: {
          _id: "$local",
          total: { $sum: "$quantidade" },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // Formatar para o frontend
    return {
      labels: resultado.map((item) => item._id || "Sem local"),
      dados: resultado.map((item) => item.total),
    };
  } catch (error) {
    console.error("Erro ao calcular estoque por local:", error);
    return { labels: [], dados: [] };
  }
}

// Função para calcular estatísticas adicionais
async function calcularEstatisticas(filtroVendas, dataInicio, dataFim) {
  try {
    // Total de itens vendidos
    const resultadoTotal = await Venda.aggregate([
      { $match: filtroVendas },
      {
        $group: {
          _id: null,
          total: { $sum: "$quantidade" },
        },
      },
    ]);

    const totalItensVendidos =
      resultadoTotal.length > 0 ? resultadoTotal[0].total : 0;

    // Calcular vendas por dia para encontrar o dia com maior venda
    const vendasPorDia = await Venda.aggregate([
      { $match: filtroVendas },
      {
        $addFields: {
          dataFormatada: {
            $dateToString: { format: "%Y-%m-%d", date: "$dataVenda" },
          },
        },
      },
      {
        $group: {
          _id: "$dataFormatada",
          total: { $sum: "$quantidade" },
        },
      },
      { $sort: { total: -1 } },
      { $limit: 1 },
    ]);

    // Dia com maior venda
    const diaMaiorVenda =
      vendasPorDia.length > 0 ? new Date(vendasPorDia[0]._id) : null;

    // Calcular média diária
    // Diferença em dias entre as datas
    const diffTime = Math.abs(dataFim - dataInicio);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1; // Pelo menos 1 dia

    const mediaVendasDiarias = totalItensVendidos / diffDays;

    // Produtos com estoque crítico (menos de 10% do estoque médio)
    const estoqueCritico = await Estoque.aggregate([
      { $match: { quantidade: { $gt: 0 } } },
      {
        $group: {
          _id: null,
          mediaEstoque: { $avg: "$quantidade" },
        },
      },
    ]);

    const mediaEstoque =
      estoqueCritico.length > 0 ? estoqueCritico[0].mediaEstoque : 10;
    const nivelCritico = mediaEstoque * 0.1;

    const produtosEstoqueCritico = await Estoque.countDocuments({
      quantidade: { $gt: 0, $lte: nivelCritico },
    });

    return {
      totalItensVendidos,
      diaMaiorVenda,
      mediaVendasDiarias,
      produtosEstoqueCritico,
    };
  } catch (error) {
    console.error("Erro ao calcular estatísticas:", error);
    return {
      totalItensVendidos: 0,
      diaMaiorVenda: null,
      mediaVendasDiarias: 0,
      produtosEstoqueCritico: 0,
    };
  }
}

// Função para obter produtos sem movimentação no período
async function obterProdutosSemMovimentacao(
  dataInicio,
  dataFim,
  filtroProdutos,
  local = null
) {
  try {
    // 1. Obter todos os produtos que atendem aos filtros
    const produtos = await Produto.find(filtroProdutos);

    // 2. Obter IDs de produtos que tiveram movimentações no período
    const produtosComMovimentacao = await Movimentacao.distinct("produto", {
      data: { $gte: dataInicio, $lte: dataFim },
    });

    // 3. Obter IDs de produtos que tiveram vendas no período
    const produtosComVendas = await Venda.distinct("produto", {
      dataVenda: { $gte: dataInicio, $lte: dataFim },
    });

    // 4. IDs de produtos com atividade
    const produtosAtivos = [
      ...new Set([...produtosComMovimentacao, ...produtosComVendas]),
    ];

    // 5. Filtrar produtos sem atividade
    const produtosSemAtividade = produtos.filter(
      (produto) =>
        !produtosAtivos.some(
          (id) => id && produto._id && id.toString() === produto._id.toString()
        )
    );

    // 6. Obter informações de estoque para esses produtos
    const produtosSemMovimentacao = [];

    for (const produto of produtosSemAtividade) {
      // Filtro de estoque para este produto
      const filtroEstoqueLocal = {
        produto: produto._id,
        ...(local ? { local } : {}),
      };

      // Buscar estoques
      const estoques = await Estoque.find(filtroEstoqueLocal);

      // Se há estoque, adicionar cada local como uma entrada separada
      if (estoques.length > 0) {
        for (const estoque of estoques) {
          // Obter data da última movimentação (se houver)
          const ultimaMovimentacao = await Movimentacao.findOne({
            produto: produto._id,
            localOrigem: estoque.local,
          })
            .sort({ data: -1 })
            .limit(1);

          produtosSemMovimentacao.push({
            id: produto.id,
            nome: produto.nome,
            tipo: produto.tipo,
            categoria: produto.categoria,
            subcategoria: produto.subcategoria,
            local: estoque.local,
            quantidade: estoque.quantidade,
            ultimaMovimentacao: ultimaMovimentacao?.data || null,
          });
        }
      }
    }

    return produtosSemMovimentacao;
  } catch (error) {
    console.error("Erro ao obter produtos sem movimentação:", error);
    return [];
  }
}

// Função para obter top produtos vendidos
async function obterTopProdutos(filtroVendas, dataInicio, dataFim) {
  try {
    // 1. Obter total de vendas no período
    const totalVendas = await Venda.aggregate([
      {
        $match: {
          dataVenda: { $gte: dataInicio, $lte: dataFim },
          ...filtroVendas,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$quantidade" },
        },
      },
    ]);

    const totalGeral = totalVendas.length > 0 ? totalVendas[0].total : 0;

    // 2. Obter top produtos por quantidade vendida
    const resultadoProdutos = await Venda.aggregate([
      {
        $match: {
          dataVenda: { $gte: dataInicio, $lte: dataFim },
          ...filtroVendas,
        },
      },
      {
        $lookup: {
          from: "produtos",
          localField: "produto",
          foreignField: "_id",
          as: "produtoInfo",
        },
      },
      { $unwind: "$produtoInfo" },
      {
        $group: {
          _id: "$produto",
          nome: { $first: "$produtoInfo.nome" },
          id: { $first: "$produtoInfo.id" },
          tipo: { $first: "$produtoInfo.tipo" },
          categoria: { $first: "$produtoInfo.categoria" },
          subcategoria: { $first: "$produtoInfo.subcategoria" },
          quantidade: { $sum: "$quantidade" },
        },
      },
      { $sort: { quantidade: -1 } },
      { $limit: 20 },
    ]);

    // 3. Calcular percentual para cada produto
    return resultadoProdutos.map((produto) => ({
      ...produto,
      percentual:
        totalGeral > 0
          ? parseFloat(((produto.quantidade / totalGeral) * 100).toFixed(1))
          : 0,
    }));
  } catch (error) {
    console.error("Erro ao obter top produtos:", error);
    return [];
  }
}

// Função para calcular distribuição de produtos sem movimentação por local
async function calcularEstoqueSemMovimentacao(produtosSemMovimentacao) {
  try {
    // Agrupar por local
    const locais = {};

    produtosSemMovimentacao.forEach((produto) => {
      if (!locais[produto.local]) {
        locais[produto.local] = 0;
      }
      locais[produto.local]++;
    });

    // Converter para o formato esperado pelo frontend
    const labels = Object.keys(locais);
    const dados = labels.map((local) => locais[local]);

    return { labels, dados };
  } catch (error) {
    console.error(
      "Erro ao calcular distribuição de produtos sem movimentação:",
      error
    );
    return { labels: [], dados: [] };
  }
}

// Gerar PDF com relatório completo
exports.gerarPDF = async (req, res) => {
  try {
    // Parâmetros do relatório
    const { dataInicio, dataFim, tipo, categoria, subcategoria, local } =
      req.query;

    // Obter dados do resumo para o PDF
    // Data de início e fim para filtros
    const dataInicioObj = new Date(dataInicio);
    const dataFimObj = new Date(dataFim);
    dataFimObj.setHours(23, 59, 59, 999); // Incluir o dia inteiro

    // Construir filtros igual à função gerarResumo
    const filtroVendas = {
      dataVenda: {
        $gte: dataInicioObj,
        $lte: dataFimObj,
      },
    };

    const filtroProdutos = {};

    if (tipo) filtroProdutos.tipo = tipo;
    if (categoria) filtroProdutos.categoria = categoria;
    if (subcategoria) filtroProdutos.subcategoria = subcategoria;

    // Obter produtos filtrados
    if (Object.keys(filtroProdutos).length > 0) {
      const produtosFiltrados = await Produto.find(filtroProdutos).select(
        "_id"
      );
      const idsProdutos = produtosFiltrados.map((p) => p._id);

      filtroVendas.produto = { $in: idsProdutos };
    }

    if (local) filtroVendas.local = local;

    // Calcular dados reais para o PDF
    const totalProdutos = await Produto.countDocuments(filtroProdutos);
    const totalVendas = await Venda.countDocuments(filtroVendas);
    const estatisticas = await calcularEstatisticas(
      filtroVendas,
      dataInicioObj,
      dataFimObj
    );
    const topProdutos = await obterTopProdutos(
      filtroVendas,
      dataInicioObj,
      dataFimObj
    );
    const produtosSemMovimentacao = await obterProdutosSemMovimentacao(
      dataInicioObj,
      dataFimObj,
      filtroProdutos,
      local
    );

    // Inicializar PDF
    const doc = new PDFDocument({
      margin: 50,
      size: "A4",
    });

    // Configurar resposta HTTP para download do PDF
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=relatorio-estoque-${
        new Date().toISOString().split("T")[0]
      }.pdf`
    );
    res.setHeader("Content-Type", "application/pdf");

    // Pipe o PDF diretamente para a resposta
    doc.pipe(res);

    // Título do relatório
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("Relatório de Estoque e Vendas", { align: "center" });
    doc.moveDown();

    // Informações do período
    doc
      .fontSize(12)
      .font("Helvetica")
      .text(
        `Período: ${new Date(dataInicio).toLocaleDateString(
          "pt-BR"
        )} a ${new Date(dataFim).toLocaleDateString("pt-BR")}`,
        { align: "center" }
      );

    if (tipo) doc.text(`Tipo: ${tipo}`, { align: "center" });
    if (categoria) doc.text(`Categoria: ${categoria}`, { align: "center" });
    if (subcategoria)
      doc.text(`Subcategoria: ${subcategoria}`, { align: "center" });
    if (local) doc.text(`Local: ${local}`, { align: "center" });

    doc.moveDown(2);

    // Resumo
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("Resumo Geral", { underline: true });
    doc.moveDown();

    doc
      .fontSize(12)
      .font("Helvetica")
      .text(`Total de Produtos: ${totalProdutos}`);
    doc.text(`Total de Vendas: ${totalVendas}`);
    doc.text(`Produtos sem Movimentação: ${produtosSemMovimentacao.length}`);
    doc.text(
      `Média de Vendas Diárias: ${estatisticas.mediaVendasDiarias.toFixed(2)}`
    );
    doc.text(`Total de Itens Vendidos: ${estatisticas.totalItensVendidos}`);

    if (estatisticas.diaMaiorVenda) {
      doc.text(
        `Dia com Maior Venda: ${estatisticas.diaMaiorVenda.toLocaleDateString(
          "pt-BR"
        )}`
      );
    }

    doc.text(
      `Produtos com Estoque Crítico: ${estatisticas.produtosEstoqueCritico}`
    );

    doc.moveDown(2);

    // Top Produtos
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("Top Produtos Vendidos", { underline: true });
    doc.moveDown();

    if (topProdutos.length > 0) {
      // Cabeçalho da tabela
      doc.fontSize(10).font("Helvetica-Bold");
      doc.text("ID", 50, doc.y, { width: 60 });
      doc.text("Produto", 110, doc.y, { width: 150 });
      doc.text("Tipo", 260, doc.y, { width: 70 });
      doc.text("Categoria", 330, doc.y, { width: 90 });
      doc.text("Qtd", 420, doc.y, { width: 40 });
      doc.text("%", 460, doc.y, { width: 40 });
      doc.moveDown();

      // Linha separadora
      doc.moveTo(50, doc.y).lineTo(500, doc.y).stroke();
      doc.moveDown(0.5);

      // Dados da tabela
      doc.fontSize(10).font("Helvetica");

      // Adicionar linhas
      topProdutos.slice(0, 10).forEach((produto) => {
        // Limitar aos 10 primeiros
        doc.text(produto.id, 50, doc.y, { width: 60 });
        doc.text(produto.nome, 110, doc.y, { width: 150 });
        doc.text(produto.tipo, 260, doc.y, { width: 70 });
        doc.text(produto.categoria, 330, doc.y, { width: 90 });
        doc.text(produto.quantidade.toString(), 420, doc.y, { width: 40 });
        doc.text(produto.percentual.toString() + "%", 460, doc.y, {
          width: 40,
        });
        doc.moveDown();
      });
    } else {
      doc.text("Nenhuma venda registrada no período selecionado.");
    }

    doc.moveDown(2);

    // Produtos sem movimentação
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("Produtos sem Movimentação", { underline: true });
    doc.moveDown();

    if (produtosSemMovimentacao.length > 0) {
      // Cabeçalho da tabela
      doc.fontSize(10).font("Helvetica-Bold");
      doc.text("ID", 50, doc.y, { width: 60 });
      doc.text("Produto", 110, doc.y, { width: 150 });
      doc.text("Local", 260, doc.y, { width: 70 });
      doc.text("Estoque", 330, doc.y, { width: 60 });
      doc.moveDown();

      // Linha separadora
      doc.moveTo(50, doc.y).lineTo(500, doc.y).stroke();
      doc.moveDown(0.5);

      // Dados da tabela
      doc.fontSize(10).font("Helvetica");

      // Adicionar linhas (limitando aos primeiros 10 para não sobrecarregar o PDF)
      produtosSemMovimentacao.slice(0, 10).forEach((produto) => {
        doc.text(produto.id, 50, doc.y, { width: 60 });
        doc.text(produto.nome, 110, doc.y, { width: 150 });
        doc.text(produto.local, 260, doc.y, { width: 70 });
        doc.text(produto.quantidade.toString(), 330, doc.y, { width: 60 });
        doc.moveDown();
      });

      // Se houver mais de 10 itens, mostrar mensagem
      if (produtosSemMovimentacao.length > 10) {
        doc.moveDown(0.5);
        doc.text(
          `... e mais ${
            produtosSemMovimentacao.length - 10
          } produtos sem movimentação.`
        );
      }
    } else {
      doc.text(
        "Todos os produtos tiveram movimentação no período selecionado."
      );
    }

    // Rodapé
    doc.moveDown(2);
    doc
      .fontSize(10)
      .font("Helvetica-Oblique")
      .text(
        `Relatório gerado por ${
          req.usuario?.nome || "Usuário"
        } em ${new Date().toLocaleString("pt-BR")}`,
        { align: "center" }
      );

    // Finalizar documento
    doc.end();
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao gerar PDF",
      erro: error.message,
    });
  }
};
