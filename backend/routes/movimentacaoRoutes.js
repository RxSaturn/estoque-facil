const express = require("express");
const router = express.Router();
const { proteger } = require("../middlewares/auth");
const Produto = require("../models/Produto");
const Estoque = require("../models/Estoque");
const Movimentacao = require("../models/Movimentacao");
const movimentacaoController = require("../controllers/movimentacaoController");

// Registrar uma movimentação (entrada, saída, transferência)
router.post("/", proteger, async (req, res) => {
  try {
    const {
      tipo,
      produto,
      quantidade,
      localOrigem,
      localDestino,
      data,
      observacao,
    } = req.body;

    // Validar tipo de movimentação
    if (!["entrada", "saida", "transferencia", "venda"].includes(tipo)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Tipo de movimentação inválido",
      });
    }

    // Validar campos obrigatórios
    if (!produto || !quantidade || quantidade <= 0 || !localOrigem) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Dados incompletos ou inválidos para a movimentação",
      });
    }

    // Validar produto
    const produtoExiste = await Produto.findById(produto);
    if (!produtoExiste) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Produto não encontrado",
      });
    }

    // Para transferência, verificar se localDestino foi informado
    if (tipo === "transferencia" && !localDestino) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Local de destino é obrigatório para transferências",
      });
    }

    // Para tipos que não são entrada, verificar estoque disponível
    if (tipo !== "entrada") {
      const estoque = await Estoque.findOne({
        produto: produto,
        local: localOrigem,
      });

      if (!estoque || estoque.quantidade < quantidade) {
        return res.status(400).json({
          sucesso: false,
          mensagem: "Estoque insuficiente para esta movimentação",
        });
      }
    }

    // Processar movimentação com base no tipo
    let resultadoOperacao;

    // Tratar a data para garantir que seja armazenada corretamente
    const dataMovimentacao = data ? new Date(data) : new Date();

    if (tipo === "entrada") {
      // Verificar se já existe um registro de estoque para este produto e local
      let estoque = await Estoque.findOne({
        produto: produto,
        local: localOrigem,
      });

      if (estoque) {
        // Atualizar estoque existente
        estoque.quantidade += parseInt(quantidade);
        estoque.ultimaAtualizacao = dataMovimentacao;
        estoque.atualizadoPor = req.usuario.id;
        await estoque.save();
      } else {
        // Criar novo registro de estoque
        estoque = await Estoque.create({
          produto: produto,
          local: localOrigem,
          quantidade: parseInt(quantidade),
          ultimaAtualizacao: dataMovimentacao,
          atualizadoPor: req.usuario.id,
        });
      }

      resultadoOperacao = estoque;
    } else if (tipo === "transferencia") {
      // Verificar estoque na origem
      let estoqueOrigem = await Estoque.findOne({
        produto: produto,
        local: localOrigem,
      });

      if (!estoqueOrigem || estoqueOrigem.quantidade < quantidade) {
        return res.status(400).json({
          sucesso: false,
          mensagem: "Estoque insuficiente para transferência",
        });
      }

      // Reduzir estoque na origem
      estoqueOrigem.quantidade -= parseInt(quantidade);
      estoqueOrigem.ultimaAtualizacao = dataMovimentacao;
      estoqueOrigem.atualizadoPor = req.usuario.id;
      await estoqueOrigem.save();

      // Adicionar ou atualizar estoque no destino
      let estoqueDestino = await Estoque.findOne({
        produto: produto,
        local: localDestino,
      });

      if (estoqueDestino) {
        estoqueDestino.quantidade += parseInt(quantidade);
        estoqueDestino.ultimaAtualizacao = dataMovimentacao;
        estoqueDestino.atualizadoPor = req.usuario.id;
        await estoqueDestino.save();
      } else {
        estoqueDestino = await Estoque.create({
          produto: produto,
          local: localDestino,
          quantidade: parseInt(quantidade),
          ultimaAtualizacao: dataMovimentacao,
          atualizadoPor: req.usuario.id,
        });
      }

      resultadoOperacao = { origem: estoqueOrigem, destino: estoqueDestino };
    } else {
      // Saída ou venda - reduzir estoque
      let estoque = await Estoque.findOne({
        produto: produto,
        local: localOrigem,
      });

      if (!estoque || estoque.quantidade < quantidade) {
        return res.status(400).json({
          sucesso: false,
          mensagem: "Estoque insuficiente",
        });
      }

      estoque.quantidade -= parseInt(quantidade);
      estoque.ultimaAtualizacao = dataMovimentacao;
      estoque.atualizadoPor = req.usuario.id;
      await estoque.save();

      resultadoOperacao = estoque;
    }

    // Registrar a movimentação
    const movimentacao = await Movimentacao.create({
      tipo,
      produto,
      quantidade: parseInt(quantidade),
      localOrigem,
      localDestino: localDestino || undefined,
      data: dataMovimentacao,
      realizadoPor: req.usuario.id,
      observacao,
    });

    res.status(201).json({
      sucesso: true,
      mensagem: "Movimentação registrada com sucesso",
      movimentacao,
      resultado: resultadoOperacao,
    });
  } catch (error) {
    console.error("Erro ao criar movimentação:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao processar movimentação",
    });
  }
});

// Listar histórico de movimentações
router.get("/historico", proteger, async (req, res) => {
  try {
    const {
      dataInicio,
      dataFim,
      produto,
      localOrigem,
      localDestino,
      tipo,
      page = 1,
      limit = 20,
    } = req.query;

    // Converter para números
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    console.log("Parâmetros de busca recebidos:", {
      dataInicio,
      dataFim,
      produto,
      localOrigem,
      localDestino,
      tipo,
      page: pageNum,
      limit: limitNum,
    });

    // Validar tipo se fornecido
    const tiposValidos = ["entrada", "saida", "transferencia", "venda", "atualizacao"];
    if (tipo && !tiposValidos.includes(tipo)) {
      console.warn(`Tipo de movimentação inválido: ${tipo}`);
      // Ignorar tipo inválido em vez de retornar erro (fallback suave)
    }

    // Construir filtro
    const filtro = {};

    // Tratamento de datas com validação
    if (dataInicio && dataFim) {
      try {
        // Criar objeto de data para início (começando à meia-noite)
        const inicio = new Date(dataInicio);
        inicio.setHours(0, 0, 0, 0);

        // Criar objeto de data para fim (terminando à meia-noite)
        const fim = new Date(dataFim);
        fim.setHours(23, 59, 59, 999);

        console.log("Datas processadas:", {
          dataInicioRaw: dataInicio,
          dataFimRaw: dataFim,
          dataInicioObj: inicio.toISOString(),
          dataFimObj: fim.toISOString(),
        });

        // Verificar se as datas são válidas
        if (!isNaN(inicio.getTime()) && !isNaN(fim.getTime())) {
          filtro.data = {
            $gte: inicio,
            $lte: fim,
          };
          console.log("Filtro de data aplicado:", filtro.data);
        } else {
          console.warn("Datas inválidas fornecidas:", { dataInicio, dataFim });
        }
      } catch (err) {
        console.error("Erro ao processar datas:", err);
      }
    }

    if (produto) {
      filtro.produto = produto;
      console.log("Filtrando por produto:", produto);
    }

    if (localOrigem) {
      filtro.localOrigem = localOrigem;
      console.log("Filtrando por localOrigem:", localOrigem);
    }

    // Filtrar por local de destino (para transferências)
    if (localDestino) {
      filtro.localDestino = localDestino;
      console.log("Filtrando por localDestino:", localDestino);
    }

    if (tipo) {
      // Caso especial para atualizações
      if (tipo === "atualizacao") {
        // Usar operador $or para buscar tanto tipo 'atualizacao' quanto 'entrada' com observação de atualização
        filtro.$or = [
          { tipo: "atualizacao" },
          {
            tipo: "entrada",
            observacao: { $regex: /Produto atualizado/i },
          },
        ];
        console.log("Filtrando por atualizações de produto (lógica especial)");
      }
      // Caso especial para entrada - EXCLUIR atualizações
      else if (tipo === "entrada") {
        filtro.tipo = "entrada";
        // Excluir entradas que são atualizações
        filtro.observacao = { $not: { $regex: /Produto atualizado/i } };
        console.log(
          "Filtrando por entradas regulares (excluindo atualizações)"
        );
      } else {
        // Para outros tipos, filtro normal
        filtro.tipo = tipo;
        console.log("Filtrando por tipo:", tipo);
      }
    }

    console.log("Filtro final:", filtro);

    // Contar total de documentos que correspondem ao filtro
    const total = await Movimentacao.countDocuments(filtro);

    // Buscar todas as movimentações com filtro e paginação
    const movimentacoes = await Movimentacao.find(filtro)
      .populate("produto", "id nome tipo categoria subcategoria")
      .populate("realizadoPor", "nome")
      .sort({ data: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    // log para depuração
    console.log(
      `Encontradas ${total} movimentações no total, mostrando ${movimentacoes.length} resultados`
    );

    res.status(200).json({
      sucesso: true,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      contagem: movimentacoes.length,
      movimentacoes: movimentacoes,
    });
  } catch (error) {
    console.error("Erro ao listar movimentações:", error);
    
    // Determinar o tipo de erro para feedback mais detalhado
    let mensagemErro = "Erro ao listar movimentações";
    let codigoErro = "UNKNOWN_ERROR";
    
    if (error.name === "CastError") {
      mensagemErro = "Parâmetro inválido fornecido na requisição";
      codigoErro = "INVALID_PARAMETER";
    } else if (error.name === "MongoNetworkError" || error.name === "MongoTimeoutError") {
      mensagemErro = "Erro de conexão com o banco de dados";
      codigoErro = "DATABASE_CONNECTION_ERROR";
    } else if (error.message && error.message.includes("timeout")) {
      mensagemErro = "A consulta demorou muito para responder";
      codigoErro = "TIMEOUT_ERROR";
    }
    
    res.status(500).json({
      sucesso: false,
      mensagem: mensagemErro,
      codigo: codigoErro,
      erro: error.message,
    });
  }
});

// Rota para excluir movimentações de produtos removidos (deve vir ANTES da rota de exclusão por ID)
router.delete(
  "/produtos-removidos",
  proteger,
  movimentacaoController.excluirMovimentacoesProdutosRemovidos
);

// Rota para excluir movimentação específica por ID (deve vir DEPOIS da rota específica)
router.delete("/:id", proteger, movimentacaoController.excluirMovimentacao);

module.exports = router;
