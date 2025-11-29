const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const Produto = require("../models/Produto");
const Venda = require("../models/Venda");
const Movimentacao = require("../models/Movimentacao");
const Estoque = require("../models/Estoque");

/**
 * Obtém todos os produtos vendidos no período especificado
 * @param {Object} filtro - Filtro para as vendas
 * @param {Date} dataInicio - Data de início do período
 * @param {Date} dataFim - Data de fim do período
 */
async function obterTodosProdutosVendidos(filtro, dataInicio, dataFim) {
  try {
    // Agregação para obter todos os produtos vendidos com suas quantidades
    const vendasPorProduto = await Venda.aggregate([
      { $match: filtro },
      {
        $group: {
          _id: "$produto",
          quantidadeTotal: { $sum: "$quantidade" },
          transacoes: { $sum: 1 },
          valorTotal: { $sum: "$valorTotal" },
          ultimaVenda: { $max: "$dataVenda" },
        },
      },
      { $sort: { quantidadeTotal: -1 } }, // Ordenar por quantidade vendida (decrescente)
    ]);

    if (vendasPorProduto.length === 0) {
      return [];
    }

    // Obter IDs dos produtos
    const produtosIds = vendasPorProduto.map((venda) => venda._id);

    // Buscar informações completas dos produtos
    const produtosInfo = await Produto.find({ _id: { $in: produtosIds } });

    // Mapear produtos por ID para acesso rápido
    const produtosMap = {};
    produtosInfo.forEach((produto) => {
      produtosMap[produto._id.toString()] = produto;
    });

    // Mapear resultados finais (apenas produtos que existem)
    const todosProdutos = vendasPorProduto
      .filter((venda) => produtosMap[venda._id.toString()])
      .map((venda) => {
        const produtoInfo = produtosMap[venda._id.toString()];

        return {
          id: produtoInfo.id || produtoInfo._id.toString().substring(0, 8),
          nome: produtoInfo.nome,
          tipo: produtoInfo.tipo || "",
          categoria: produtoInfo.categoria || "",
          subcategoria: produtoInfo.subcategoria || "",
          quantidade: venda.quantidadeTotal,
          transacoes: venda.transacoes,
          valorTotal: venda.valorTotal || 0,
          ultimaVenda: venda.ultimaVenda,
        };
      });

    return todosProdutos;
  } catch (error) {
    console.error("Erro ao obter produtos vendidos:", error);
    throw error;
  }
}

// Gerar PDF com relatório completo
exports.gerarPDF = async (req, res) => {
  try {
    // Parâmetros do relatório
    const {
      dataInicio,
      dataFim,
      tipo,
      categoria,
      subcategoria,
      local,
      metodoCalculo = "transacoes",
    } = req.query;

    // Obter dados do resumo para o PDF
    const dataInicioObj = new Date(dataInicio);
    const dataFimObj = new Date(dataFim);
    dataFimObj.setHours(23, 59, 59, 999);

    // Construir filtros
    const filtroVendas = {
      dataVenda: {
        $gte: dataInicioObj,
        $lte: dataFimObj,
      },
    };

    const filtroProdutos = {};
    const filtroEstoque = {};

    if (tipo) filtroProdutos.tipo = tipo;
    if (categoria) filtroProdutos.categoria = categoria;
    if (subcategoria) filtroProdutos.subcategoria = subcategoria;

    // Aplicar filtros de produto à consulta de vendas
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
    }

    // Calcular dados para o PDF
    const totalProdutos = await Produto.countDocuments(filtroProdutos);
    const totalVendas = await Venda.countDocuments(filtroVendas);
    const estatisticas = await calcularEstatisticas(
      filtroVendas,
      dataInicioObj,
      dataFimObj,
      metodoCalculo
    );

    // Determinar método de cálculo para os top produtos
    const topProdutos =
      metodoCalculo === "transacoes"
        ? await obterTopProdutosPorTransacoes(
            filtroVendas,
            dataInicioObj,
            dataFimObj
          )
        : await obterTopProdutos(filtroVendas, dataInicioObj, dataFimObj);

    const produtosSemMovimentacao = await obterProdutosSemMovimentacao(
      dataInicioObj,
      dataFimObj,
      filtroProdutos,
      local
    );
    const vendasPorCategoria = await calcularVendasPorCategoria(
      filtroVendas,
      dataInicioObj,
      dataFimObj
    );
    const estoquePorLocal = await calcularEstoquePorLocal(filtroEstoque);

    // Obter todos os produtos vendidos no período
    const todosProdutosVendidos = await obterTodosProdutosVendidos(
      filtroVendas,
      dataInicioObj,
      dataFimObj
    );

    // Inicializar PDF com opções melhoradas
    const doc = new PDFDocument({
      margin: 50,
      size: "A4",
      autoFirstPage: false, // Impede página em branco inicial
      info: {
        Title: "Relatório de Estoque e Vendas - Estoque Fácil",
        Author: req.usuario?.nome || "Sistema Estoque Fácil",
        Subject: "Relatório de Estoque e Vendas",
        Keywords: "estoque, vendas, relatório",
        Creator: "Estoque Fácil",
      },
    });

    // Coletar todos os dados em um buffer
    const chunks = [];
    doc.on("data", (chunk) => {
      chunks.push(chunk);
    });

    // Quando terminar, enviar para o cliente
    doc.on("end", () => {
      const result = Buffer.concat(chunks);
      res.contentType("application/pdf");
      res.send(result);
    });

    // Configurar resposta HTTP
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=relatorio-estoque-${
        new Date().toISOString().split("T")[0]
      }.pdf`
    );
    res.setHeader("Content-Type", "application/pdf");

    // Função auxiliar para desenhar cabeçalho de páginas internas
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

    // Função global para truncar texto
    const truncateText = (text, maxLength) => {
      if (!text) return "";
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength - 3) + "...";
    };

    // ===== PÁGINA DE CAPA =====
    doc.addPage();

    // Logo ou título da empresa centralizado
    doc.fontSize(24).font("Helvetica-Bold").text("ESTOQUE FÁCIL", {
      align: "center",
    });

    // Subtítulo
    doc.moveDown(0.5).fontSize(20).text("Relatório de Estoque e Vendas", {
      align: "center",
    });

    // Informações do relatório
    doc
      .moveDown(2)
      .fontSize(12)
      .font("Helvetica")
      .text(
        `Período: ${new Date(dataInicio).toLocaleDateString(
          "pt-BR"
        )} a ${new Date(dataFim).toLocaleDateString("pt-BR")}`,
        {
          align: "center",
        }
      );

    // Adicionar filtros aplicados
    if (tipo) doc.text(`Tipo: ${tipo}`, { align: "center" });
    if (categoria) doc.text(`Categoria: ${categoria}`, { align: "center" });
    if (subcategoria)
      doc.text(`Subcategoria: ${subcategoria}`, { align: "center" });
    if (local) doc.text(`Local: ${local}`, { align: "center" });

    // Adicionar informação do método de cálculo
    doc.text(
      `Método de cálculo: ${
        metodoCalculo === "transacoes"
          ? "Número de vendas"
          : "Quantidade vendida"
      }`,
      {
        align: "center",
      }
    );

    // Data e usuário na parte inferior
    doc
      .moveDown(6)
      .fontSize(10)
      .text(`Gerado por: ${req.usuario?.nome || "Usuário"}`, {
        align: "center",
      })
      .text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, {
        align: "center",
      });

    // ===== PÁGINA DE RESUMO =====
    doc.addPage();
    drawHeader();

    // Título perfeitamente centralizado
    doc.fontSize(18).font("Helvetica-Bold").text("Resumo Geral", 0, 60, {
      width: doc.page.width,
      align: "center",
    });

    // Função para desenhar card de métrica
    const drawMetricCard = (title, value, x, y, width, height, color) => {
      // Fundo com borda arredondada
      doc.roundedRect(x, y, width, height, 5).fillAndStroke(color, color);

      // Título em branco
      doc
        .fillColor("white")
        .fontSize(12)
        .font("Helvetica-Bold")
        .text(title, x + 10, y + 10, {
          width: width - 20,
          align: "center",
        });

      // Valor em branco
      doc.fontSize(20).text(value, x + 10, y + 35, {
        width: width - 20,
        align: "center",
      });

      // Resetar cor
      doc.fillColor("black");
    };

    // Layout em grid de 2x2 para métricas principais
    const centerX = doc.page.width / 2;
    const cardWidth = 210;
    const cardHeight = 80;
    const gap = 20;

    // Linha 1: Total de Produtos e Total de Vendas
    drawMetricCard(
      "Total de Produtos",
      totalProdutos,
      centerX - cardWidth - gap / 2,
      100,
      cardWidth,
      cardHeight,
      "#3498db"
    );
    drawMetricCard(
      "Total de Vendas",
      totalVendas,
      centerX + gap / 2,
      100,
      cardWidth,
      cardHeight,
      "#2ecc71"
    );

    // Linha 2: Média de Vendas e Produtos Sem Movimentação
    drawMetricCard(
      "Média de Vendas Diárias",
      estatisticas.mediaVendasDiarias.toFixed(2),
      centerX - cardWidth - gap / 2,
      100 + cardHeight + gap,
      cardWidth,
      cardHeight,
      "#e74c3c"
    );
    drawMetricCard(
      "Produtos Sem Movimentação",
      produtosSemMovimentacao.length,
      centerX + gap / 2,
      100 + cardHeight + gap,
      cardWidth,
      cardHeight,
      "#f39c12"
    );

    // Tabela de Vendas por Categoria
    if (vendasPorCategoria.labels.length > 0) {
      doc.moveDown(5);
      doc.fontSize(14).font("Helvetica-Bold").text("Vendas por Categoria", {
        align: "center",
      });

      // Tabela simples e direta
      const tableWidth = 400;
      const tableX = (doc.page.width - tableWidth) / 2;
      let tableY = doc.y + 20;

      // Cabeçalho da tabela
      doc.rect(tableX, tableY, tableWidth, 25).fill("#4472C4");

      doc
        .fillColor("white")
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("Categoria", tableX + 20, tableY + 7)
        .text("Quantidade", tableX + tableWidth - 100, tableY + 7);

      tableY += 25;
      doc.fillColor("black");

      // Corpo da tabela
      vendasPorCategoria.labels.forEach((categoria, index) => {
        // Linha alternada
        if (index % 2 === 0) {
          doc.rect(tableX, tableY, tableWidth, 25).fill("#F2F2F2");
        }

        doc
          .fillColor("black")
          .fontSize(10)
          .font("Helvetica")
          .text(categoria, tableX + 20, tableY + 7)
          .text(
            vendasPorCategoria.dados[index].toString(),
            tableX + tableWidth - 100,
            tableY + 7
          );

        tableY += 25;
      });
    }

    // ===== TABELA ESTOQUE POR LOCAL (NOVA PÁGINA) =====
    doc.addPage();
    drawHeader();

    doc.fontSize(14).font("Helvetica-Bold").text("Estoque por Local", 0, 60, {
      width: doc.page.width,
      align: "center",
    });

    if (estoquePorLocal.labels.length > 0) {
      // Layout compacto de tabela
      const tableWidth = 400;
      const tableX = (doc.page.width - tableWidth) / 2;
      let tableY = 90;

      // Calcular total para percentuais
      const total = estoquePorLocal.dados.reduce((sum, val) => sum + val, 0);

      // Cabeçalho da tabela
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

      // Corpo da tabela
      estoquePorLocal.labels.forEach((local, index) => {
        // Linhas alternadas
        if (index % 2 === 0) {
          doc.rect(tableX, tableY, tableWidth, 25).fill("#F2F2F2");
        }

        // Calcular percentual
        const percentual =
          ((estoquePorLocal.dados[index] / total) * 100).toFixed(1) + "%";

        doc
          .fillColor("black")
          .fontSize(10)
          .font("Helvetica")
          .text(local, tableX + 20, tableY + 7)
          .text(
            estoquePorLocal.dados[index].toString(),
            tableX + tableWidth - 180,
            tableY + 7
          )
          .text(percentual, tableX + tableWidth - 80, tableY + 7);

        tableY += 25;
      });
    }

    // ===== PÁGINA TOP PRODUTOS =====
    doc.addPage();
    drawHeader();

    // Título baseado no método de cálculo
    const tituloTopProdutos =
      metodoCalculo === "transacoes"
        ? "Top Produtos por Número de Vendas"
        : "Top Produtos por Quantidade Vendida";

    doc.fontSize(18).font("Helvetica-Bold").text(tituloTopProdutos, 0, 60, {
      width: doc.page.width,
      align: "center",
    });

    // Adicionar explicação sobre o método
    doc
      .fontSize(10)
      .font("Helvetica-Oblique")
      .text(
        metodoCalculo === "transacoes"
          ? "Classificação baseada no número de transações, independente da quantidade vendida em cada uma."
          : "Classificação baseada na quantidade total de itens vendidos.",
        { align: "center" }
      );

    if (topProdutos.length > 0) {
      // Tabela melhorada com linhas coloridas
      doc.moveDown(1);
      const tableTop = doc.y;
      const tableWidth = 500;

      // Definição de larguras de colunas ajustadas
      const colWidths = {
        id: 50,
        nome: 165, // Reduzido ligeiramente
        tipo: 70,
        categoria: 80,
        valor: 60, // Aumentado para acomodar "Nº Vendas" sem sobreposição
        percentual: 40,
      };

      // Posições X para cada coluna
      const xPos = {
        id: 55,
        nome: 55 + colWidths.id + 5,
        tipo: 55 + colWidths.id + colWidths.nome + 10,
        categoria: 55 + colWidths.id + colWidths.nome + colWidths.tipo + 15,
        valor:
          55 +
          colWidths.id +
          colWidths.nome +
          colWidths.tipo +
          colWidths.categoria +
          20,
        percentual:
          55 +
          colWidths.id +
          colWidths.nome +
          colWidths.tipo +
          colWidths.categoria +
          colWidths.valor +
          30, // Adicionado mais espaço
      };

      // Cabeçalho com fundo azul
      doc.rect(50, tableTop, tableWidth, 25).fill("#4472C4");
      doc.fillColor("white").fontSize(11).font("Helvetica-Bold");

      // Textos do cabeçalho
      doc.text("ID", xPos.id, tableTop + 8);
      doc.text("Produto", xPos.nome, tableTop + 8);
      doc.text("Tipo", xPos.tipo, tableTop + 8);
      doc.text("Categoria", xPos.categoria, tableTop + 8);

      // Coluna de quantidade com nome baseado no método
      if (metodoCalculo === "transacoes") {
        doc.text("Nº Vendas", xPos.valor, tableTop + 8, {
          width: colWidths.valor,
          align: "center",
        });
      } else {
        doc.text("Qtd", xPos.valor, tableTop + 8, {
          width: colWidths.valor,
          align: "center",
        });
      }

      doc.text("%", xPos.percentual, tableTop + 8, {
        width: colWidths.percentual,
        align: "center",
      });

      // Restaurar cor
      doc.fillColor("black");
      let tableY = tableTop + 25;

      // Dados da tabela com linhas alternadas
      doc.fontSize(9).font("Helvetica");

      topProdutos.slice(0, 15).forEach((produto, index) => {
        // Altura da linha fixa
        const rowHeight = 25;

        // Cor de fundo alternada
        if (index % 2 === 0) {
          doc.rect(50, tableY, tableWidth, rowHeight).fill("#F8F9FA");
        }

        // Usar o campo apropriado baseado no método
        const valorQtd =
          metodoCalculo === "transacoes"
            ? produto.transacoes || produto.quantidadeVendas
            : produto.quantidade;

        // Textos da linha com cor preta explícita
        doc.fillColor("black");

        // ID
        doc.text(produto.id, xPos.id, tableY + 8);

        // Nome do produto truncado
        doc.text(truncateText(produto.nome, 40), xPos.nome, tableY + 8);

        // Tipo
        doc.text(produto.tipo, xPos.tipo, tableY + 8);

        // Categoria
        doc.text(
          truncateText(produto.categoria, 15),
          xPos.categoria,
          tableY + 8
        );

        // Quantidade
        doc.text(valorQtd.toString(), xPos.valor, tableY + 8, {
          width: colWidths.valor,
          align: "center",
        });

        // Percentual
        doc.text(
          produto.percentual.toString() + "%",
          xPos.percentual,
          tableY + 8,
          { width: colWidths.percentual, align: "center" }
        );

        tableY += rowHeight;
      });

      // Informações adicionais
      if (topProdutos.length > 15) {
        doc.moveDown();
        doc
          .fontSize(9)
          .font("Helvetica-Oblique")
          .text(`* Exibindo 15 de ${topProdutos.length} produtos.`);
      }
    } else {
      doc
        .fontSize(12)
        .font("Helvetica")
        .text("Nenhuma venda registrada no período selecionado.", {
          align: "center",
        });
    }

    // ===== PÁGINA PRODUTOS SEM MOVIMENTAÇÃO =====
    if (produtosSemMovimentacao.length > 0) {
      doc.addPage();
      drawHeader();

      doc
        .fontSize(18)
        .font("Helvetica-Bold")
        .text("Produtos sem Movimentação", 0, 60, {
          width: doc.page.width,
          align: "center",
        });

      // Tabela com cores alternadas
      doc.moveDown(1);
      const tableTop = doc.y;
      const tableWidth = 500;

      // Definição de larguras de colunas
      const colWidths = {
        id: 50,
        nome: 175,
        local: 100,
        quantidade: 50,
        ultimaMovimentacao: 90,
      };

      // Posições X para cada coluna
      const xPos = {
        id: 55,
        nome: 55 + colWidths.id + 5,
        local: 55 + colWidths.id + colWidths.nome + 10,
        quantidade: 55 + colWidths.id + colWidths.nome + colWidths.local + 15,
        ultimaMovimentacao:
          55 +
          colWidths.id +
          colWidths.nome +
          colWidths.local +
          colWidths.quantidade +
          20,
      };

      // Altura do cabeçalho
      const headerHeight = 30;

      // Cabeçalho com fundo colorido
      doc.rect(50, tableTop, tableWidth, headerHeight).fill("#4472C4");
      doc.fillColor("white").fontSize(11).font("Helvetica-Bold");

      // Textos do cabeçalho
      doc.text("ID", xPos.id, tableTop + headerHeight / 2 - 5);
      doc.text("Produto", xPos.nome, tableTop + headerHeight / 2 - 5);
      doc.text("Local", xPos.local, tableTop + headerHeight / 2 - 5);
      doc.text("Estoque", xPos.quantidade, tableTop + headerHeight / 2 - 5);

      // Ajuste de "Última Movimentação" para garantir que caiba
      doc.text("Última\nMovimentação", xPos.ultimaMovimentacao, tableTop + 5, {
        width: colWidths.ultimaMovimentacao,
        align: "left",
        lineGap: 2,
      });

      // Restaurar cor
      doc.fillColor("black");
      let tableY = tableTop + headerHeight;

      // Limitar o número de itens por página
      const itemsPerPage = 20;
      const startIndex = 0;
      const endIndex = Math.min(itemsPerPage, produtosSemMovimentacao.length);

      // Dados da tabela com linhas alternadas
      produtosSemMovimentacao
        .slice(startIndex, endIndex)
        .forEach((produto, index) => {
          // Altura fixa da linha
          const rowHeight = 25;

          // Cor de fundo alternada
          if (index % 2 === 0) {
            doc.rect(50, tableY, tableWidth, rowHeight).fill("#F8F9FA");
          }

          const ultimaMovimentacao = produto.ultimaMovimentacao
            ? new Date(produto.ultimaMovimentacao).toLocaleDateString("pt-BR")
            : "Nunca";

          // Textos da linha
          doc.fillColor("black").fontSize(9).font("Helvetica");

          doc.text(produto.id, xPos.id, tableY + 8);
          doc.text(truncateText(produto.nome, 40), xPos.nome, tableY + 8);
          doc.text(produto.local, xPos.local, tableY + 8);
          doc.text(produto.quantidade.toString(), xPos.quantidade, tableY + 8);
          doc.text(ultimaMovimentacao, xPos.ultimaMovimentacao, tableY + 8);

          tableY += rowHeight;
        });

      // Se houver mais itens, adicionar indicação
      if (produtosSemMovimentacao.length > itemsPerPage) {
        doc.moveDown();
        doc
          .fontSize(9)
          .font("Helvetica-Oblique")
          .text(
            `* Exibindo ${endIndex} de ${produtosSemMovimentacao.length} produtos sem movimentação.`
          );
      }

      // Se houver muitos produtos sem movimentação, adicionar páginas adicionais
      if (produtosSemMovimentacao.length > itemsPerPage) {
        // Calcular número de páginas adicionais necessárias
        const remainingItems = produtosSemMovimentacao.length - itemsPerPage;
        const additionalPages = Math.ceil(remainingItems / itemsPerPage);

        for (let page = 0; page < additionalPages; page++) {
          doc.addPage();
          drawHeader();

          doc
            .fontSize(18)
            .font("Helvetica-Bold")
            .text("Produtos sem Movimentação (continuação)", 0, 60, {
              width: doc.page.width,
              align: "center",
            });

          // Cabeçalho da tabela
          const tableTop = doc.y + 15;

          doc.rect(50, tableTop, tableWidth, headerHeight).fill("#4472C4");
          doc.fillColor("white").fontSize(11).font("Helvetica-Bold");

          doc.text("ID", xPos.id, tableTop + headerHeight / 2 - 5);
          doc.text("Produto", xPos.nome, tableTop + headerHeight / 2 - 5);
          doc.text("Local", xPos.local, tableTop + headerHeight / 2 - 5);
          doc.text("Estoque", xPos.quantidade, tableTop + headerHeight / 2 - 5);

          // Ajuste de "Última Movimentação" para garantir que caiba
          doc.text(
            "Última\nMovimentação",
            xPos.ultimaMovimentacao,
            tableTop + 5,
            {
              width: colWidths.ultimaMovimentacao,
              align: "left",
              lineGap: 2,
            }
          );

          // Restaurar cor
          doc.fillColor("black");
          let tableY = tableTop + headerHeight;

          // Índices para esta página
          const pageStartIndex = itemsPerPage + page * itemsPerPage;
          const pageEndIndex = Math.min(
            pageStartIndex + itemsPerPage,
            produtosSemMovimentacao.length
          );

          // Dados da tabela
          produtosSemMovimentacao
            .slice(pageStartIndex, pageEndIndex)
            .forEach((produto, index) => {
              // Altura fixa da linha
              const rowHeight = 25;

              // Cor de fundo alternada
              if (index % 2 === 0) {
                doc.rect(50, tableY, tableWidth, rowHeight).fill("#F8F9FA");
              }

              const ultimaMovimentacao = produto.ultimaMovimentacao
                ? new Date(produto.ultimaMovimentacao).toLocaleDateString(
                    "pt-BR"
                  )
                : "Nunca";

              // Textos da linha
              doc.fillColor("black").fontSize(9).font("Helvetica");

              doc.text(produto.id, xPos.id, tableY + 8);
              doc.text(truncateText(produto.nome, 40), xPos.nome, tableY + 8);
              doc.text(produto.local, xPos.local, tableY + 8);
              doc.text(
                produto.quantidade.toString(),
                xPos.quantidade,
                tableY + 8
              );
              doc.text(ultimaMovimentacao, xPos.ultimaMovimentacao, tableY + 8);

              tableY += rowHeight;
            });
        }
      }
    }

    // ===== PÁGINA TODOS OS PRODUTOS VENDIDOS =====
    if (todosProdutosVendidos.length > 0) {
      doc.addPage();
      drawHeader();

      doc
        .fontSize(18)
        .font("Helvetica-Bold")
        .text("Todos os Produtos Vendidos no Período", 0, 60, {
          width: doc.page.width,
          align: "center",
        });

      // Tabela com cores alternadas
      doc.moveDown(1);
      const tableTop = doc.y;
      const tableWidth = 500;

      // Definição de larguras de colunas - AJUSTADO: removida coluna valorTotal e redistribuído espaço
      const colWidths = {
        id: 45,
        nome: 160, // Aumentado para usar parte do espaço liberado
        tipo: 65, // Ligeiramente aumentado
        categoria: 90, // Aumentado para usar parte do espaço liberado
        quantidade: 60,
        transacoes: 60,
      };

      // Posições X para cada coluna - MODIFICADO: removido valorTotal e recalculado
      const xPos = {
        id: 55,
        nome: 55 + colWidths.id + 5,
        tipo: 55 + colWidths.id + colWidths.nome + 10,
        categoria: 55 + colWidths.id + colWidths.nome + colWidths.tipo + 15,
        quantidade:
          55 +
          colWidths.id +
          colWidths.nome +
          colWidths.tipo +
          colWidths.categoria +
          20,
        transacoes:
          55 +
          colWidths.id +
          colWidths.nome +
          colWidths.tipo +
          colWidths.categoria +
          colWidths.quantidade +
          25,
      };

      // Altura do cabeçalho
      const headerHeight = 30;

      // Cabeçalho com fundo colorido
      doc.rect(50, tableTop, tableWidth, headerHeight).fill("#4472C4");
      doc.fillColor("white").fontSize(11).font("Helvetica-Bold");

      // Textos do cabeçalho - MODIFICADO: removido o cabeçalho de Valor Total
      doc.text("ID", xPos.id, tableTop + headerHeight / 2 - 5, {
        width: colWidths.id,
        align: "left",
      });
      doc.text("Produto", xPos.nome, tableTop + headerHeight / 2 - 5, {
        width: colWidths.nome,
        align: "left",
      });
      doc.text("Tipo", xPos.tipo, tableTop + headerHeight / 2 - 5, {
        width: colWidths.tipo,
        align: "left",
      });
      doc.text("Categoria", xPos.categoria, tableTop + headerHeight / 2 - 5, {
        width: colWidths.categoria,
        align: "left",
      });
      doc.text("Qtd\nVendida", xPos.quantidade, tableTop + 5, {
        width: colWidths.quantidade,
        align: "center",
        lineGap: 2,
      });
      doc.text("Nº\nVendas", xPos.transacoes, tableTop + 5, {
        width: colWidths.transacoes,
        align: "center",
        lineGap: 2,
      });

      // Restaurar cor
      doc.fillColor("black");
      let tableY = tableTop + headerHeight;

      // Limitar o número de itens por página
      const itemsPerPage = 18;
      const totalPages = Math.ceil(todosProdutosVendidos.length / itemsPerPage);

      // Loop para criar tabelas em múltiplas páginas conforme necessário
      for (let pagina = 0; pagina < totalPages; pagina++) {
        if (pagina > 0) {
          // Nova página para produtos adicionais
          doc.addPage();
          drawHeader();

          doc
            .fontSize(18)
            .font("Helvetica-Bold")
            .text(
              "Todos os Produtos Vendidos no Período (continuação)",
              0,
              60,
              {
                width: doc.page.width,
                align: "center",
              }
            );

          // Redesenhar cabeçalho da tabela
          const tableTop = doc.y + 15;

          doc.rect(50, tableTop, tableWidth, headerHeight).fill("#4472C4");
          doc.fillColor("white").fontSize(11).font("Helvetica-Bold");

          // Textos do cabeçalho - MODIFICADO: removido o cabeçalho de Valor Total
          doc.text("ID", xPos.id, tableTop + headerHeight / 2 - 5, {
            width: colWidths.id,
            align: "left",
          });
          doc.text("Produto", xPos.nome, tableTop + headerHeight / 2 - 5, {
            width: colWidths.nome,
            align: "left",
          });
          doc.text("Tipo", xPos.tipo, tableTop + headerHeight / 2 - 5, {
            width: colWidths.tipo,
            align: "left",
          });
          doc.text(
            "Categoria",
            xPos.categoria,
            tableTop + headerHeight / 2 - 5,
            { width: colWidths.categoria, align: "left" }
          );
          doc.text("Qtd\nVendida", xPos.quantidade, tableTop + 5, {
            width: colWidths.quantidade,
            align: "center",
            lineGap: 2,
          });
          doc.text("Nº\nVendas", xPos.transacoes, tableTop + 5, {
            width: colWidths.transacoes,
            align: "center",
            lineGap: 2,
          });

          // Restaurar cor
          doc.fillColor("black");
          tableY = tableTop + headerHeight;
        }

        // Índices para esta página
        const startIndex = pagina * itemsPerPage;
        const endIndex = Math.min(
          (pagina + 1) * itemsPerPage,
          todosProdutosVendidos.length
        );

        // Mostrar produtos desta página
        todosProdutosVendidos
          .slice(startIndex, endIndex)
          .forEach((produto, index) => {
            // Altura fixa da linha
            const rowHeight = 25;

            // Cor de fundo alternada
            if (index % 2 === 0) {
              doc.rect(50, tableY, tableWidth, rowHeight).fill("#F8F9FA");
            }

            // Textos da linha - MODIFICADO: removido o valor total
            doc.fillColor("black").fontSize(9).font("Helvetica");

            doc.text(produto.id, xPos.id, tableY + 8, {
              width: colWidths.id,
              align: "left",
            });
            doc.text(truncateText(produto.nome, 40), xPos.nome, tableY + 8, {
              width: colWidths.nome,
              align: "left",
            });
            doc.text(truncateText(produto.tipo, 15), xPos.tipo, tableY + 8, {
              width: colWidths.tipo,
              align: "left",
            });
            doc.text(
              truncateText(produto.categoria, 20),
              xPos.categoria,
              tableY + 8,
              { width: colWidths.categoria, align: "left" }
            );
            doc.text(
              produto.quantidade.toString(),
              xPos.quantidade,
              tableY + 8,
              { width: colWidths.quantidade, align: "center" }
            );
            doc.text(
              produto.transacoes.toString(),
              xPos.transacoes,
              tableY + 8,
              { width: colWidths.transacoes, align: "center" }
            );

            tableY += rowHeight;
          });

        // Adicionar total da página
        if (pagina === totalPages - 1) {
          // Calcular totais gerais - MODIFICADO: removido totalValor
          const totalQuantidade = todosProdutosVendidos.reduce(
            (sum, p) => sum + p.quantidade,
            0
          );
          const totalTransacoes = todosProdutosVendidos.reduce(
            (sum, p) => sum + p.transacoes,
            0
          );

          // Linha de totais
          tableY += 5;
          doc.rect(50, tableY, tableWidth, 30).fill("#E8EAF6");

          doc
            .fillColor("#1A237E")
            .fontSize(10)
            .font("Helvetica-Bold")
            .text("TOTAL", xPos.nome, tableY + 10, {
              width: colWidths.nome,
              align: "left",
            });

          doc.text(totalQuantidade.toString(), xPos.quantidade, tableY + 10, {
            width: colWidths.quantidade,
            align: "center",
          });
          doc.text(totalTransacoes.toString(), xPos.transacoes, tableY + 10, {
            width: colWidths.transacoes,
            align: "center",
          });

          // Restaurar cor
          doc.fillColor("black");
        }
      }
    }

    // Finalizar o documento
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

// Manter funções auxiliares existentes...

// Adicione estas funções auxiliares no seu arquivo relatorioController.js

/**
 * Calcula estatísticas gerais de vendas para um período
 * @param {Object} filtro - Filtro para as vendas
 * @param {Date} dataInicio - Data de início do período
 * @param {Date} dataFim - Data de fim do período
 * @param {String} metodoCalculo - Método de cálculo: "transacoes" ou "quantidade"
 */
async function calcularEstatisticas(
  filtro,
  dataInicio,
  dataFim,
  metodoCalculo = "quantidade"
) {
  // Default return values for empty/error cases
  const defaultResult = {
    totalItensVendidos: 0,
    totalTransacoes: 0,
    mediaVendasDiarias: 0,
    diaMaiorVenda: null,
    numeroDias: 1,
  };

  try {
    // Validate dates first to prevent crashes on short/invalid periods
    const dataInicioUTC = new Date(dataInicio);
    const dataFimUTC = new Date(dataFim);

    if (isNaN(dataInicioUTC.getTime()) || isNaN(dataFimUTC.getTime())) {
      console.warn("Datas inválidas fornecidas para cálculo de estatísticas");
      return defaultResult;
    }

    // Ensure dataInicio <= dataFim
    if (dataInicioUTC > dataFimUTC) {
      console.warn("Data de início maior que data de fim");
      return defaultResult;
    }

    // Calculate number of days first (used throughout)
    const diferencaEmMilissegundos = dataFimUTC - dataInicioUTC;
    const diferencaEmDias = diferencaEmMilissegundos / (1000 * 60 * 60 * 24);
    const numeroDias = Math.max(1, Math.ceil(diferencaEmDias) || 1);

    // Use MongoDB Aggregation Pipeline for combined calculations (more efficient)
    const resultadoAgregado = await Venda.aggregate([
      { $match: filtro || {} },
      {
        $facet: {
          totais: [
            {
              $group: {
                _id: null,
                totalQuantidade: { $sum: "$quantidade" },
                totalTransacoes: { $sum: 1 },
              },
            },
          ],
          vendasPorDia: [
            {
              $addFields: {
                dataString: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$dataVenda",
                    timezone: "UTC",
                  },
                },
              },
            },
            {
              $group: {
                _id: "$dataString",
                totalQuantidade: { $sum: "$quantidade" },
                totalTransacoes: { $sum: 1 },
              },
            },
            // Sort by transactions or quantity based on the calculation method
            metodoCalculo === "transacoes"
              ? { $sort: { totalTransacoes: -1 } }
              : { $sort: { totalQuantidade: -1 } },
            { $limit: 1 },
          ],
        },
      },
    ]);

    // Handle empty results gracefully
    if (!resultadoAgregado || resultadoAgregado.length === 0) {
      return { ...defaultResult, numeroDias };
    }

    const { totais, vendasPorDia } = resultadoAgregado[0];

    // Extract totals safely
    const totalItensVendidos =
      totais && totais.length > 0 ? (totais[0].totalQuantidade || 0) : 0;
    const totalTransacoes =
      totais && totais.length > 0 ? (totais[0].totalTransacoes || 0) : 0;

    // Calculate daily average safely
    const mediaVendasDiarias =
      metodoCalculo === "transacoes"
        ? totalTransacoes / numeroDias
        : totalItensVendidos / numeroDias;

    // Get day with most sales
    let diaMaiorVenda = null;
    if (vendasPorDia && vendasPorDia.length > 0 && vendasPorDia[0]._id) {
      const dataStr = vendasPorDia[0]._id;
      const dataInStr = dataInicioUTC.toISOString().split("T")[0];
      const dataFimStr = dataFimUTC.toISOString().split("T")[0];

      // Only include if within the filtered period
      if (dataStr >= dataInStr && dataStr <= dataFimStr) {
        diaMaiorVenda = dataStr;
      }
    }

    return {
      totalItensVendidos,
      totalTransacoes,
      mediaVendasDiarias: isNaN(mediaVendasDiarias) ? 0 : mediaVendasDiarias,
      diaMaiorVenda,
      numeroDias,
    };
  } catch (error) {
    console.error("Erro ao calcular estatísticas:", error);
    // Return safe defaults instead of throwing
    return defaultResult;
  }
}

/**
 * Obtém os produtos mais vendidos com base na quantidade vendida
 */
async function obterTopProdutos(filtroVendas, dataInicio, dataFim) {
  try {
    // Agregação para somar vendas por produto
    const vendasPorProduto = await Venda.aggregate([
      { $match: filtroVendas },
      {
        $group: {
          _id: "$produto",
          quantidade: { $sum: "$quantidade" },
        },
      },
      { $sort: { quantidade: -1 } },
    ]);

    if (vendasPorProduto.length === 0) {
      return [];
    }

    // Obter IDs dos produtos
    const produtosIds = vendasPorProduto.map((venda) => venda._id);

    // Buscar informações completas dos produtos que ainda existem
    const produtosInfo = await Produto.find({ _id: { $in: produtosIds } });

    // Mapear produtos por ID para acesso rápido
    const produtosMap = {};
    produtosInfo.forEach((produto) => {
      produtosMap[produto._id.toString()] = produto;
    });

    // Filtrar vendas para incluir apenas produtos que ainda existem
    const vendasFiltradas = vendasPorProduto.filter(
      (venda) => produtosMap[venda._id.toString()]
    );

    // Recalcular o total após a filtragem
    const totalVendidoGeral = vendasFiltradas.reduce(
      (sum, item) => sum + item.quantidade,
      0
    );

    if (totalVendidoGeral === 0) {
      return []; // Retorna lista vazia se não houver produtos válidos
    }

    // Mapear resultados finais (apenas produtos que existem)
    const topProdutos = vendasFiltradas
      .slice(0, 20) // Limitar a 20 produtos
      .map((venda) => {
        const produtoInfo = produtosMap[venda._id.toString()];

        return {
          id: produtoInfo.id,
          nome: produtoInfo.nome,
          tipo: produtoInfo.tipo,
          categoria: produtoInfo.categoria,
          subcategoria: produtoInfo.subcategoria || "",
          quantidade: venda.quantidade,
          percentual: parseFloat(
            ((venda.quantidade / totalVendidoGeral) * 100).toFixed(2)
          ),
        };
      });

    return topProdutos;
  } catch (error) {
    console.error("Erro ao obter top produtos:", error);
    throw error;
  }
}

/**
 * Obtém produtos sem movimentação no período especificado
 */
async function obterProdutosSemMovimentacao(
  dataInicio,
  dataFim,
  filtroProdutos,
  local
) {
  try {
    // Encontrar todos os produtos que correspondem aos filtros
    const todosProdutos = await Produto.find(filtroProdutos);

    if (todosProdutos.length === 0) {
      return [];
    }

    // Obter IDs de todos os produtos
    const todosProdutosIds = todosProdutos.map((p) => p._id);

    // Filtros para movimentações no período
    const filtroMovimentacoes = {
      data: { $gte: dataInicio, $lte: dataFim },
      produto: { $in: todosProdutosIds },
    };

    if (local) {
      filtroMovimentacoes.$or = [
        { localOrigem: local },
        { localDestino: local },
      ];
    }

    // Encontrar produtos com movimentação no período
    const movimentacoes = await Movimentacao.find(filtroMovimentacoes).select(
      "produto"
    );
    const produtosComMovimentacao = [
      ...new Set(movimentacoes.map((m) => m.produto.toString())),
    ];

    // Encontrar produtos com vendas no período
    const filtroVendas = {
      dataVenda: { $gte: dataInicio, $lte: dataFim },
      produto: { $in: todosProdutosIds },
    };

    if (local) {
      filtroVendas.local = local;
    }

    const vendas = await Venda.find(filtroVendas).select("produto");
    const produtosComVendas = [
      ...new Set(vendas.map((v) => v.produto.toString())),
    ];

    // Combinar produtos com movimentação ou vendas
    const produtosComAtividade = [
      ...new Set([...produtosComMovimentacao, ...produtosComVendas]),
    ];

    // Produtos que não tiveram atividade no período
    const produtosSemAtividade = todosProdutos.filter(
      (produto) => !produtosComAtividade.includes(produto._id.toString())
    );

    // Obter informações de estoque
    const produtosSemMovimentacao = [];

    for (const produto of produtosSemAtividade) {
      // Filtrar estoque por local se necessário
      const filtroEstoque = { produto: produto._id };
      if (local) {
        filtroEstoque.local = local;
      }

      // Obter a última movimentação (antes do período)
      const ultimaMovimentacao = await Movimentacao.findOne({
        produto: produto._id,
        data: { $lt: dataInicio },
      }).sort({ data: -1 });

      // Obter estoque atual
      const estoques = await Estoque.find(filtroEstoque);

      // Adicionar cada combinação de produto+local
      for (const estoque of estoques) {
        produtosSemMovimentacao.push({
          id: produto.id,
          nome: produto.nome,
          tipo: produto.tipo,
          categoria: produto.categoria,
          subcategoria: produto.subcategoria,
          local: estoque.local,
          quantidade: estoque.quantidade,
          ultimaMovimentacao: ultimaMovimentacao?.data,
        });
      }
    }

    return produtosSemMovimentacao;
  } catch (error) {
    console.error("Erro ao obter produtos sem movimentação:", error);
    throw error;
  }
}

/**
 * Calcula vendas agrupadas por categoria
 */
async function calcularVendasPorCategoria(filtroVendas, dataInicio, dataFim) {
  try {
    // Obter vendas com o filtro especificado
    const vendas = await Venda.find(filtroVendas).select("produto quantidade");

    // Extrair os IDs dos produtos para uma consulta em massa
    const produtosIds = [...new Set(vendas.map((venda) => venda.produto))];

    // Buscar informações de todos os produtos vendidos
    const produtosInfo = await Produto.find({ _id: { $in: produtosIds } });

    // Criar um mapa para lookup rápido
    const produtosMap = {};
    produtosInfo.forEach((produto) => {
      produtosMap[produto._id.toString()] = produto;
    });

    // Agrupar vendas por categoria, ignorando produtos excluídos
    const categorias = {};

    vendas.forEach((venda) => {
      // Verificar se o produto ainda existe no sistema
      const produtoExiste = produtosMap[venda.produto.toString()];

      // Se o produto não existir mais, ignorar esta venda
      if (!produtoExiste) {
        return; // Pula esta iteração
      }

      const categoria = produtoExiste.categoria;

      if (!categorias[categoria]) {
        categorias[categoria] = 0;
      }

      categorias[categoria] += venda.quantidade;
    });

    // Converter para arrays para uso em gráficos
    const labels = Object.keys(categorias);
    const dados = labels.map((label) => categorias[label]);

    return { labels, dados };
  } catch (error) {
    console.error("Erro ao calcular vendas por categoria:", error);
    throw error;
  }
}

/**
 * Calcula distribuição de estoque por local
 */
async function calcularEstoquePorLocal(filtroEstoque) {
  try {
    // Agregar estoque por local
    const estoquePorLocal = await Estoque.aggregate([
      { $match: filtroEstoque },
      {
        $group: {
          _id: "$local",
          total: { $sum: "$quantidade" },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // Converter para arrays para uso em gráficos
    const labels = estoquePorLocal.map((item) => item._id);
    const dados = estoquePorLocal.map((item) => item.total);

    return { labels, dados };
  } catch (error) {
    console.error("Erro ao calcular estoque por local:", error);
    throw error;
  }
}

/**
 * Calcula estoque de produtos sem movimentação por local
 */
async function calcularEstoqueSemMovimentacao(produtosSemMovimentacao) {
  try {
    // Agrupar por local
    const locais = {};

    produtosSemMovimentacao.forEach((produto) => {
      const local = produto.local || "Sem local";

      if (!locais[local]) {
        locais[local] = 0;
      }

      locais[local] += produto.quantidade;
    });

    // Converter para arrays para uso em gráficos
    const labels = Object.keys(locais);
    const dados = labels.map((label) => locais[label]);

    return { labels, dados };
  } catch (error) {
    console.error("Erro ao calcular estoque sem movimentação:", error);
    throw error;
  }
}

/**
 * Obtém produtos com estoque considerado crítico
 */
async function obterProdutosEstoqueCritico(filtroEstoque) {
  try {
    // Definir limiar de estoque crítico (pode ser personalizado)
    const LIMIAR_CRITICO = 5;

    // Encontrar produtos com estoque abaixo do limiar
    const estoqueBaixo = await Estoque.find({
      ...filtroEstoque,
      quantidade: { $lte: LIMIAR_CRITICO, $gt: 0 },
    }).populate("produto");

    return estoqueBaixo.map((estoque) => ({
      id: estoque.produto?.id || "N/A",
      nome: estoque.produto?.nome || "Produto não disponível",
      local: estoque.local,
      quantidade: estoque.quantidade,
    }));
  } catch (error) {
    console.error("Erro ao obter produtos com estoque crítico:", error);
    throw error;
  }
}

// Implementação da função obterTopProdutosPorTransacoes
async function obterTopProdutosPorTransacoes(
  filtroVendas,
  dataInicio,
  dataFim
) {
  try {
    // Agregação para contar vendas por produto (número de transações)
    const vendasPorProduto = await Venda.aggregate([
      { $match: filtroVendas },
      {
        $group: {
          _id: "$produto",
          transacoes: { $sum: 1 },
        },
      },
      { $sort: { transacoes: -1 } },
    ]);

    if (vendasPorProduto.length === 0) {
      return [];
    }

    // Obter IDs dos produtos
    const produtosIds = vendasPorProduto.map((venda) => venda._id);

    // Buscar informações completas dos produtos que ainda existem
    const produtosInfo = await Produto.find({ _id: { $in: produtosIds } });

    // Mapear produtos por ID para acesso rápido
    const produtosMap = {};
    produtosInfo.forEach((produto) => {
      produtosMap[produto._id.toString()] = produto;
    });

    // Filtrar vendas para incluir apenas produtos que ainda existem
    const vendasFiltradas = vendasPorProduto.filter(
      (venda) => produtosMap[venda._id.toString()]
    );

    // Recalcular o total após a filtragem
    const totalTransacoesGeral = vendasFiltradas.reduce(
      (sum, item) => sum + item.transacoes,
      0
    );

    if (totalTransacoesGeral === 0) {
      return []; // Retorna lista vazia se não houver produtos válidos
    }

    // Mapear resultados finais (apenas produtos que existem)
    const topProdutos = vendasFiltradas
      .slice(0, 20) // Limitar a 20 produtos
      .map((venda) => {
        const produtoInfo = produtosMap[venda._id.toString()];

        return {
          id: produtoInfo.id,
          nome: produtoInfo.nome,
          tipo: produtoInfo.tipo,
          categoria: produtoInfo.categoria,
          subcategoria: produtoInfo.subcategoria || "",
          transacoes: venda.transacoes,
          percentual: parseFloat(
            ((venda.transacoes / totalTransacoesGeral) * 100).toFixed(2)
          ),
        };
      });

    return topProdutos;
  } catch (error) {
    console.error("Erro ao obter top produtos por transações:", error);
    throw error;
  }
}

/**
 * Método para obter resumo do relatório
 */
exports.getResumo = async (req, res) => {
  try {
    // Parâmetros do relatório
    const {
      dataInicio,
      dataFim,
      tipo,
      categoria,
      subcategoria,
      local,
      metodoCalculo = "transacoes",
      useExactDates = false,
    } = req.query;

    // Validar parâmetros obrigatórios
    if (!dataInicio || !dataFim) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Datas de início e fim são obrigatórias",
      });
    }

    // Log para depuração
    console.log("Datas recebidas:", {
      dataInicio,
      dataFim,
      useExactDates,
    });

    // Converter datas com extremo cuidado
    let dataInicioObj, dataFimObj;

    if (useExactDates === "true") {
      // Usar as datas exatamente como foram enviadas, apenas ajustando para início e fim do dia
      dataInicioObj = new Date(`${dataInicio}T00:00:00.000Z`);
      dataFimObj = new Date(`${dataFim}T23:59:59.999Z`);
    } else {
      // Abordagem anterior
      dataInicioObj = new Date(dataInicio);
      dataInicioObj.setHours(0, 0, 0, 0);

      dataFimObj = new Date(dataFim);
      dataFimObj.setHours(23, 59, 59, 999);
    }

    // Verificar se as datas são válidas
    if (isNaN(dataInicioObj.getTime()) || isNaN(dataFimObj.getTime())) {
      console.error("Datas inválidas:", { dataInicio, dataFim });
      return res.status(400).json({
        sucesso: false,
        mensagem: "Datas inválidas",
      });
    }

    console.log(
      `DEBUG - Período após processamento: ${dataInicioObj.toISOString()} a ${dataFimObj.toISOString()}`
    );

    // Construir filtros com as datas ajustadas
    const filtroVendas = {
      dataVenda: {
        $gte: dataInicioObj,
        $lte: dataFimObj,
      },
    };

    const filtroProdutos = {};
    const filtroEstoque = {};
    const filtroMovimentacoes = {
      data: {
        $gte: dataInicioObj,
        $lte: dataFimObj,
      },
    };

    if (tipo) {
      filtroProdutos.tipo = tipo;
    }
    if (categoria) {
      filtroProdutos.categoria = categoria;
    }
    if (subcategoria) {
      filtroProdutos.subcategoria = subcategoria;
    }

    // Aplicar filtros de produto à consulta de vendas e movimentações
    if (Object.keys(filtroProdutos).length > 0) {
      const produtosFiltrados = await Produto.find(filtroProdutos).select(
        "_id"
      );
      const idsProdutos = produtosFiltrados.map((p) => p._id);

      filtroVendas.produto = { $in: idsProdutos };
      filtroEstoque.produto = { $in: idsProdutos };
      filtroMovimentacoes.produto = { $in: idsProdutos };
    }

    if (local) {
      filtroVendas.local = local;
      filtroEstoque.local = local;
      filtroMovimentacoes.$or = [
        { localOrigem: local },
        { localDestino: local },
      ];
    }

    // Calcular dados para o relatório com tratamento de erro individual
    let totalProdutos = 0;
    let totalVendas = 0;

    try {
      totalProdutos = await Produto.countDocuments(filtroProdutos);
    } catch (err) {
      console.error("Erro ao contar produtos:", err);
    }

    try {
      totalVendas = await Venda.countDocuments(filtroVendas);
    } catch (err) {
      console.error("Erro ao contar vendas:", err);
    }

    // Obter top produtos com base no método de cálculo escolhido
    let topProdutos = [];
    try {
      topProdutos =
        metodoCalculo === "transacoes"
          ? await obterTopProdutosPorTransacoes(
              filtroVendas,
              dataInicioObj,
              dataFimObj
            )
          : await obterTopProdutos(filtroVendas, dataInicioObj, dataFimObj);
    } catch (err) {
      console.error("Erro ao obter top produtos:", err);
      topProdutos = [];
    }

    let estatisticas = {
      totalItensVendidos: 0,
      totalTransacoes: 0,
      mediaVendasDiarias: 0,
      diaMaiorVenda: null,
      numeroDias: 1,
    };
    try {
      estatisticas = await calcularEstatisticas(
        filtroVendas,
        dataInicioObj,
        dataFimObj,
        metodoCalculo
      );
    } catch (err) {
      console.error("Erro ao calcular estatísticas:", err);
    }

    let vendasPorCategoria = { labels: [], dados: [] };
    try {
      vendasPorCategoria = await calcularVendasPorCategoria(
        filtroVendas,
        dataInicioObj,
        dataFimObj
      );
    } catch (err) {
      console.error("Erro ao calcular vendas por categoria:", err);
    }

    let produtosSemMovimentacao = [];
    try {
      produtosSemMovimentacao = await obterProdutosSemMovimentacao(
        dataInicioObj,
        dataFimObj,
        filtroProdutos,
        local
      );
    } catch (err) {
      console.error("Erro ao obter produtos sem movimentação:", err);
    }

    let produtosEstoqueCritico = [];
    try {
      produtosEstoqueCritico = await obterProdutosEstoqueCritico(filtroEstoque);
    } catch (err) {
      console.error("Erro ao obter produtos com estoque crítico:", err);
    }

    let estoquePorLocal = { labels: [], dados: [] };
    try {
      estoquePorLocal = await calcularEstoquePorLocal(filtroEstoque);
    } catch (err) {
      console.error("Erro ao calcular estoque por local:", err);
    }

    let estoqueSemMovimentacao = { labels: [], dados: [] };
    try {
      estoqueSemMovimentacao = await calcularEstoqueSemMovimentacao(
        produtosSemMovimentacao
      );
    } catch (err) {
      console.error("Erro ao calcular estoque sem movimentação:", err);
    }

    // Garantir valores seguros para evitar NaN
    const mediaVendasDiariasSegura = isNaN(estatisticas.mediaVendasDiarias)
      ? 0
      : estatisticas.mediaVendasDiarias;
    const totalItensVendidosSeguro = isNaN(estatisticas.totalItensVendidos)
      ? 0
      : estatisticas.totalItensVendidos;

    // Montar e retornar o resumo com estrutura consistente
    res.json({
      sucesso: true,
      totalProdutos: totalProdutos || 0,
      totalVendas: totalVendas || 0,
      totalItensVendidos: totalItensVendidosSeguro,
      mediaVendasDiarias: mediaVendasDiariasSegura,
      diaMaiorVenda: estatisticas.diaMaiorVenda || null,
      semMovimentacao: produtosSemMovimentacao.length || 0,
      produtosEstoqueCritico: produtosEstoqueCritico.length || 0,
      topProdutos: topProdutos || [],
      vendasPorCategoria: vendasPorCategoria || { labels: [], dados: [] },
      produtosSemMovimentacao: produtosSemMovimentacao || [],
      estoquePorLocal: estoquePorLocal || { labels: [], dados: [] },
      estoqueSemMovimentacao: estoqueSemMovimentacao || { labels: [], dados: [] },
    });
  } catch (error) {
    console.error("Erro ao gerar resumo:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao gerar resumo",
      erro: error.message,
    });
  }
};

/**
 * Obtém os produtos mais vendidos baseados na quantidade de transações/vendas
 * e não na quantidade total de itens vendidos
 */
exports.getTopProdutosPorVendas = async (req, res) => {
  try {
    // Parâmetros do relatório
    const { dataInicio, dataFim, tipo, categoria, subcategoria, local } =
      req.query;

    // Validar parâmetros de data
    if (!dataInicio || !dataFim) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Datas de início e fim são obrigatórias",
      });
    }

    // Criar filtros
    const dataInicioObj = new Date(dataInicio);
    const dataFimObj = new Date(dataFim);
    dataFimObj.setHours(23, 59, 59, 999);

    const filtroVendas = {
      dataVenda: {
        $gte: dataInicioObj,
        $lte: dataFimObj,
      },
    };

    // Aplicar filtros adicionais se fornecidos
    const filtroProdutos = {};
    if (tipo) filtroProdutos.tipo = tipo;
    if (categoria) filtroProdutos.categoria = categoria;
    if (subcategoria) filtroProdutos.subcategoria = subcategoria;

    // Aplicar filtros de produto à consulta de vendas
    if (Object.keys(filtroProdutos).length > 0) {
      const produtosFiltrados = await Produto.find(filtroProdutos).select(
        "_id"
      );
      const idsProdutos = produtosFiltrados.map((p) => p._id);
      filtroVendas.produto = { $in: idsProdutos };
    }

    if (local) {
      filtroVendas.local = local;
    }

    // Usar função compartilhada para obter top produtos por transações
    const topProdutos = await obterTopProdutosPorTransacoes(
      filtroVendas,
      dataInicioObj,
      dataFimObj
    );

    res.json({
      sucesso: true,
      topProdutos,
    });
  } catch (error) {
    console.error("Erro ao obter top produtos por vendas:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao obter top produtos",
      erro: error.message,
    });
  }
};
