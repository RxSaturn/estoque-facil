const PDFDocument = require("pdfkit");
const chartJsPdf = require("chartjs-node-canvas");
const fs = require("fs");
const path = require("path");
const os = require("os");
const Produto = require("../models/Produto");
const Venda = require("../models/Venda");
const Movimentacao = require("../models/Movimentacao");
const Estoque = require("../models/Estoque");

// Gerar PDF com relatório completo
exports.gerarPDF = async (req, res) => {
  try {
    // Temporários para armazenar gráficos
    const tempDir = os.tmpdir();
    const tempFiles = [];

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
    const estoqueSemMovimentacao = await calcularEstoqueSemMovimentacao(
      produtosSemMovimentacao
    );

    // Gerar gráficos para o PDF
    const chartWidth = 500;
    const chartHeight = 300;
    const canvasRenderService = new chartJsPdf.ChartJSNodeCanvas({
      width: chartWidth,
      height: chartHeight,
      backgroundColor: "white",
    });

    // Gráfico de Barras - Vendas por Categoria
    if (vendasPorCategoria.labels.length > 0) {
      const vendasPorCategoriaConfig = {
        type: "bar",
        data: {
          labels: vendasPorCategoria.labels,
          datasets: [
            {
              label: "Quantidade Vendida",
              data: vendasPorCategoria.dados,
              backgroundColor: "rgba(54, 162, 235, 0.6)",
              borderColor: "rgba(54, 162, 235, 1)",
              borderWidth: 1,
            },
          ],
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
            },
          },
          plugins: {
            title: {
              display: true,
              text: "Vendas por Categoria",
              font: {
                size: 16,
              },
            },
            legend: {
              display: false,
            },
          },
        },
      };

      const vendasPorCategoriaBuffer = await canvasRenderService.renderToBuffer(
        vendasPorCategoriaConfig
      );
      const vendasPorCategoriaFile = path.join(
        tempDir,
        `vendas-por-categoria-${Date.now()}.png`
      );
      fs.writeFileSync(vendasPorCategoriaFile, vendasPorCategoriaBuffer);
      tempFiles.push(vendasPorCategoriaFile);
    }

    // Gráfico de Pizza - Estoque por Local
    if (estoquePorLocal.labels.length > 0) {
      const estoquePorLocalConfig = {
        type: "pie",
        data: {
          labels: estoquePorLocal.labels,
          datasets: [
            {
              data: estoquePorLocal.dados,
              backgroundColor: [
                "rgba(54, 162, 235, 0.6)",
                "rgba(255, 99, 132, 0.6)",
                "rgba(255, 206, 86, 0.6)",
                "rgba(75, 192, 192, 0.6)",
                "rgba(153, 102, 255, 0.6)",
                "rgba(255, 159, 64, 0.6)",
              ],
              borderWidth: 1,
            },
          ],
        },
        options: {
          plugins: {
            title: {
              display: true,
              text: "Estoque por Local",
              font: {
                size: 16,
              },
            },
          },
        },
      };

      const estoquePorLocalBuffer = await canvasRenderService.renderToBuffer(
        estoquePorLocalConfig
      );
      const estoquePorLocalFile = path.join(
        tempDir,
        `estoque-por-local-${Date.now()}.png`
      );
      fs.writeFileSync(estoquePorLocalFile, estoquePorLocalBuffer);
      tempFiles.push(estoquePorLocalFile);
    }

    // Inicializar PDF com opções avançadas
    const doc = new PDFDocument({
      margin: 50,
      size: "A4",
      info: {
        Title: "Relatório de Estoque e Vendas - Estoque Fácil",
        Author: req.usuario?.nome || "Sistema Estoque Fácil",
        Subject: "Relatório de Estoque e Vendas",
        Keywords: "estoque, vendas, relatório",
        Creator: "Estoque Fácil",
      },
    });

    // Configurar resposta HTTP para download do PDF
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=relatorio-estoque-${
        new Date().toISOString().split("T")[0]
      }.pdf`
    );
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    // Função auxiliar para cabeçalho das páginas
    const addHeader = () => {
      doc
        .fontSize(8)
        .font("Helvetica")
        .text("Estoque Fácil - Sistema de Gestão de Estoque", 50, 20, {
          align: "left",
        })
        .text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 400, 20, {
          align: "right",
        });
      doc.moveTo(50, 35).lineTo(550, 35).stroke();
      doc.moveDown(2);
    };

    // Função auxiliar para rodapé das páginas
    const addFooter = (pageNum) => {
      const totalPages = "{{totalPages}}"; // Placeholder a ser substituído
      doc
        .fontSize(8)
        .text(`Página ${pageNum} de ${totalPages}`, 50, doc.page.height - 50, {
          align: "center",
          width: doc.page.width - 100,
        });
    };

    // Contador de páginas
    let pageNumber = 1;

    // ===== PÁGINA DE CAPA =====
    addHeader();

    // Logo ou título da empresa (substitua pelo caminho real do logo se disponível)
    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .text("ESTOQUE FÁCIL", { align: "center" });

    doc.moveDown();
    doc.fontSize(20).text("Relatório de Estoque e Vendas", { align: "center" });

    doc.moveDown(2);

    // Informações do relatório
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

    // Adicionar informação do método de cálculo
    doc.text(
      `Método de cálculo: ${
        metodoCalculo === "transacoes"
          ? "Número de vendas"
          : "Quantidade vendida"
      }`,
      { align: "center" }
    );

    doc.moveDown(4);

    // Data do relatório
    doc.fontSize(10).text(`Gerado por: ${req.usuario?.nome || "Usuário"}`, {
      align: "center",
    });
    doc.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, {
      align: "center",
    });

    // Adicionar rodapé
    addFooter(pageNumber);

    // ===== PÁGINA DE RESUMO =====
    doc.addPage();
    pageNumber++;
    addHeader();

    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .text("Resumo Geral", { align: "center" });
    doc.moveDown();

    // Criar um layout com 2 colunas para os indicadores
    const boxWidth = 240;
    const boxHeight = 80;
    const margin = 20;
    let yPos = doc.y;

    // Função para desenhar uma caixa de indicador
    const drawIndicatorBox = (title, value, x, y, color = "#2c3e50") => {
      doc.roundedRect(x, y, boxWidth, boxHeight, 5).fillAndStroke(color, color);

      doc
        .fillColor("white")
        .fontSize(10)
        .font("Helvetica")
        .text(title, x + 10, y + 10, { width: boxWidth - 20 });

      doc
        .fontSize(24)
        .font("Helvetica-Bold")
        .text(value, x + 10, y + 30, { width: boxWidth - 20, align: "center" });

      doc.fillColor("black"); // Resetar cor
    };

    // Primeira linha de indicadores
    drawIndicatorBox("Total de Produtos", totalProdutos, 50, yPos, "#3498db");
    drawIndicatorBox(
      "Total de Vendas",
      totalVendas,
      50 + boxWidth + margin,
      yPos,
      "#2ecc71"
    );

    yPos += boxHeight + margin;

    // Segunda linha de indicadores
    drawIndicatorBox(
      "Média de Vendas Diárias",
      estatisticas.mediaVendasDiarias.toFixed(2),
      50,
      yPos,
      "#e74c3c"
    );
    drawIndicatorBox(
      "Produtos Sem Movimentação",
      produtosSemMovimentacao.length,
      50 + boxWidth + margin,
      yPos,
      "#f39c12"
    );

    yPos += boxHeight + margin + 20;

    // Gráficos
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("Visualização de Dados", 50, yPos);
    doc.moveDown();

    // Verificar se os gráficos foram gerados
    if (tempFiles.length > 0 && fs.existsSync(tempFiles[0])) {
      doc.image(tempFiles[0], 50, doc.y, { width: 500 });
      doc.moveDown(2);
    }

    if (tempFiles.length > 1 && fs.existsSync(tempFiles[1])) {
      // Se não couber na página atual, adicionar nova página
      if (doc.y + 300 > doc.page.height - 100) {
        doc.addPage();
        pageNumber++;
        addHeader();
      }

      doc.image(tempFiles[1], 50, doc.y, { width: 500 });
    }

    // Adicionar rodapé
    addFooter(pageNumber);

    // ===== PÁGINA TOP PRODUTOS =====
    doc.addPage();
    pageNumber++;
    addHeader();

    // Título baseado no método de cálculo
    const tituloTopProdutos =
      metodoCalculo === "transacoes"
        ? "Top Produtos por Número de Vendas"
        : "Top Produtos por Quantidade Vendida";

    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .text(tituloTopProdutos, { align: "center" });

    // Adicionar explicação sobre o método
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(
        metodoCalculo === "transacoes"
          ? "Classificação baseada no número de transações, independente da quantidade vendida em cada uma."
          : "Classificação baseada na quantidade total de itens vendidos.",
        { align: "center", oblique: 0.3 }
      );

    doc.moveDown();

    if (topProdutos.length > 0) {
      // Cabeçalho da tabela com estilo melhorado
      const drawTableHeader = () => {
        doc.fontSize(10).font("Helvetica-Bold");

        // Retângulo de fundo para o cabeçalho
        doc.rect(50, doc.y, 500, 20).fill("#2c3e50");

        // Texto do cabeçalho em branco
        doc.fillColor("white");
        doc.text("ID", 55, doc.y - 15, { width: 60 });
        doc.text("Produto", 120, doc.y - 15, { width: 150 });
        doc.text("Tipo", 275, doc.y - 15, { width: 70 });
        doc.text("Categoria", 350, doc.y - 15, { width: 90 });

        // Coluna de quantidade com nome baseado no método
        if (metodoCalculo === "transacoes") {
          doc.text("Nº Vendas", 445, doc.y - 15, { width: 40 });
        } else {
          doc.text("Qtd", 445, doc.y - 15, { width: 40 });
        }

        doc.text("%", 490, doc.y - 15, { width: 40 });

        // Restaurar cor
        doc.fillColor("black");
        doc.moveDown(1.5);
      };

      drawTableHeader();

      // Dados da tabela com linhas alternadas
      doc.fontSize(10).font("Helvetica");

      topProdutos.slice(0, 15).forEach((produto, index) => {
        // Cor de fundo alternada
        if (index % 2 === 0) {
          doc.rect(50, doc.y - 5, 500, 20).fill("#f8f9fa");
          doc.fillColor("black");
        }

        doc.text(produto.id, 55, doc.y, { width: 60 });
        doc.text(produto.nome, 120, doc.y, { width: 150 });
        doc.text(produto.tipo, 275, doc.y, { width: 70 });
        doc.text(produto.categoria, 350, doc.y, { width: 90 });

        // Use o campo apropriado baseado no método
        const valorQtd =
          metodoCalculo === "transacoes"
            ? produto.transacoes || produto.quantidadeVendas
            : produto.quantidade;

        doc.text(valorQtd.toString(), 445, doc.y, { width: 40 });
        doc.text(produto.percentual.toString() + "%", 490, doc.y, {
          width: 40,
        });
        doc.moveDown();
      });

      // Informações adicionais
      if (topProdutos.length > 15) {
        doc.moveDown();
        doc
          .fontSize(9)
          .font("Helvetica")
          .text(`* Exibindo 15 de ${topProdutos.length} produtos.`, {
            oblique: 0.3,
          });
      }
    } else {
      doc
        .fontSize(12)
        .font("Helvetica")
        .text("Nenhuma venda registrada no período selecionado.", {
          align: "center",
          oblique: 0.3,
        });
    }

    // Adicionar rodapé
    addFooter(pageNumber);

    // ===== PÁGINA PRODUTOS SEM MOVIMENTAÇÃO =====
    if (produtosSemMovimentacao.length > 0) {
      doc.addPage();
      pageNumber++;
      addHeader();

      doc
        .fontSize(18)
        .font("Helvetica-Bold")
        .text("Produtos sem Movimentação", { align: "center" });
      doc.moveDown();

      // Cabeçalho da tabela
      doc.fontSize(10).font("Helvetica-Bold");
      doc.rect(50, doc.y, 500, 20).fill("#2c3e50");
      doc.fillColor("white");
      doc.text("ID", 55, doc.y - 15, { width: 60 });
      doc.text("Produto", 120, doc.y - 15, { width: 150 });
      doc.text("Local", 275, doc.y - 15, { width: 90 });
      doc.text("Estoque", 370, doc.y - 15, { width: 60 });
      doc.text("Última Movimentação", 435, doc.y - 15, { width: 100 });
      doc.fillColor("black");
      doc.moveDown(1.5);

      // Dados da tabela
      doc.fontSize(10).font("Helvetica");

      produtosSemMovimentacao.slice(0, 20).forEach((produto, index) => {
        // Cor de fundo alternada
        if (index % 2 === 0) {
          doc.rect(50, doc.y - 5, 500, 20).fill("#f8f9fa");
          doc.fillColor("black");
        }

        const ultimaMovimentacao = produto.ultimaMovimentacao
          ? new Date(produto.ultimaMovimentacao).toLocaleDateString("pt-BR")
          : "Nunca";

        doc.text(produto.id, 55, doc.y, { width: 60 });
        doc.text(produto.nome, 120, doc.y, { width: 150 });
        doc.text(produto.local, 275, doc.y, { width: 90 });
        doc.text(produto.quantidade.toString(), 370, doc.y, { width: 60 });
        doc.text(ultimaMovimentacao, 435, doc.y, { width: 100 });
        doc.moveDown();

        // Se estiver no final da página, adicionar nova
        if (
          doc.y > doc.page.height - 120 &&
          index < produtosSemMovimentacao.length - 1
        ) {
          addFooter(pageNumber);
          doc.addPage();
          pageNumber++;
          addHeader();

          // Redesenhar cabeçalho da tabela
          doc.fontSize(10).font("Helvetica-Bold");
          doc.rect(50, doc.y, 500, 20).fill("#2c3e50");
          doc.fillColor("white");
          doc.text("ID", 55, doc.y - 15, { width: 60 });
          doc.text("Produto", 120, doc.y - 15, { width: 150 });
          doc.text("Local", 275, doc.y - 15, { width: 90 });
          doc.text("Estoque", 370, doc.y - 15, { width: 60 });
          doc.text("Última Movimentação", 435, doc.y - 15, { width: 100 });
          doc.fillColor("black");
          doc.moveDown(1.5);
        }
      });

      // Informações adicionais
      if (produtosSemMovimentacao.length > 20) {
        doc.moveDown();
        doc
          .fontSize(9)
          .font("Helvetica")
          .text(
            `* Exibindo 20 de ${produtosSemMovimentacao.length} produtos sem movimentação.`,
            {
              oblique: 0.3,
            }
          );
      }
    }

    // Adicionar rodapé à última página
    addFooter(pageNumber);

    // Substitui os placeholders do número total de páginas
    const totalPages = pageNumber;

    // Finalizar o documento
    doc.end();

    // Limpar arquivos temporários
    setTimeout(() => {
      tempFiles.forEach((file) => {
        try {
          if (fs.existsSync(file)) {
            fs.unlinkSync(file);
          }
        } catch (err) {
          console.error(`Erro ao excluir arquivo temporário ${file}:`, err);
        }
      });
    }, 1000);
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao gerar PDF",
      erro: error.message,
    });
  }
};

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
  try {
    // Calcular total de itens vendidos (sempre útil independente do método)
    const resultadoQuantidade = await Venda.aggregate([
      { $match: filtro },
      { $group: { _id: null, total: { $sum: "$quantidade" } } },
    ]);

    const totalItensVendidos =
      resultadoQuantidade.length > 0 ? resultadoQuantidade[0].total : 0;

    // Calcular o número total de transações (vendas)
    const resultadoTransacoes = await Venda.aggregate([
      { $match: filtro },
      { $group: { _id: null, total: { $count: {} } } }, // Conta o número de documentos
    ]);

    const totalTransacoes =
      resultadoTransacoes.length > 0 ? resultadoTransacoes[0].total : 0;

    // Calcular a média diária com base no método de cálculo
    const dataInicioUTC = new Date(dataInicio);
    const dataFimUTC = new Date(dataFim);

    // Calcular diferença em milissegundos e converter para dias
    const diferencaEmMilissegundos = dataFimUTC - dataInicioUTC;
    const diferencaEmDias = diferencaEmMilissegundos / (1000 * 60 * 60 * 24);

    // Garantir que temos pelo menos 1 dia para evitar divisão por zero
    const numeroDias = Math.max(1, Math.ceil(diferencaEmDias));

    // Média baseada no método de cálculo
    const mediaVendasDiarias =
      metodoCalculo === "transacoes"
        ? totalTransacoes / numeroDias
        : totalItensVendidos / numeroDias;

    // Encontrar o dia com maior volume (baseado no método de cálculo)
    const agregarPor =
      metodoCalculo === "transacoes"
        ? { $count: {} } // Contagem de documentos
        : { $sum: "$quantidade" }; // Soma das quantidades

    const vendasPorDia = await Venda.aggregate([
      { $match: filtro },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$dataVenda" } },
          total: agregarPor,
        },
      },
      { $sort: { total: -1 } },
      { $limit: 1 },
    ]);

    const diaMaiorVenda = vendasPorDia.length > 0 ? vendasPorDia[0]._id : null;

    return {
      totalItensVendidos,
      totalTransacoes,
      mediaVendasDiarias,
      diaMaiorVenda,
      numeroDias,
    };
  } catch (error) {
    console.error("Erro ao calcular estatísticas:", error);
    throw error;
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
    } = req.query;

    // Validar parâmetros obrigatórios
    if (!dataInicio || !dataFim) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Datas de início e fim são obrigatórias",
      });
    }

    // Converter datas
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

    // Calcular dados para o relatório
    const totalProdutos = await Produto.countDocuments(filtroProdutos);
    const totalVendas = await Venda.countDocuments(filtroVendas);

    // Obter top produtos com base no método de cálculo escolhido
    const topProdutos =
      metodoCalculo === "transacoes"
        ? await obterTopProdutosPorTransacoes(
            filtroVendas,
            dataInicioObj,
            dataFimObj
          )
        : await obterTopProdutos(filtroVendas, dataInicioObj, dataFimObj);

    const estatisticas = await calcularEstatisticas(
      filtroVendas,
      dataInicioObj,
      dataFimObj,
      metodoCalculo
    );
    const vendasPorCategoria = await calcularVendasPorCategoria(
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
    const produtosEstoqueCritico = await obterProdutosEstoqueCritico(
      filtroEstoque
    );
    const estoquePorLocal = await calcularEstoquePorLocal(filtroEstoque);
    const estoqueSemMovimentacao = await calcularEstoqueSemMovimentacao(
      produtosSemMovimentacao
    );

    // Montar e retornar o resumo
    res.json({
      totalProdutos,
      totalVendas,
      totalItensVendidos: estatisticas.totalItensVendidos,
      mediaVendasDiarias: estatisticas.mediaVendasDiarias,
      diaMaiorVenda: estatisticas.diaMaiorVenda,
      semMovimentacao: produtosSemMovimentacao.length,
      produtosEstoqueCritico: produtosEstoqueCritico.length,
      topProdutos,
      vendasPorCategoria,
      produtosSemMovimentacao,
      estoquePorLocal,
      estoqueSemMovimentacao,
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
