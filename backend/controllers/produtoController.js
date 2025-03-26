const Produto = require('../models/Produto');
const Estoque = require('../models/Estoque');
const Movimentacao = require('../models/Movimentacao');

// Função auxiliar para gerar ID do produto
const gerarIdProduto = async (tipo, categoria, subcategoria, nome) => {
  // Primeira letra de cada campo
  const tipoPrimLetra = tipo.charAt(0).toUpperCase();
  const categoriaPrimLetra = categoria.charAt(0).toUpperCase();
  const subcategoriaPrimLetra = subcategoria.charAt(0).toUpperCase();
  const nomePrimLetra = nome.charAt(0).toUpperCase();
  
  // Base do ID
  const baseId = `${tipoPrimLetra}${categoriaPrimLetra}${subcategoriaPrimLetra}${nomePrimLetra}`;
  
  // Verificar se já existem produtos com esse prefixo
  const produtosExistentes = await Produto.find({ id: new RegExp(`^${baseId}\\d{2}$`) })
                                         .sort({ id: -1 });
  
  // Se não existir nenhum, começamos com 00
  if (produtosExistentes.length === 0) {
    return `${baseId}00`;
  }
  
  // Se existir, pegamos o último e incrementamos
  const ultimoId = produtosExistentes[0].id;
  const ultimoNumero = parseInt(ultimoId.slice(-2));
  
  // Verificar se atingiu o limite
  if (ultimoNumero >= 99) {
    throw new Error('Limite de IDs atingido para este tipo de produto');
  }
  
  // Incrementar e formatar com zero à esquerda
  const novoNumero = (ultimoNumero + 1).toString().padStart(2, '0');
  
  return `${baseId}${novoNumero}`;
};

// Criar novo produto
exports.criarProduto = async (req, res) => {
  try {
    const { nome, tipo, categoria, subcategoria, local, quantidade } = req.body;
    
    // Validar campos obrigatórios
    if (!nome || !tipo || !categoria || !subcategoria || !local || quantidade === undefined) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Todos os campos são obrigatórios'
      });
    }

    // Gerar ID do produto
    const id = await gerarIdProduto(tipo, categoria, subcategoria, nome);
    
    // Salvar imagem se existir
    let imagemUrl = '/uploads/default-product.png';
    if (req.file) {
      imagemUrl = `/uploads/${req.file.filename}`;
    }
    
    // Criar produto
    const novoProduto = await Produto.create({
      id,
      nome,
      tipo,
      categoria,
      subcategoria,
      imagemUrl,
      criadoPor: req.usuario.id
    });
    
    // Registrar estoque inicial
    const novoEstoque = await Estoque.create({
      produto: novoProduto._id,
      local,
      quantidade: parseInt(quantidade),
      atualizadoPor: req.usuario.id
    });
    
    // Registrar movimentação de entrada
    await Movimentacao.create({
      tipo: 'entrada',
      produto: novoProduto._id,
      quantidade: parseInt(quantidade),
      localOrigem: local,
      realizadoPor: req.usuario.id,
      observacao: 'Registro inicial de produto'
    });
    
    res.status(201).json({
      sucesso: true,
      mensagem: 'Produto criado com sucesso',
      produto: novoProduto,
      estoque: novoEstoque
    });
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: `Erro ao criar produto: ${error.message}`
    });
  }
};

// Listar produtos com paginação
exports.listarProdutos = async (req, res) => {
  try {
    const { 
      categoria, subcategoria, tipo, busca,
      page = 1, limit = 20
    } = req.query;
    
    // Converter para números
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    // Construir filtro
    const filtro = {};
    
    if (categoria) filtro.categoria = categoria;
    if (subcategoria) filtro.subcategoria = subcategoria;
    if (tipo) filtro.tipo = tipo;
    
    if (busca) {
      // Busca por nome, ID ou outras propriedades
      filtro.$or = [
        { nome: { $regex: busca, $options: 'i' } },
        { id: { $regex: busca, $options: 'i' } },
        { categoria: { $regex: busca, $options: 'i' } }
      ];
    }
    
    // Contar total de documentos que correspondem ao filtro
    const total = await Produto.countDocuments(filtro);
    
    // Buscar produtos com filtro e paginação
    const produtos = await Produto.find(filtro)
      .sort({ updatedAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);
    
    res.status(200).json({
      sucesso: true,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      produtos
    });
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao listar produtos',
      erro: error.message
    });
  }
};

// Obter produto por ID
exports.obterProdutoPorId = async (req, res) => {
  try {
    const produto = await Produto.findById(req.params.id);
    
    if (!produto) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Produto não encontrado'
      });
    }
    
    // Obter informações de estoque deste produto
    const estoques = await Estoque.find({ produto: produto._id });
    
    res.status(200).json({
      sucesso: true,
      produto,
      estoques
    });
  } catch (error) {
    console.error('Erro ao obter produto:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao obter produto'
    });
  }
};

// Atualizar produto
exports.atualizarProduto = async (req, res) => {
  try {
    const { nome, tipo, categoria, subcategoria } = req.body;
    
    // Verificar se o produto existe
    let produto = await Produto.findById(req.params.id);
    if (!produto) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Produto não encontrado'
      });
    }
    
    // Guardar nome original para log de alteração
    const nomeOriginal = produto.nome;
    const tipoOriginal = produto.tipo;
    const categoriaOriginal = produto.categoria;
    const subcategoriaOriginal = produto.subcategoria;
    
    // Atualizar imagem se fornecida
    if (req.file) {
      produto.imagemUrl = `/uploads/${req.file.filename}`;
    }
    
    // Verificar se houve alterações nos campos principais
    const alteracoes = [];
    if (nome && nome !== produto.nome) {
      alteracoes.push(`Nome: ${nomeOriginal} → ${nome}`);
      produto.nome = nome;
    }
    
    if (tipo && tipo !== produto.tipo) {
      alteracoes.push(`Tipo: ${tipoOriginal} → ${tipo}`);
      produto.tipo = tipo;
    }
    
    if (categoria && categoria !== produto.categoria) {
      alteracoes.push(`Categoria: ${categoriaOriginal} → ${categoria}`);
      produto.categoria = categoria;
    }
    
    if (subcategoria && subcategoria !== produto.subcategoria) {
      alteracoes.push(`Subcategoria: ${subcategoriaOriginal} → ${subcategoria}`);
      produto.subcategoria = subcategoria;
    }
    
    // Salvar alterações
    await produto.save();
    
    // Se houve alterações, registrar uma movimentação de atualização
    if (alteracoes.length > 0) {
      // Usar um tipo existente e quantidade mínima para evitar erros de validação
      await Movimentacao.create({
        tipo: 'entrada', // Usar tipo válido existente
        produto: produto._id,
        quantidade: 1, // Usar quantidade mínima válida
        localOrigem: 'Sistema',
        realizadoPor: req.usuario.id,
        observacao: `Produto atualizado: ${alteracoes.join(', ')}` // Manter o registro na observação
      });
    }
    
    res.status(200).json({
      sucesso: true,
      mensagem: 'Produto atualizado com sucesso',
      produto
    });
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao atualizar produto'
    });
  }
};

// Zerar estoque de um produto
exports.zerarEstoqueProduto = async (req, res) => {
  try {
    // Verificar se o produto existe
    const produto = await Produto.findById(req.params.id);
    if (!produto) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Produto não encontrado'
      });
    }
    
    // Obter informações atuais de estoque
    const estoques = await Estoque.find({ produto: produto._id });
    const totalEstoque = estoques.reduce((total, estoque) => total + estoque.quantidade, 0);
    
    // Se não houver estoque, apenas retornar sucesso
    if (totalEstoque === 0) {
      return res.status(200).json({
        sucesso: true,
        mensagem: 'Produto já está com estoque zerado',
        produto
      });
    }
    
    // Para cada local de estoque, criar uma movimentação e zerar o estoque
    for (const estoque of estoques) {
      if (estoque.quantidade > 0) {
        // Registrar movimentação de saída para cada local
        await Movimentacao.create({
          tipo: 'saida',
          produto: produto._id,
          quantidade: estoque.quantidade, // Isso já é a quantidade real, então é seguro
          localOrigem: estoque.local,
          realizadoPor: req.usuario.id,
          observacao: 'Zeragem de estoque para permitir exclusão do produto'
        });
        
        // Zerar o estoque neste local
        estoque.quantidade = 0;
        await estoque.save();
      }
    }
    
    res.status(200).json({
      sucesso: true,
      mensagem: 'Estoque do produto zerado com sucesso',
      produto
    });
  } catch (error) {
    console.error('Erro ao zerar estoque do produto:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: `Erro ao zerar estoque do produto: ${error.message}`
    });
  }
};

// Remover produto
exports.removerProduto = async (req, res) => {
  try {
    // Verificar se o produto existe
    const produto = await Produto.findById(req.params.id);
    if (!produto) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Produto não encontrado'
      });
    }
    
    // Verificar se há estoque do produto
    const estoques = await Estoque.find({ produto: produto._id });
    const temEstoque = estoques.some(estoque => estoque.quantidade > 0);
    
    if (temEstoque) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Não é possível remover um produto com estoque disponível'
      });
    }
    
    // Remover estoque do produto
    await Estoque.deleteMany({ produto: produto._id });
    
    // Nome do produto para usar na observação
    const nomeProduto = produto.nome;
    const idProduto = produto.id;
    
    // Registrar movimentações históricas antes de remover o produto
    const movimentacaoSaida = await Movimentacao.create({
      tipo: 'saida',
      produto: produto._id,
      quantidade: 1,
      localOrigem: 'Sistema',
      realizadoPor: req.usuario.id,
      observacao: `Produto ${idProduto} - ${nomeProduto} removido do sistema`
    });
    
    // Salvar a movimentação de remoção para referência
    const movimentacaoId = movimentacaoSaida._id;
    
    // Remover o produto
    await Produto.findByIdAndDelete(req.params.id);
    
    // IMPORTANTE: Atualizar as movimentações existentes para não perderem a referência
    // Marcar todas as movimentações antigas desse produto para manter referência
    await Movimentacao.updateMany(
      { produto: produto._id },
      { 
        $set: { 
          observacao: `${produto.observacao || ''} [Produto ${idProduto} - ${nomeProduto} removido]`
        }
      }
    );
    
    res.status(200).json({
      sucesso: true,
      mensagem: 'Produto removido com sucesso',
      movimentacaoId: movimentacaoId
    });
  } catch (error) {
    console.error('Erro ao remover produto:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao remover produto'
    });
  }
};
