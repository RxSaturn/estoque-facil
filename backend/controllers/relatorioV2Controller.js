const PDFDocument = require("pdfkit");
const Produto = require("../models/Produto");
const Venda = require("../models/Venda");
const Estoque = require("../models/Estoque");

// Constants for time calculations
const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;

// Constants for default values
const DEFAULT_USER_NAME = "Usuário";

/**
 * Construir filtros base para vendas
 */
function buildVendaFilter(dataInicio, dataFim, produtosIds, local) {
  const filtroVendas = {
    dataVenda: {
      $gte: dataInicio,
      $lte: dataFim,
    },
  };

  if (produtosIds && produtosIds.length > 0) {
    filtroVendas.produto = { $in: produtosIds };
  }

  if (local) {
    filtroVendas.local = local;
  }

  return filtroVendas;
}

/**
 * Obter IDs de produtos filtrados
 */
async function getFilteredProductIds(tipo, categoria, subcategoria) {
  const filtroProdutos = {};
  if (tipo) filtroProdutos.tipo = tipo;
  if (categoria) filtroProdutos.categoria = categoria;
  if (subcategoria) filtroProdutos.subcategoria = subcategoria;

  if (Object.keys(filtroProdutos).length === 0) {
    return { filtroProdutos, produtosIds: null };
  }

  const produtosFiltrados = await Produto.find(filtroProdutos).select("_id").lean();
  return {
    filtroProdutos,
    produtosIds: produtosFiltrados.map((p) => p._id),
  };
}

/**
 * Endpoint otimizado para obter todos os dados do relatório em uma única query
 * GET /api/relatorios/v2/dados
 * 
 * Retorna: estatísticas, gráficos, top produtos, todos produtos vendidos em uma estrutura consolidada
 */
exports.getDadosRelatorio = async (req, res) => {
  try {
    const {
      dataInicio,
      dataFim,
      tipo,
      categoria,
      subcategoria,
      local,
      metodoCalculo = "transacoes",
    } = req.query;

    // Validar parâmetros obrigatórios
    if (!dataInicio || !dataFim) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Datas de início e fim são obrigatórias",
      });
    }

    const dataInicioObj = new Date(`${dataInicio}T00:00:00.000Z`);
    const dataFimObj = new Date(`${dataFim}T23:59:59.999Z`);

    // Validar datas
    if (isNaN(dataInicioObj.getTime()) || isNaN(dataFimObj.getTime())) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Datas inválidas",
      });
    }

    // Obter IDs de produtos filtrados
    const { filtroProdutos, produtosIds } = await getFilteredProductIds(
      tipo,
      categoria,
      subcategoria
    );

    // Construir filtro de vendas
    const filtroVendas = buildVendaFilter(dataInicioObj, dataFimObj, produtosIds, local);

    // Construir filtro de estoque
    const filtroEstoque = {};
    if (produtosIds) filtroEstoque.produto = { $in: produtosIds };
    if (local) filtroEstoque.local = local;

    // Calcular número de dias no período
    const diffDays = Math.max(1, Math.ceil((dataFimObj - dataInicioObj) / MILLISECONDS_PER_DAY));

    // Executar agregação principal com $facet para obter todos os dados em uma query
    const [agregacaoVendas, totalProdutos, estoquePorLocal] = await Promise.all([
      // Agregação principal de vendas usando $facet
      Venda.aggregate([
        { $match: filtroVendas },
        {
          $facet: {
            // Estatísticas gerais
            estatisticas: [
              {
                $group: {
                  _id: null,
                  totalVendas: { $sum: 1 },
                  totalItensVendidos: { $sum: "$quantidade" },
                },
              },
            ],
            // Vendas por dia (para gráfico)
            vendasPorDia: [
              {
                $group: {
                  _id: {
                    $dateToString: {
                      format: "%Y-%m-%d",
                      date: "$dataVenda",
                      timezone: "UTC",
                    },
                  },
                  quantidade: { $sum: "$quantidade" },
                  transacoes: { $sum: 1 },
                },
              },
              { $sort: { _id: 1 } },
            ],
            // Top produtos (agrupados por produto)
            topProdutos: [
              {
                $group: {
                  _id: "$produto",
                  vendas: { $sum: 1 },
                  quantidade: { $sum: "$quantidade" },
                },
              },
              { $sort: metodoCalculo === "transacoes" ? { vendas: -1 } : { quantidade: -1 } },
              { $limit: 20 },
              {
                $lookup: {
                  from: "produtos",
                  localField: "_id",
                  foreignField: "_id",
                  as: "produtoInfo",
                },
              },
              { $unwind: { path: "$produtoInfo", preserveNullAndEmptyArrays: true } },
            ],
            // Todos os produtos vendidos (para tabela completa)
            todosProdutos: [
              {
                $group: {
                  _id: "$produto",
                  vendas: { $sum: 1 },
                  quantidade: { $sum: "$quantidade" },
                },
              },
              { $sort: { quantidade: -1 } },
              {
                $lookup: {
                  from: "produtos",
                  localField: "_id",
                  foreignField: "_id",
                  as: "produtoInfo",
                },
              },
              { $unwind: { path: "$produtoInfo", preserveNullAndEmptyArrays: true } },
            ],
            // Vendas por categoria (para gráfico)
            vendasPorCategoria: [
              {
                $lookup: {
                  from: "produtos",
                  localField: "produto",
                  foreignField: "_id",
                  as: "produtoInfo",
                  pipeline: [{ $project: { categoria: 1 } }],
                },
              },
              { $unwind: { path: "$produtoInfo", preserveNullAndEmptyArrays: true } },
              {
                $group: {
                  _id: { $ifNull: ["$produtoInfo.categoria", "Sem Categoria"] },
                  quantidade: { $sum: "$quantidade" },
                  transacoes: { $sum: 1 },
                },
              },
              { $sort: { quantidade: -1 } },
            ],
          },
        },
      ]).allowDiskUse(true),
      
      // Contagem de produtos
      Produto.countDocuments(filtroProdutos),
      
      // Estoque por local (agregação separada por eficiência)
      Estoque.aggregate([
        { $match: filtroEstoque },
        {
          $group: {
            _id: "$local",
            total: { $sum: "$quantidade" },
            itens: { $sum: 1 },
          },
        },
        { $sort: { total: -1 } },
      ]),
    ]);

    // Extrair resultados da agregação
    const resultado = agregacaoVendas[0] || {
      estatisticas: [],
      vendasPorDia: [],
      topProdutos: [],
      todosProdutos: [],
      vendasPorCategoria: [],
    };

    // Processar estatísticas
    const stats = resultado.estatisticas[0] || { totalVendas: 0, totalItensVendidos: 0 };
    const totalVendas = stats.totalVendas || 0;
    const totalItensVendidos = stats.totalItensVendidos || 0;
    const mediaVendasDiarias = metodoCalculo === "transacoes"
      ? totalVendas / diffDays
      : totalItensVendidos / diffDays;

    // Encontrar dia com maior venda
    let diaMaiorVenda = null;
    if (resultado.vendasPorDia.length > 0) {
      const maiorDia = resultado.vendasPorDia.reduce((max, item) =>
        (metodoCalculo === "transacoes" ? item.transacoes : item.quantidade) >
        (metodoCalculo === "transacoes" ? max.transacoes : max.quantidade)
          ? item
          : max,
        resultado.vendasPorDia[0]
      );
      diaMaiorVenda = {
        data: maiorDia._id,
        quantidade: metodoCalculo === "transacoes" ? maiorDia.transacoes : maiorDia.quantidade,
      };
    }

    // Processar gráfico de vendas por dia
    const vendasPorDia = {
      labels: resultado.vendasPorDia.map((item) => {
        const [, mes, dia] = item._id.split("-");
        return `${dia}/${mes}`;
      }),
      dados: resultado.vendasPorDia.map((item) => item.quantidade),
      transacoes: resultado.vendasPorDia.map((item) => item.transacoes),
    };

    // Processar gráfico de vendas por categoria
    const vendasPorCategoria = {
      labels: resultado.vendasPorCategoria.map((item) => item._id),
      dados: resultado.vendasPorCategoria.map((item) => item.quantidade),
    };

    // Processar gráfico de estoque por local
    const estoqueLocal = {
      labels: estoquePorLocal.map((item) => item._id),
      dados: estoquePorLocal.map((item) => item.total),
    };

    // Calcular total para percentuais
    const totalValorTop = metodoCalculo === "transacoes"
      ? resultado.topProdutos.reduce((sum, p) => sum + (p.vendas || 0), 0)
      : resultado.topProdutos.reduce((sum, p) => sum + (p.quantidade || 0), 0);

    const totalValorTodos = metodoCalculo === "transacoes"
      ? resultado.todosProdutos.reduce((sum, p) => sum + (p.vendas || 0), 0)
      : resultado.todosProdutos.reduce((sum, p) => sum + (p.quantidade || 0), 0);

    // Processar top produtos
    const topProdutos = resultado.topProdutos
      .filter((p) => p.produtoInfo)
      .map((item) => {
        const valor = metodoCalculo === "transacoes" ? item.vendas : item.quantidade;
        return {
          id: item.produtoInfo.id || item._id.toString().substring(0, 8),
          nome: item.produtoInfo.nome || "Produto não encontrado",
          tipo: item.produtoInfo.tipo || "",
          categoria: item.produtoInfo.categoria || "",
          subcategoria: item.produtoInfo.subcategoria || "",
          vendas: item.vendas,
          quantidade: item.quantidade,
          percentual: totalValorTop > 0
            ? parseFloat(((valor / totalValorTop) * 100).toFixed(2))
            : 0,
        };
      });

    // Processar todos os produtos vendidos
    const todosProdutosVendidos = resultado.todosProdutos
      .filter((p) => p.produtoInfo)
      .map((item) => {
        const valor = metodoCalculo === "transacoes" ? item.vendas : item.quantidade;
        return {
          id: item.produtoInfo.id || item._id.toString().substring(0, 8),
          nome: item.produtoInfo.nome || "Produto não encontrado",
          tipo: item.produtoInfo.tipo || "",
          categoria: item.produtoInfo.categoria || "",
          subcategoria: item.produtoInfo.subcategoria || "",
          qtdVendida: item.quantidade,
          nVendas: item.vendas,
          percentual: totalValorTodos > 0
            ? parseFloat(((valor / totalValorTodos) * 100).toFixed(2))
            : 0,
        };
      });

    // Retornar resposta consolidada
    res.json({
      sucesso: true,
      periodo: {
        inicio: dataInicio,
        fim: dataFim,
      },
      resumo: {
        totalProdutos,
        totalVendas,
        totalItensVendidos,
        mediaVendasDiarias: isNaN(mediaVendasDiarias) ? 0 : parseFloat(mediaVendasDiarias.toFixed(2)),
        diaMaiorVenda,
      },
      graficos: {
        vendasPorDia,
        vendasPorCategoria,
        estoquePorLocal: estoqueLocal,
      },
      tabelas: {
        topProdutos,
        todosProdutos: todosProdutosVendidos,
      },
    });
  } catch (error) {
    console.error("Erro ao gerar dados do relatório V2:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao gerar dados do relatório",
      erro: error.message,
    });
  }
};

/**
 * Endpoint otimizado para gerar PDF
 * GET /api/relatorios/v2/pdf
 * 
 * Gera PDF com dados já processados, sem refazer queries duplicadas
 */
exports.gerarPDFOtimizado = async (req, res) => {
  try {
    const {
      dataInicio,
      dataFim,
      tipo,
      categoria,
      subcategoria,
      local,
      metodoCalculo = "transacoes",
    } = req.query;

    // Validar parâmetros obrigatórios
    if (!dataInicio || !dataFim) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Datas de início e fim são obrigatórias",
      });
    }

    const dataInicioObj = new Date(`${dataInicio}T00:00:00.000Z`);
    const dataFimObj = new Date(`${dataFim}T23:59:59.999Z`);

    // Validar datas
    if (isNaN(dataInicioObj.getTime()) || isNaN(dataFimObj.getTime())) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Datas inválidas",
      });
    }

    // Obter IDs de produtos filtrados
    const { filtroProdutos, produtosIds } = await getFilteredProductIds(
      tipo,
      categoria,
      subcategoria
    );

    // Construir filtro de vendas
    const filtroVendas = buildVendaFilter(dataInicioObj, dataFimObj, produtosIds, local);

    // Construir filtro de estoque
    const filtroEstoque = {};
    if (produtosIds) filtroEstoque.produto = { $in: produtosIds };
    if (local) filtroEstoque.local = local;

    // Executar agregação otimizada para PDF
    const [agregacaoVendas, totalProdutos, estoquePorLocal] = await Promise.all([
      Venda.aggregate([
        { $match: filtroVendas },
        {
          $facet: {
            estatisticas: [
              {
                $group: {
                  _id: null,
                  totalVendas: { $sum: 1 },
                  totalItensVendidos: { $sum: "$quantidade" },
                },
              },
            ],
            topProdutos: [
              {
                $group: {
                  _id: "$produto",
                  vendas: { $sum: 1 },
                  quantidade: { $sum: "$quantidade" },
                },
              },
              { $sort: metodoCalculo === "transacoes" ? { vendas: -1 } : { quantidade: -1 } },
              { $limit: 15 },
              {
                $lookup: {
                  from: "produtos",
                  localField: "_id",
                  foreignField: "_id",
                  as: "produtoInfo",
                },
              },
              { $unwind: { path: "$produtoInfo", preserveNullAndEmptyArrays: true } },
            ],
            todosProdutos: [
              {
                $group: {
                  _id: "$produto",
                  vendas: { $sum: 1 },
                  quantidade: { $sum: "$quantidade" },
                },
              },
              { $sort: { quantidade: -1 } },
              {
                $lookup: {
                  from: "produtos",
                  localField: "_id",
                  foreignField: "_id",
                  as: "produtoInfo",
                },
              },
              { $unwind: { path: "$produtoInfo", preserveNullAndEmptyArrays: true } },
            ],
            vendasPorCategoria: [
              {
                $lookup: {
                  from: "produtos",
                  localField: "produto",
                  foreignField: "_id",
                  as: "produtoInfo",
                  pipeline: [{ $project: { categoria: 1 } }],
                },
              },
              { $unwind: { path: "$produtoInfo", preserveNullAndEmptyArrays: true } },
              {
                $group: {
                  _id: { $ifNull: ["$produtoInfo.categoria", "Sem Categoria"] },
                  quantidade: { $sum: "$quantidade" },
                },
              },
              { $sort: { quantidade: -1 } },
            ],
          },
        },
      ]).allowDiskUse(true),
      
      Produto.countDocuments(filtroProdutos),
      
      Estoque.aggregate([
        { $match: filtroEstoque },
        {
          $group: {
            _id: "$local",
            total: { $sum: "$quantidade" },
          },
        },
        { $sort: { total: -1 } },
      ]),
    ]);

    // Extrair resultados
    const resultado = agregacaoVendas[0] || {
      estatisticas: [],
      topProdutos: [],
      todosProdutos: [],
      vendasPorCategoria: [],
    };

    const stats = resultado.estatisticas[0] || { totalVendas: 0, totalItensVendidos: 0 };
    const diffDays = Math.max(1, Math.ceil((dataFimObj - dataInicioObj) / MILLISECONDS_PER_DAY));
    const mediaVendasDiarias = metodoCalculo === "transacoes"
      ? stats.totalVendas / diffDays
      : stats.totalItensVendidos / diffDays;

    // Processar dados para PDF
    const vendasPorCategoria = {
      labels: resultado.vendasPorCategoria.map((item) => item._id),
      dados: resultado.vendasPorCategoria.map((item) => item.quantidade),
    };

    const estoqueLocal = {
      labels: estoquePorLocal.map((item) => item._id),
      dados: estoquePorLocal.map((item) => item.total),
    };

    // Calcular total para percentuais
    const totalValorTop = metodoCalculo === "transacoes"
      ? resultado.topProdutos.reduce((sum, p) => sum + (p.vendas || 0), 0)
      : resultado.topProdutos.reduce((sum, p) => sum + (p.quantidade || 0), 0);

    const topProdutos = resultado.topProdutos
      .filter((p) => p.produtoInfo)
      .map((item) => {
        const valor = metodoCalculo === "transacoes" ? item.vendas : item.quantidade;
        return {
          id: item.produtoInfo.id || item._id.toString().substring(0, 8),
          nome: item.produtoInfo.nome || "Produto não encontrado",
          tipo: item.produtoInfo.tipo || "",
          categoria: item.produtoInfo.categoria || "",
          vendas: item.vendas,
          quantidade: item.quantidade,
          percentual: totalValorTop > 0
            ? parseFloat(((valor / totalValorTop) * 100).toFixed(2))
            : 0,
        };
      });

    const totalValorTodos = metodoCalculo === "transacoes"
      ? resultado.todosProdutos.reduce((sum, p) => sum + (p.vendas || 0), 0)
      : resultado.todosProdutos.reduce((sum, p) => sum + (p.quantidade || 0), 0);

    const todosProdutosVendidos = resultado.todosProdutos
      .filter((p) => p.produtoInfo)
      .map((item) => {
        return {
          id: item.produtoInfo.id || item._id.toString().substring(0, 8),
          nome: item.produtoInfo.nome || "Produto não encontrado",
          tipo: item.produtoInfo.tipo || "",
          categoria: item.produtoInfo.categoria || "",
          quantidade: item.quantidade,
          transacoes: item.vendas,
        };
      });

    // Configurar resposta HTTP
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=relatorio-estoque-${new Date().toISOString().split("T")[0]}.pdf`
    );
    res.setHeader("Content-Type", "application/pdf");

    // Inicializar PDF
    const doc = new PDFDocument({
      margin: 50,
      size: "A4",
      autoFirstPage: false,
      info: {
        Title: "Relatório de Estoque e Vendas - Estoque Fácil",
        Author: req.usuario?.nome || "Sistema Estoque Fácil",
        Subject: "Relatório de Estoque e Vendas",
        Keywords: "estoque, vendas, relatório",
        Creator: "Estoque Fácil V2",
      },
    });

    doc.pipe(res);

    doc.on("error", (err) => {
      console.error("Erro no stream do PDF:", err);
      if (!res.headersSent) {
        res.status(500).json({
          sucesso: false,
          mensagem: "Erro ao gerar PDF",
          erro: err.message,
        });
      }
    });

    // Função auxiliar para desenhar cabeçalho
    const drawHeader = () => {
      doc
        .fontSize(8)
        .font("Helvetica")
        .text("Estoque Fácil - Sistema de Gestão de Estoque", 50, 20)
        .text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 400, 20, {
          align: "right",
        });
      doc.moveTo(50, 35).lineTo(550, 35).stroke();
    };

    // Função para truncar texto (evitar IDs truncados)
    const truncateText = (text, maxLength) => {
      if (!text) return "";
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength - 3) + "...";
    };

    // ===== PÁGINA DE CAPA =====
    doc.addPage();

    doc.fontSize(24).font("Helvetica-Bold").text("ESTOQUE FÁCIL", {
      align: "center",
    });

    doc.moveDown(0.5).fontSize(20).text("Relatório de Estoque e Vendas", {
      align: "center",
    });

    doc
      .moveDown(2)
      .fontSize(12)
      .font("Helvetica")
      .text(
        `Período: ${new Date(dataInicio).toLocaleDateString("pt-BR")} a ${new Date(dataFim).toLocaleDateString("pt-BR")}`,
        { align: "center" }
      );

    if (tipo) doc.text(`Tipo: ${tipo}`, { align: "center" });
    if (categoria) doc.text(`Categoria: ${categoria}`, { align: "center" });
    if (subcategoria) doc.text(`Subcategoria: ${subcategoria}`, { align: "center" });
    if (local) doc.text(`Local: ${local}`, { align: "center" });

    doc.text(
      `Método de cálculo: ${metodoCalculo === "transacoes" ? "Número de vendas" : "Quantidade vendida"}`,
      { align: "center" }
    );

    doc
      .moveDown(6)
      .fontSize(10)
      .text(`Gerado por: ${req.usuario?.nome || DEFAULT_USER_NAME}`, { align: "center" })
      .text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, { align: "center" });

    // ===== PÁGINA DE RESUMO =====
    doc.addPage();
    drawHeader();

    doc.fontSize(18).font("Helvetica-Bold").text("Resumo Geral", 0, 60, {
      width: doc.page.width,
      align: "center",
    });

    // Cards de métricas
    const drawMetricCard = (title, value, x, y, width, height, color) => {
      doc.roundedRect(x, y, width, height, 5).fillAndStroke(color, color);
      doc
        .fillColor("white")
        .fontSize(12)
        .font("Helvetica-Bold")
        .text(title, x + 10, y + 10, { width: width - 20, align: "center" });
      doc.fontSize(20).text(value, x + 10, y + 35, { width: width - 20, align: "center" });
      doc.fillColor("black");
    };

    const centerX = doc.page.width / 2;
    const cardWidth = 210;
    const cardHeight = 80;
    const gap = 20;

    drawMetricCard("Total de Produtos", totalProdutos, centerX - cardWidth - gap / 2, 100, cardWidth, cardHeight, "#3498db");
    drawMetricCard("Total de Vendas", stats.totalVendas, centerX + gap / 2, 100, cardWidth, cardHeight, "#2ecc71");
    drawMetricCard("Média de Vendas Diárias", mediaVendasDiarias.toFixed(2), centerX - cardWidth - gap / 2, 100 + cardHeight + gap, cardWidth, cardHeight, "#e74c3c");
    drawMetricCard("Total Itens Vendidos", stats.totalItensVendidos, centerX + gap / 2, 100 + cardHeight + gap, cardWidth, cardHeight, "#f39c12");

    // Tabela de Vendas por Categoria
    if (vendasPorCategoria.labels.length > 0) {
      doc.moveDown(5);
      doc.fontSize(14).font("Helvetica-Bold").text("Vendas por Categoria", { align: "center" });

      const tableWidth = 400;
      const tableX = (doc.page.width - tableWidth) / 2;
      let tableY = doc.y + 20;

      doc.rect(tableX, tableY, tableWidth, 25).fill("#4472C4");
      doc
        .fillColor("white")
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("Categoria", tableX + 20, tableY + 7)
        .text("Quantidade", tableX + tableWidth - 100, tableY + 7);

      tableY += 25;
      doc.fillColor("black");

      vendasPorCategoria.labels.forEach((cat, index) => {
        if (index % 2 === 0) {
          doc.rect(tableX, tableY, tableWidth, 25).fill("#F2F2F2");
        }
        doc
          .fillColor("black")
          .fontSize(10)
          .font("Helvetica")
          .text(truncateText(cat, 35), tableX + 20, tableY + 7)
          .text(vendasPorCategoria.dados[index].toString(), tableX + tableWidth - 100, tableY + 7);
        tableY += 25;
      });
    }

    // ===== TABELA ESTOQUE POR LOCAL =====
    doc.addPage();
    drawHeader();

    doc.fontSize(14).font("Helvetica-Bold").text("Estoque por Local", 0, 60, {
      width: doc.page.width,
      align: "center",
    });

    if (estoqueLocal.labels.length > 0) {
      const tableWidth = 400;
      const tableX = (doc.page.width - tableWidth) / 2;
      let tableY = 90;

      const total = estoqueLocal.dados.reduce((sum, val) => sum + val, 0);

      doc.rect(tableX, tableY, tableWidth, 25).fill("#4472C4");
      doc
        .fillColor("white")
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("Local", tableX + 20, tableY + 7)
        .text("Quantidade", tableX + tableWidth - 180, tableY + 7)
        .text("Percentual", tableX + tableWidth - 80, tableY + 7);

      tableY += 25;
      doc.fillColor("black");

      estoqueLocal.labels.forEach((localItem, index) => {
        if (index % 2 === 0) {
          doc.rect(tableX, tableY, tableWidth, 25).fill("#F2F2F2");
        }
        const percentual = ((estoqueLocal.dados[index] / total) * 100).toFixed(1) + "%";
        doc
          .fillColor("black")
          .fontSize(10)
          .font("Helvetica")
          .text(truncateText(localItem, 25), tableX + 20, tableY + 7)
          .text(estoqueLocal.dados[index].toString(), tableX + tableWidth - 180, tableY + 7)
          .text(percentual, tableX + tableWidth - 80, tableY + 7);
        tableY += 25;
      });
    }

    // ===== PÁGINA TOP PRODUTOS =====
    doc.addPage();
    drawHeader();

    const tituloTopProdutos = metodoCalculo === "transacoes"
      ? "Top Produtos por Número de Vendas"
      : "Top Produtos por Quantidade Vendida";

    doc.fontSize(18).font("Helvetica-Bold").text(tituloTopProdutos, 0, 60, {
      width: doc.page.width,
      align: "center",
    });

    doc
      .fontSize(10)
      .font("Helvetica-Oblique")
      .text(
        metodoCalculo === "transacoes"
          ? "Classificação baseada no número de transações."
          : "Classificação baseada na quantidade total vendida.",
        { align: "center" }
      );

    if (topProdutos.length > 0) {
      doc.moveDown(1);
      const tableTop = doc.y;
      const tableWidth = 500;

      // Larguras de colunas fixas para evitar truncamento de IDs
      const colWidths = { id: 70, nome: 145, tipo: 60, categoria: 70, valor: 60, percentual: 50 };
      const xPos = {
        id: 55,
        nome: 55 + colWidths.id + 5,
        tipo: 55 + colWidths.id + colWidths.nome + 10,
        categoria: 55 + colWidths.id + colWidths.nome + colWidths.tipo + 15,
        valor: 55 + colWidths.id + colWidths.nome + colWidths.tipo + colWidths.categoria + 20,
        percentual: 55 + colWidths.id + colWidths.nome + colWidths.tipo + colWidths.categoria + colWidths.valor + 25,
      };

      doc.rect(50, tableTop, tableWidth, 25).fill("#4472C4");
      doc.fillColor("white").fontSize(10).font("Helvetica-Bold");

      doc.text("ID", xPos.id, tableTop + 8, { width: colWidths.id });
      doc.text("Produto", xPos.nome, tableTop + 8, { width: colWidths.nome });
      doc.text("Tipo", xPos.tipo, tableTop + 8, { width: colWidths.tipo });
      doc.text("Categoria", xPos.categoria, tableTop + 8, { width: colWidths.categoria });
      doc.text(metodoCalculo === "transacoes" ? "Vendas" : "Qtd", xPos.valor, tableTop + 8, { width: colWidths.valor, align: "center" });
      doc.text("%", xPos.percentual, tableTop + 8, { width: colWidths.percentual, align: "center" });

      doc.fillColor("black");
      let tableY = tableTop + 25;

      doc.fontSize(9).font("Helvetica");

      topProdutos.slice(0, 15).forEach((produto, index) => {
        const rowHeight = 25;
        if (index % 2 === 0) {
          doc.rect(50, tableY, tableWidth, rowHeight).fill("#F8F9FA");
        }

        const valorQtd = metodoCalculo === "transacoes" ? produto.vendas : produto.quantidade;

        doc.fillColor("black");
        doc.text(produto.id, xPos.id, tableY + 8, { width: colWidths.id });
        doc.text(truncateText(produto.nome, 30), xPos.nome, tableY + 8, { width: colWidths.nome });
        doc.text(truncateText(produto.tipo, 12), xPos.tipo, tableY + 8, { width: colWidths.tipo });
        doc.text(truncateText(produto.categoria, 14), xPos.categoria, tableY + 8, { width: colWidths.categoria });
        doc.text(valorQtd.toString(), xPos.valor, tableY + 8, { width: colWidths.valor, align: "center" });
        doc.text(produto.percentual.toString() + "%", xPos.percentual, tableY + 8, { width: colWidths.percentual, align: "center" });

        tableY += rowHeight;
      });

      if (topProdutos.length > 15) {
        doc.moveDown();
        doc.fontSize(9).font("Helvetica-Oblique").text(`* Exibindo 15 de ${topProdutos.length} produtos.`);
      }
    } else {
      doc.fontSize(12).font("Helvetica").text("Nenhuma venda registrada no período selecionado.", { align: "center" });
    }

    // ===== PÁGINA TODOS OS PRODUTOS VENDIDOS =====
    if (todosProdutosVendidos.length > 0) {
      doc.addPage();
      drawHeader();

      doc.fontSize(18).font("Helvetica-Bold").text("Todos os Produtos Vendidos no Período", 0, 60, {
        width: doc.page.width,
        align: "center",
      });

      doc.moveDown(1);
      const tableTop = doc.y;
      const tableWidth = 500;

      // Larguras de colunas ajustadas para evitar truncamento
      const colWidths = { id: 70, nome: 145, tipo: 60, categoria: 80, quantidade: 55, transacoes: 55 };
      const xPos = {
        id: 55,
        nome: 55 + colWidths.id + 5,
        tipo: 55 + colWidths.id + colWidths.nome + 10,
        categoria: 55 + colWidths.id + colWidths.nome + colWidths.tipo + 15,
        quantidade: 55 + colWidths.id + colWidths.nome + colWidths.tipo + colWidths.categoria + 20,
        transacoes: 55 + colWidths.id + colWidths.nome + colWidths.tipo + colWidths.categoria + colWidths.quantidade + 25,
      };

      const headerHeight = 30;

      doc.rect(50, tableTop, tableWidth, headerHeight).fill("#4472C4");
      doc.fillColor("white").fontSize(10).font("Helvetica-Bold");

      doc.text("ID", xPos.id, tableTop + headerHeight / 2 - 5, { width: colWidths.id });
      doc.text("Produto", xPos.nome, tableTop + headerHeight / 2 - 5, { width: colWidths.nome });
      doc.text("Tipo", xPos.tipo, tableTop + headerHeight / 2 - 5, { width: colWidths.tipo });
      doc.text("Categoria", xPos.categoria, tableTop + headerHeight / 2 - 5, { width: colWidths.categoria });
      doc.text("Qtd", xPos.quantidade, tableTop + 5, { width: colWidths.quantidade, align: "center" });
      doc.text("Vendas", xPos.transacoes, tableTop + 5, { width: colWidths.transacoes, align: "center" });

      doc.fillColor("black");
      let tableY = tableTop + headerHeight;

      const itemsPerPage = 18;
      const totalPages = Math.ceil(todosProdutosVendidos.length / itemsPerPage);

      for (let pagina = 0; pagina < totalPages; pagina++) {
        if (pagina > 0) {
          doc.addPage();
          drawHeader();

          doc.fontSize(18).font("Helvetica-Bold").text("Todos os Produtos Vendidos (continuação)", 0, 60, {
            width: doc.page.width,
            align: "center",
          });

          const tableTopCont = doc.y + 15;
          doc.rect(50, tableTopCont, tableWidth, headerHeight).fill("#4472C4");
          doc.fillColor("white").fontSize(10).font("Helvetica-Bold");

          doc.text("ID", xPos.id, tableTopCont + headerHeight / 2 - 5, { width: colWidths.id });
          doc.text("Produto", xPos.nome, tableTopCont + headerHeight / 2 - 5, { width: colWidths.nome });
          doc.text("Tipo", xPos.tipo, tableTopCont + headerHeight / 2 - 5, { width: colWidths.tipo });
          doc.text("Categoria", xPos.categoria, tableTopCont + headerHeight / 2 - 5, { width: colWidths.categoria });
          doc.text("Qtd", xPos.quantidade, tableTopCont + 5, { width: colWidths.quantidade, align: "center" });
          doc.text("Vendas", xPos.transacoes, tableTopCont + 5, { width: colWidths.transacoes, align: "center" });

          doc.fillColor("black");
          tableY = tableTopCont + headerHeight;
        }

        const startIndex = pagina * itemsPerPage;
        const endIndex = Math.min((pagina + 1) * itemsPerPage, todosProdutosVendidos.length);

        todosProdutosVendidos.slice(startIndex, endIndex).forEach((produto, index) => {
          const rowHeight = 25;
          if (index % 2 === 0) {
            doc.rect(50, tableY, tableWidth, rowHeight).fill("#F8F9FA");
          }

          doc.fillColor("black").fontSize(9).font("Helvetica");
          doc.text(produto.id, xPos.id, tableY + 8, { width: colWidths.id });
          doc.text(truncateText(produto.nome, 30), xPos.nome, tableY + 8, { width: colWidths.nome });
          doc.text(truncateText(produto.tipo, 12), xPos.tipo, tableY + 8, { width: colWidths.tipo });
          doc.text(truncateText(produto.categoria, 16), xPos.categoria, tableY + 8, { width: colWidths.categoria });
          doc.text(produto.quantidade.toString(), xPos.quantidade, tableY + 8, { width: colWidths.quantidade, align: "center" });
          doc.text(produto.transacoes.toString(), xPos.transacoes, tableY + 8, { width: colWidths.transacoes, align: "center" });

          tableY += rowHeight;
        });

        // Totais na última página
        if (pagina === totalPages - 1) {
          const totalQuantidade = todosProdutosVendidos.reduce((sum, p) => sum + p.quantidade, 0);
          const totalTransacoes = todosProdutosVendidos.reduce((sum, p) => sum + p.transacoes, 0);

          tableY += 5;
          doc.rect(50, tableY, tableWidth, 30).fill("#E8EAF6");

          doc
            .fillColor("#1A237E")
            .fontSize(10)
            .font("Helvetica-Bold")
            .text("TOTAL", xPos.nome, tableY + 10, { width: colWidths.nome });

          doc.text(totalQuantidade.toString(), xPos.quantidade, tableY + 10, { width: colWidths.quantidade, align: "center" });
          doc.text(totalTransacoes.toString(), xPos.transacoes, tableY + 10, { width: colWidths.transacoes, align: "center" });

          doc.fillColor("black");
        }
      }
    }

    // Finalizar documento
    doc.end();
  } catch (error) {
    console.error("Erro ao gerar PDF V2:", error);
    if (!res.headersSent) {
      res.status(500).json({
        sucesso: false,
        mensagem: "Erro ao gerar PDF",
        erro: error.message,
      });
    }
  }
};
