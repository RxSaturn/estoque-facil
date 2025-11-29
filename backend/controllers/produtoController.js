const Produto = require("../models/Produto");
const Estoque = require("../models/Estoque");
const Movimentacao = require("../models/Movimentacao");
const { excluirArquivos, excluirArquivo } = require("../utils/fileUtils");

// Função auxiliar para gerar ID do produto - Sistema ilimitado com timestamp+random
const gerarIdProduto = async (tipo, categoria, subcategoria, nome) => {
  // Primeiras duas letras de cada campo para formar o prefixo (com fallback seguro)
  const tipoPrefix = (tipo || 'XX').padEnd(2, 'X').substring(0, 2).toUpperCase();
  const categoriaPrefix = (categoria || 'XX').padEnd(2, 'X').substring(0, 2).toUpperCase();
  const subcategoriaPrefix = (subcategoria || 'XX').padEnd(2, 'X').substring(0, 2).toUpperCase();
  
  const prefixo = `${tipoPrefix}${categoriaPrefix}${subcategoriaPrefix}`;
  
  // Gerar sufixo único com base em timestamp + random (com padding consistente)
  const timestamp = Date.now().toString(36).toUpperCase().padStart(8, '0').slice(-4);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase().padEnd(4, '0');
  const sufixo = `${timestamp}${random}`;
  
  const novoId = `${prefixo}-${sufixo}`;
  
  // Verificar unicidade (chance mínima de colisão)
  const existe = await Produto.findOne({ id: novoId }).lean();
  if (existe) {
    // Fallback: gerar outro ID aleatório em caso de colisão
    const fallbackRandom = Math.random().toString(36).substring(2, 10).toUpperCase().padEnd(8, '0');
    return `${prefixo}-${fallbackRandom}`;
  }
  
  return novoId;
};

// Criar novo produto
exports.criarProduto = async (req, res) => {
  try {
    const { nome, tipo, categoria, subcategoria, local, quantidade } = req.body;

    // Validar campos obrigatórios
    if (
      !nome ||
      !tipo ||
      !categoria ||
      !subcategoria ||
      !local ||
      quantidade === undefined
    ) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Todos os campos são obrigatórios",
      });
    }

    // Gerar ID do produto
    const id = await gerarIdProduto(tipo, categoria, subcategoria, nome);

    // Salvar imagem se existir
    let imagemUrl = "/uploads/default-product.png";
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
      criadoPor: req.usuario.id,
    });

    // Registrar estoque inicial
    const novoEstoque = await Estoque.create({
      produto: novoProduto._id,
      local,
      quantidade: parseInt(quantidade),
      atualizadoPor: req.usuario.id,
    });

    // Registrar movimentação de entrada
    await Movimentacao.create({
      tipo: "entrada",
      produto: novoProduto._id,
      quantidade: parseInt(quantidade),
      localOrigem: local,
      realizadoPor: req.usuario.id,
      observacao: "Registro inicial de produto",
    });

    res.status(201).json({
      sucesso: true,
      mensagem: "Produto criado com sucesso",
      produto: novoProduto,
      estoque: novoEstoque,
    });
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: `Erro ao criar produto: ${error.message}`,
    });
  }
};

// Listar produtos com paginação - OTIMIZADO com .lean() e .select()
exports.listarProdutos = async (req, res) => {
  try {
    const {
      categoria,
      subcategoria,
      tipo,
      busca,
      page = 1,
      limit = 20,
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
        { nome: { $regex: busca, $options: "i" } },
        { id: { $regex: busca, $options: "i" } },
        { categoria: { $regex: busca, $options: "i" } },
      ];
    }

    // Executar contagem e busca em paralelo para melhor performance
    const [total, produtos] = await Promise.all([
      Produto.countDocuments(filtro),
      Produto.find(filtro)
        .select('id nome categoria tipo subcategoria imagemUrl dataCriacao temEstoqueBaixo temEstoqueCritico temEstoqueEsgotado')
        .sort({ updatedAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean()
    ]);

    res.status(200).json({
      sucesso: true,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      produtos,
    });
  } catch (error) {
    console.error("Erro ao listar produtos:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao listar produtos",
      erro: error.message,
    });
  }
};

// Contar produtos - Endpoint otimizado para contagem rápida
exports.contarProdutos = async (req, res) => {
  try {
    const { categoria, tipo, subcategoria } = req.query;
    
    const filtro = {};
    if (categoria) filtro.categoria = categoria;
    if (tipo) filtro.tipo = tipo;
    if (subcategoria) filtro.subcategoria = subcategoria;
    
    const total = await Produto.countDocuments(filtro);
    
    res.json({ sucesso: true, total });
  } catch (error) {
    console.error("Erro ao contar produtos:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao contar produtos",
      erro: error.message,
    });
  }
};

// Listar tipos de produtos
exports.listarTipos = async (req, res) => {
  try {
    // Obter tipos distintos de produtos
    const tipos = await Produto.distinct("tipo");

    res.status(200).json(tipos);
  } catch (error) {
    console.error("Erro ao listar tipos de produtos:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao listar tipos de produtos",
    });
  }
};

// Listar categorias de produtos
exports.listarCategorias = async (req, res) => {
  try {
    // Filtrar por tipo se fornecido
    const filtro = {};
    if (req.query.tipo) {
      filtro.tipo = req.query.tipo;
    }

    // Obter categorias distintas
    const categorias = await Produto.distinct("categoria", filtro);

    res.status(200).json(categorias);
  } catch (error) {
    console.error("Erro ao listar categorias de produtos:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao listar categorias de produtos",
    });
  }
};

// Listar subcategorias de produtos
exports.listarSubcategorias = async (req, res) => {
  try {
    // Filtrar por tipo e/ou categoria se fornecidos
    const filtro = {};
    if (req.query.tipo) filtro.tipo = req.query.tipo;
    if (req.query.categoria) filtro.categoria = req.query.categoria;

    // Obter subcategorias distintas
    const subcategorias = await Produto.distinct("subcategoria", filtro);

    res.status(200).json(subcategorias);
  } catch (error) {
    console.error("Erro ao listar subcategorias de produtos:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao listar subcategorias de produtos",
    });
  }
};

// Obter produto por ID - OTIMIZADO com .lean() para estoques
exports.obterProdutoPorId = async (req, res) => {
  try {
    const produto = await Produto.findById(req.params.id).lean();

    if (!produto) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Produto não encontrado",
      });
    }

    // Obter informações de estoque deste produto com .lean()
    const estoques = await Estoque.find({ produto: produto._id })
      .select('local quantidade ultimaAtualizacao')
      .lean();

    res.status(200).json({
      sucesso: true,
      produto,
      estoques,
    });
  } catch (error) {
    console.error("Erro ao obter produto:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao obter produto",
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
        mensagem: "Produto não encontrado",
      });
    }

    // Guardar nome original para log de alteração
    const nomeOriginal = produto.nome;
    const tipoOriginal = produto.tipo;
    const categoriaOriginal = produto.categoria;
    const subcategoriaOriginal = produto.subcategoria;

    // Verificar se temos uma nova imagem
    if (req.file) {
      // Armazenar imagem anterior para exclusão
      const imagemAnterior = produto.imagemUrl;

      // Atualizar para a nova imagem
      produto.imagemUrl = `/uploads/${req.file.filename}`;

      // Log da atualização
      console.log(
        `Atualizando imagem de ${imagemAnterior} para ${produto.imagemUrl}`
      );

      // Excluir imagem anterior se não for a imagem padrão
      if (imagemAnterior && imagemAnterior !== "/uploads/default-product.png") {
        // Extrair apenas o nome do arquivo da imagem
        const nomeArquivo = imagemAnterior.split("/").pop();

        // Agendar a exclusão para o próximo ciclo de evento
        setImmediate(async () => {
          try {
            // Tentar excluir tanto com caminho completo quanto apenas com o nome do arquivo
            console.log(`Tentando excluir arquivo por nome: ${nomeArquivo}`);
            let resultadoExclusao = excluirArquivo(nomeArquivo);

            // Se falhar, tentar com o caminho completo
            if (!resultadoExclusao.sucesso) {
              console.log(
                `Tentando excluir arquivo por caminho completo: ${imagemAnterior}`
              );
              resultadoExclusao = excluirArquivo(imagemAnterior);
            }

            console.log(`Resultado da exclusão:`, resultadoExclusao);
          } catch (err) {
            console.error("Erro ao excluir imagem antiga:", err);
          }
        });
      }
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
      alteracoes.push(
        `Subcategoria: ${subcategoriaOriginal} → ${subcategoria}`
      );
      produto.subcategoria = subcategoria;
    }

    // Salvar alterações
    await produto.save();

    // Se houve alterações, registrar uma movimentação de atualização
    if (alteracoes.length > 0 || req.file) {
      // Usar um tipo existente e quantidade mínima para evitar erros de validação
      await Movimentacao.create({
        tipo: "entrada", // Usar tipo válido existente
        produto: produto._id,
        quantidade: 1, // Usar quantidade mínima válida
        localOrigem: "Sistema",
        realizadoPor: req.usuario.id,
        observacao: `Produto atualizado: ${alteracoes.join(", ")}${
          req.file ? " (imagem atualizada)" : ""
        }`,
      });
    }

    res.status(200).json({
      sucesso: true,
      mensagem: "Produto atualizado com sucesso",
      produto,
    });
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao atualizar produto",
      erro: error.message,
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
        mensagem: "Produto não encontrado",
      });
    }

    // Obter informações atuais de estoque
    const estoques = await Estoque.find({ produto: produto._id });
    const totalEstoque = estoques.reduce(
      (total, estoque) => total + estoque.quantidade,
      0
    );

    // Se não houver estoque, apenas retornar sucesso
    if (totalEstoque === 0) {
      return res.status(200).json({
        sucesso: true,
        mensagem: "Produto já está com estoque zerado",
        produto,
      });
    }

    // Para cada local de estoque, criar uma movimentação e zerar o estoque
    for (const estoque of estoques) {
      if (estoque.quantidade > 0) {
        // Registrar movimentação de saída para cada local
        await Movimentacao.create({
          tipo: "saida",
          produto: produto._id,
          quantidade: estoque.quantidade, // Isso já é a quantidade real, então é seguro
          localOrigem: estoque.local,
          realizadoPor: req.usuario.id,
          observacao: "Zeragem de estoque para permitir exclusão do produto",
        });

        // Zerar o estoque neste local
        estoque.quantidade = 0;
        await estoque.save();
      }
    }

    res.status(200).json({
      sucesso: true,
      mensagem: "Estoque do produto zerado com sucesso",
      produto,
    });
  } catch (error) {
    console.error("Erro ao zerar estoque do produto:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: `Erro ao zerar estoque do produto: ${error.message}`,
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
        mensagem: "Produto não encontrado",
      });
    }

    // Verificar se há estoque do produto
    const estoques = await Estoque.find({ produto: produto._id });
    const temEstoque = estoques.some((estoque) => estoque.quantidade > 0);

    if (temEstoque) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Não é possível remover um produto com estoque disponível",
      });
    }

    // Coletar imagens para exclusão
    const imagensParaExcluir = [];

    // Verificar se o produto tem uma imagem não padrão
    if (
      produto.imagemUrl &&
      produto.imagemUrl !== "/uploads/default-product.png"
    ) {
      imagensParaExcluir.push(produto.imagemUrl);
    }

    // Se o produto tiver imagens adicionais (verificar se o campo existe no modelo)
    if (produto.imagensAdicionais && Array.isArray(produto.imagensAdicionais)) {
      imagensParaExcluir.push(...produto.imagensAdicionais);
    }

    // Remover estoque do produto
    await Estoque.deleteMany({ produto: produto._id });

    // Nome do produto para usar na observação
    const nomeProduto = produto.nome;
    const idProduto = produto.id;

    // Registrar movimentações históricas antes de remover o produto
    const movimentacaoSaida = await Movimentacao.create({
      tipo: "saida",
      produto: produto._id,
      quantidade: 1,
      localOrigem: "Sistema",
      realizadoPor: req.usuario.id,
      observacao: `Produto ${idProduto} - ${nomeProduto} removido do sistema`,
    });

    // Salvar a movimentação de remoção para referência
    const movimentacaoId = movimentacaoSaida._id;

    // IMPORTANTE: Atualizar as movimentações existentes para não perderem a referência
    // Marcar todas as movimentações antigas desse produto para manter referência
    await Movimentacao.updateMany(
      { produto: produto._id },
      {
        $set: {
          observacao: `${
            produto.observacao || ""
          } [Produto ${idProduto} - ${nomeProduto} removido]`,
        },
      }
    );

    // Remover o produto
    await Produto.findByIdAndDelete(req.params.id);

    // Remover as imagens do sistema de arquivos
    if (imagensParaExcluir.length > 0) {
      const resultadoExclusao = excluirArquivos(imagensParaExcluir);
      console.log(`Resultado da exclusão de imagens:`, resultadoExclusao);
    }

    res.status(200).json({
      sucesso: true,
      mensagem: "Produto removido com sucesso",
      movimentacaoId: movimentacaoId,
      detalhes: {
        imagensExcluidas: imagensParaExcluir.length,
      },
    });
  } catch (error) {
    console.error("Erro ao remover produto:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao remover produto",
    });
  }
};
// Obter produtos mais vendidos - OTIMIZADO com .lean() e .select()
exports.obterProdutosMaisVendidos = async (req, res) => {
  try {
    const limite = parseInt(req.query.limite) || 5;

    // Buscar produtos ordenados por vendas com .lean() e .select()
    const produtos = await Produto.find()
      .select('_id nome vendas preco')
      .sort({ vendas: -1 })
      .limit(limite)
      .lean();

    // Transformar para o formato esperado
    const resultado = produtos.map((p) => ({
      id: p._id,
      nome: p.nome,
      quantidadeVendas: p.vendas || 0,
      receita: (p.preco || 0) * (p.vendas || 0),
    }));

    res.json(resultado);
  } catch (error) {
    console.error("Erro ao buscar produtos mais vendidos:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao buscar produtos mais vendidos",
      erro: error.message,
    });
  }
};

// Obter estatísticas de produtos - OTIMIZADO com agregação paralela
exports.obterEstatisticas = async (req, res) => {
  try {
    // Executar todas as consultas em paralelo para melhor performance
    const [total, estoqueAgregado, estoqueBaixoCount] = await Promise.all([
      // Contar total de produtos
      Produto.countDocuments(),
      // Calcular quantidade total em estoque
      Estoque.aggregate([
        { $group: { _id: null, quantidadeTotal: { $sum: "$quantidade" } } },
      ]),
      // Contar produtos com estoque baixo (quantidade <= 20)
      Estoque.countDocuments({ quantidade: { $lte: 20, $gt: 0 } })
    ]);

    const quantidadeTotal =
      estoqueAgregado.length > 0 ? estoqueAgregado[0].quantidadeTotal : 0;

    res.json({
      total,
      quantidadeTotal,
      estoqueBaixo: estoqueBaixoCount,
      tendencia: 0,
      tendenciaEstoqueBaixo: 0,
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas de produtos:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao buscar estatísticas de produtos",
      erro: error.message,
    });
  }
};

exports.obterUltimasTransacoes = async (req, res) => {
  try {
    const limite = parseInt(req.query.limite) || 10;

    // Buscar movimentações recentes com .lean() para performance
    const movimentacoes = await Movimentacao.find()
      .populate("produto", "id nome")
      .populate("realizadoPor", "nome")
      .sort({ data: -1 })
      .limit(limite)
      .lean();

    // Transformar para formato simplificado conforme solicitado
    const transacoes = movimentacoes.map((m) => ({
      idProduto: m.produto?.id,
      nomeProduto: m.produto?.nome,
      local: m.localOrigem,
      quantidade: m.quantidade,
      realizadoPor: m.realizadoPor?.nome,
    }));

    res.json(transacoes);
  } catch (error) {
    // Tratamento de erro...
  }
};

// Buscar produtos para autocomplete - OTIMIZADO para retornar apenas campos necessários
exports.buscarProdutos = async (req, res) => {
  try {
    const { q = "", limit = 20 } = req.query;

    // Validate and sanitize limit parameter (prevent DoS, enforce max of 50)
    const MAX_LIMIT = 50;
    const sanitizedLimit = Math.min(Math.max(1, parseInt(limit) || 20), MAX_LIMIT);

    // Build search filter
    const filtro = {};
    if (q && q.trim()) {
      filtro.$or = [
        { nome: { $regex: q.trim(), $options: "i" } },
        { id: { $regex: q.trim(), $options: "i" } },
      ];
    }

    // Find products with only required fields for autocomplete
    const produtos = await Produto.find(filtro)
      .select("_id id nome")
      .sort({ nome: 1 })
      .limit(sanitizedLimit)
      .lean();

    // Get stock information for each product
    const produtoIds = produtos.map((p) => p._id);
    const estoques = await Estoque.aggregate([
      { $match: { produto: { $in: produtoIds } } },
      {
        $group: {
          _id: "$produto",
          estoqueTotal: { $sum: "$quantidade" },
        },
      },
    ]);

    // Create map of stock by product ID
    const estoqueMap = {};
    estoques.forEach((e) => {
      estoqueMap[e._id.toString()] = e.estoqueTotal;
    });

    // Combine product info with stock
    const resultado = produtos.map((p) => ({
      _id: p._id,
      id: p.id,
      nome: p.nome,
      estoque: estoqueMap[p._id.toString()] || 0,
    }));

    res.json({
      sucesso: true,
      produtos: resultado,
    });
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao buscar produtos",
      erro: error.message,
    });
  }
};
