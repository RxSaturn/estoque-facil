const Produto = require('../models/Produto');
const Estoque = require('../models/Estoque');
const Venda = require('../models/Venda');
const Movimentacao = require('../models/Movimentacao');
const PDFDocument = require('pdfkit');

// Gerar um resumo para relatório
exports.gerarResumo = async (req, res) => {
  try {
    const { dataInicio, dataFim, tipo, categoria, local } = req.query;
    
    // Validar parâmetros de data
    if (!dataInicio || !dataFim) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Período é obrigatório'
      });
    }
    
    // Construir filtros
    const filtroVendas = {
      dataVenda: {
        $gte: new Date(dataInicio),
        $lte: new Date(dataFim)
      }
    };
    
    const filtroProdutos = {};
    
    if (tipo) {
      filtroProdutos.tipo = tipo;
    }
    
    if (categoria) {
      filtroProdutos.categoria = categoria;
    }
    
    // Apenas incluir produtos que atendem aos filtros, se houver
    if (Object.keys(filtroProdutos).length > 0) {
      const produtosFiltrados = await Produto.find(filtroProdutos).select('_id');
      const idsProdutos = produtosFiltrados.map(p => p._id);
      
      filtroVendas.produto = { $in: idsProdutos };
    }
    
    if (local) {
      filtroVendas.local = local;
    }
    
    // Dados simulados para o frontend
    // Em uma implementação real, estes dados seriam calculados a partir do banco de dados
    const resumo = {
      totalProdutos: await Produto.countDocuments(filtroProdutos),
      totalVendas: await Venda.countDocuments(filtroVendas),
      semMovimentacao: 15, // Placeholder
      mediaVendasDiarias: 12.5, // Placeholder
      totalItensVendidos: 250, // Placeholder
      diaMaiorVenda: new Date(), // Placeholder
      produtosEstoqueCritico: 8, // Placeholder
      
      // Dados de gráfico - vendas por categoria
      vendasPorCategoria: {
        labels: ['Bebidas', 'Alimentos', 'Limpeza', 'Eletrônicos'],
        dados: [42, 28, 15, 5]
      },
      
      // Dados de gráfico - estoque por local
      estoquePorLocal: {
        labels: ['Loja Central', 'Depósito A', 'Depósito B', 'Filial 1', 'Filial 2'],
        dados: [120, 250, 180, 75, 45]
      },
      
      // Top produtos vendidos
      topProdutos: [
        { id: 'GBRC01', nome: 'Coca-Cola 2L', tipo: 'Garrafa', categoria: 'Bebidas', quantidade: 45, percentual: 18 },
        { id: 'LBRC01', nome: 'Coca-Cola 350ml', tipo: 'Lata', categoria: 'Bebidas', quantidade: 38, percentual: 15.2 },
        { id: 'UALP02', nome: 'Arroz Integral 1kg', tipo: 'Unidade', categoria: 'Alimentos', quantidade: 25, percentual: 10 },
        // Adicione mais produtos simulados aqui
      ],
      
      // Produtos sem movimentação
      produtosSemMovimentacao: [
        { id: 'ELVA12', nome: 'Webcam HD', tipo: 'Eletrônicos', categoria: 'Vídeo', local: 'Depósito B', quantidade: 5, ultimaMovimentacao: new Date('2024-12-15') },
        { id: 'CLVM05', nome: 'Detergente Premium', tipo: 'Limpeza', categoria: 'Casa', local: 'Filial 1', quantidade: 8, ultimaMovimentacao: null },
        // Adicione mais produtos simulados aqui
      ],
      
      // Distribuição de produtos sem movimentação por local
      estoqueSemMovimentacao: {
        labels: ['Loja Central', 'Depósito A', 'Depósito B', 'Filial 1', 'Filial 2'],
        dados: [2, 4, 8, 5, 1]
      }
    };
    
    res.status(200).json(resumo);
  } catch (error) {
    console.error('Erro ao gerar resumo do relatório:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao gerar resumo'
    });
  }
};

// Gerar PDF com relatório completo
exports.gerarPDF = async (req, res) => {
  try {
    // Parâmetros do relatório
    const { dataInicio, dataFim, tipo, categoria, local } = req.query;
    
    // Inicializar PDF
    const doc = new PDFDocument({
      margin: 50,
      size: 'A4'
    });
    
    // Configurar resposta HTTP para download do PDF
    res.setHeader('Content-Disposition', `attachment; filename=relatorio-estoque-${new Date().toISOString().split('T')[0]}.pdf`);
    res.setHeader('Content-Type', 'application/pdf');
    
    // Pipe o PDF diretamente para a resposta
    doc.pipe(res);
    
    // Título do relatório
    doc.fontSize(20).font('Helvetica-Bold').text('Relatório de Estoque e Vendas', { align: 'center' });
    doc.moveDown();
    
    // Informações do período
    doc.fontSize(12).font('Helvetica')
      .text(`Período: ${new Date(dataInicio).toLocaleDateString('pt-BR')} a ${new Date(dataFim).toLocaleDateString('pt-BR')}`, { align: 'center' });
    
    if (tipo) doc.text(`Tipo: ${tipo}`, { align: 'center' });
    if (categoria) doc.text(`Categoria: ${categoria}`, { align: 'center' });
    if (local) doc.text(`Local: ${local}`, { align: 'center' });
    
    doc.moveDown(2);
    
    // Resumo
    doc.fontSize(16).font('Helvetica-Bold').text('Resumo Geral', { underline: true });
    doc.moveDown();
    
    doc.fontSize(12).font('Helvetica').text(`Total de Produtos: 125`);
    doc.text(`Total de Vendas: 250`);
    doc.text(`Produtos sem Movimentação: 15`);
    doc.text(`Média de Vendas Diárias: 12.5`);
    
    doc.moveDown(2);
    
    // Top Produtos
    doc.fontSize(16).font('Helvetica-Bold').text('Top Produtos Vendidos', { underline: true });
    doc.moveDown();
    
    // Cabeçalho da tabela
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('ID', 50, doc.y, { width: 60 });
    doc.text('Produto', 110, doc.y, { width: 150 });
    doc.text('Tipo', 260, doc.y, { width: 70 });
    doc.text('Categoria', 330, doc.y, { width: 90 });
    doc.text('Qtd', 420, doc.y, { width: 40 });
    doc.text('%', 460, doc.y, { width: 40 });
    doc.moveDown();
    
    // Linha separadora
    doc.moveTo(50, doc.y).lineTo(500, doc.y).stroke();
    doc.moveDown(0.5);
    
    // Dados da tabela
    doc.fontSize(10).font('Helvetica');
    
    // Produtos simulados
    const produtos = [
      { id: 'GBRC01', nome: 'Coca-Cola 2L', tipo: 'Garrafa', categoria: 'Bebidas', quantidade: 45, percentual: 18 },
      { id: 'LBRC01', nome: 'Coca-Cola 350ml', tipo: 'Lata', categoria: 'Bebidas', quantidade: 38, percentual: 15.2 },
      { id: 'UALP02', nome: 'Arroz Integral 1kg', tipo: 'Unidade', categoria: 'Alimentos', quantidade: 25, percentual: 10 }
    ];
    
    // Adicionar linhas
    produtos.forEach(produto => {
      doc.text(produto.id, 50, doc.y, { width: 60 });
      doc.text(produto.nome, 110, doc.y, { width: 150 });
      doc.text(produto.tipo, 260, doc.y, { width: 70 });
      doc.text(produto.categoria, 330, doc.y, { width: 90 });
      doc.text(produto.quantidade.toString(), 420, doc.y, { width: 40 });
      doc.text(produto.percentual.toString() + '%', 460, doc.y, { width: 40 });
      doc.moveDown();
    });
    
    doc.moveDown(2);
    
    // Produtos sem movimentação
    doc.fontSize(16).font('Helvetica-Bold').text('Produtos sem Movimentação', { underline: true });
    doc.moveDown();
    
    // Cabeçalho da tabela
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('ID', 50, doc.y, { width: 60 });
    doc.text('Produto', 110, doc.y, { width: 150 });
    doc.text('Local', 260, doc.y, { width: 70 });
    doc.text('Estoque', 330, doc.y, { width: 60 });
    doc.moveDown();
    
    // Linha separadora
    doc.moveTo(50, doc.y).lineTo(500, doc.y).stroke();
    doc.moveDown(0.5);
    
    // Dados da tabela
    doc.fontSize(10).font('Helvetica');
    
    // Produtos simulados sem movimentação
    const produtosSemMov = [
      { id: 'ELVA12', nome: 'Webcam HD', local: 'Depósito B', quantidade: 5 },
      { id: 'CLVM05', nome: 'Detergente Premium', local: 'Filial 1', quantidade: 8 }
    ];
    
    // Adicionar linhas
    produtosSemMov.forEach(produto => {
      doc.text(produto.id, 50, doc.y, { width: 60 });
      doc.text(produto.nome, 110, doc.y, { width: 150 });
      doc.text(produto.local, 260, doc.y, { width: 70 });
      doc.text(produto.quantidade.toString(), 330, doc.y, { width: 60 });
      doc.moveDown();
    });
    
    // Rodapé
    doc.fontSize(10).font('Helvetica-Oblique').text(
      `Relatório gerado em ${new Date().toLocaleString('pt-BR')}`,
      { align: 'center' }
    );
    
    // Finalizar documento
    doc.end();
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao gerar PDF'
    });
  }
};