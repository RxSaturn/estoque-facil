import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  FaSave,
  FaExchangeAlt,
  FaBoxOpen,
  FaArrowRight,
  FaPlus,
  FaTrash,
  FaShoppingCart,
  FaBoxes,
} from "react-icons/fa";
import api from "../services/api";
import { toast } from "react-toastify";
import ProdutoSelect from "../components/form/ProdutoSelect";
import "./Movimentacao.css";

const Movimentacao = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const produtoIdParam = queryParams.get("produtoId");
  const tipoMovimentacaoParam = queryParams.get("tipo") || "transferencia";

  // Função auxiliar para formatar data respeitando o fuso horário local
  const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Estado do tipo de movimentação - agora com 'entrada' como opção
  const [tipoMovimentacao, setTipoMovimentacao] = useState(
    tipoMovimentacaoParam
  );

  // Formulário
  const [formData, setFormData] = useState({
    produto: produtoIdParam || "",
    localOrigem: "",
    localDestino: "",
    quantidade: 1,
    data: formatLocalDate(new Date()),
    observacao: "",
  });

  // Dados para formulários
  const [locais, setLocais] = useState([]);
  const [estoqueOrigem, setEstoqueOrigem] = useState(0);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [enviando, setEnviando] = useState(false);

  // Para vendas múltiplas
  const [carrinhoProdutos, setCarrinhoProdutos] = useState([]);

  // Carregar locais ao montar o componente
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setCarregando(true);

        // Carregar locais
        const resLocais = await api.get("/api/estoque/locais");
        setLocais(resLocais.data);

        // Se fornecido um produtoId, buscar e selecionar este produto
        if (produtoIdParam) {
          try {
            const produtoRes = await api.get(`/api/produtos/${produtoIdParam}`);
            const produtoInfo = produtoRes.data.produto;

            setProdutoSelecionado(produtoInfo);
            setFormData((prev) => ({
              ...prev,
              produto: produtoIdParam,
            }));

            // Se também tiver um local e o tipo for entrada, verificar estoque
            if (
              resLocais.data.length > 0 &&
              tipoMovimentacaoParam === "entrada"
            ) {
              setFormData((prev) => ({
                ...prev,
                localOrigem: resLocais.data[0],
              }));
            }
          } catch (err) {
            console.error("Erro ao buscar produto:", err);
            toast.error("Não foi possível carregar o produto especificado");
          }
        }

        setCarregando(false);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast.error("Erro ao carregar dados. Tente novamente.");
        setCarregando(false);
      }
    };

    carregarDados();
  }, [produtoIdParam, tipoMovimentacaoParam]);

  // Verificar estoque ao selecionar produto e local origem
  useEffect(() => {
    const verificarEstoque = async () => {
      if (formData.produto && formData.localOrigem) {
        try {
          const resposta = await api.get(
            `/api/estoque/verificar?produto=${formData.produto}&local=${formData.localOrigem}`
          );
          setEstoqueOrigem(resposta.data.quantidade || 0);
        } catch (error) {
          console.error("Erro ao verificar estoque:", error);
          setEstoqueOrigem(0);
        }
      } else {
        setEstoqueOrigem(0);
      }
    };

    verificarEstoque();
  }, [formData.produto, formData.localOrigem]);

  // Handle product selection from ProdutoSelect component
  const handleProdutoChange = (produto) => {
    setProdutoSelecionado(produto);
  };

  const handleChangeMovimentacao = (tipo) => {
    setTipoMovimentacao(tipo);

    // Limpar o carrinho se mudar o tipo
    if (tipo !== "venda") {
      setCarrinhoProdutos([]);
    }

    // Reiniciar campos da movimentação mas manter o produto se já estiver selecionado
    setFormData((prev) => ({
      ...prev,
      localOrigem: "",
      localDestino: "",
      quantidade: 1,
    }));

    setEstoqueOrigem(0);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const adicionarAoCarrinho = () => {
    // Validar produto e quantidade
    if (!formData.produto) {
      toast.error("Selecione um produto");
      return;
    }

    if (!formData.localOrigem) {
      toast.error("Selecione o local de origem");
      return;
    }

    if (formData.quantidade <= 0) {
      toast.error("A quantidade deve ser maior que zero");
      return;
    }

    if (tipoMovimentacao === "saida" && formData.quantidade > estoqueOrigem) {
      toast.error(
        `Quantidade insuficiente. Estoque disponível: ${estoqueOrigem}`
      );
      return;
    }

    // Verificar se o produto já está no carrinho
    const produtoExistente = carrinhoProdutos.find(
      (item) =>
        item.produto === formData.produto &&
        item.localOrigem === formData.localOrigem
    );

    if (produtoExistente) {
      toast.error(
        "Este produto já está no carrinho. Remova-o e adicione novamente se deseja alterar."
      );
      return;
    }

    // Adicionar ao carrinho
    const novoProdutoCarrinho = {
      produto: formData.produto,
      produtoNome: produtoSelecionado.nome,
      produtoId: produtoSelecionado.id,
      localOrigem: formData.localOrigem,
      quantidade: parseInt(formData.quantidade),
      estoqueDisponivel: estoqueOrigem,
    };

    setCarrinhoProdutos([...carrinhoProdutos, novoProdutoCarrinho]);

    // Limpar formulário para adicionar novo produto
    setFormData((prev) => ({
      ...prev,
      produto: "",
      quantidade: 1,
    }));

    setProdutoSelecionado(null);
    setEstoqueOrigem(0);

    toast.success("Produto adicionado ao carrinho");
  };

  const removerDoCarrinho = (index) => {
    const novoCarrinho = [...carrinhoProdutos];
    novoCarrinho.splice(index, 1);
    setCarrinhoProdutos(novoCarrinho);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (tipoMovimentacao === "transferencia") {
      // Validações básicas para transferência
      if (!formData.produto) {
        toast.error("Selecione um produto");
        return;
      }

      if (!formData.localOrigem) {
        toast.error("Selecione o local de origem");
        return;
      }

      if (!formData.localDestino) {
        toast.error("Selecione o local de destino");
        return;
      }

      if (formData.localOrigem === formData.localDestino) {
        toast.error("Os locais de origem e destino não podem ser iguais");
        return;
      }

      if (formData.quantidade <= 0) {
        toast.error("A quantidade deve ser maior que zero");
        return;
      }

      if (formData.quantidade > estoqueOrigem) {
        toast.error(
          `Quantidade insuficiente. Estoque disponível: ${estoqueOrigem}`
        );
        return;
      }

      try {
        setEnviando(true);

        const resposta = await api.post("/api/estoque/transferir", {
          ...formData,
          data: formData.data + "T12:00:00",
        });

        if (resposta.data.sucesso) {
          toast.success("Transferência realizada com sucesso!");

          // Resetar formulário
          setFormData({
            produto: "",
            localOrigem: "",
            localDestino: "",
            quantidade: 1,
            data: new Date().toISOString().split("T")[0],
            observacao: "",
          });
          setEstoqueOrigem(0);
          setProdutoSelecionado(null);
        } else {
          toast.error(resposta.data.mensagem || "Erro ao processar operação");
        }
      } catch (error) {
        console.error("Erro na operação:", error);
        toast.error(
          error.response?.data?.mensagem ||
            "Erro ao processar operação. Tente novamente."
        );
      } finally {
        setEnviando(false);
      }
    } else if (tipoMovimentacao === "entrada") {
      // Validações para entrada de estoque
      if (!formData.produto) {
        toast.error("Selecione um produto");
        return;
      }

      if (!formData.localOrigem) {
        toast.error("Selecione o local de entrada");
        return;
      }

      if (formData.quantidade <= 0) {
        toast.error("A quantidade deve ser maior que zero");
        return;
      }

      try {
        setEnviando(true);

        // Log para depuração
        console.log("Enviando dados para entrada de estoque:", {
          tipo: "entrada",
          produto: formData.produto,
          quantidade: parseInt(formData.quantidade),
          localOrigem: formData.localOrigem,
          data: formData.data + "T12:00:00",
          observacao: formData.observacao || "Entrada de estoque",
        });

        // Criar uma movimentação de entrada
        const resposta = await api.post("/api/movimentacoes", {
          tipo: "entrada",
          produto: formData.produto,
          quantidade: parseInt(formData.quantidade),
          localOrigem: formData.localOrigem,
          data: formData.data + "T12:00:00",
          observacao: formData.observacao || "Entrada de estoque",
        });

        if (resposta.data.sucesso) {
          toast.success("Entrada de estoque registrada com sucesso!");

          // Resetar formulário mas manter o produto se chegou por parâmetro
          setFormData({
            produto: produtoIdParam || "",
            localOrigem: "",
            localDestino: "",
            quantidade: 1,
            data: new Date().toISOString().split("T")[0],
            observacao: "",
          });
          setEstoqueOrigem(0);

          // Manter ou limpar produto selecionado com base em produtoIdParam
          if (!produtoIdParam) {
            setProdutoSelecionado(null);
          }
        } else {
          toast.error(resposta.data.mensagem || "Erro ao processar operação");
        }
      } catch (error) {
        console.error("Erro na operação:", error);
        toast.error(
          error.response?.data?.mensagem ||
            "Erro ao registrar entrada de estoque. Tente novamente."
        );
      } finally {
        setEnviando(false);
      }
    } else {
      // Validações para venda múltipla
      if (carrinhoProdutos.length === 0) {
        toast.error("Adicione ao menos um produto ao carrinho");
        return;
      }

      try {
        setEnviando(true);

        // Processar cada produto do carrinho
        const vendasPromises = carrinhoProdutos.map((item) =>
          api.post("/api/vendas", {
            produto: item.produto,
            local: item.localOrigem,
            quantidade: item.quantidade,
            data: formData.data + "T12:00:00",
            observacao: formData.observacao,
          })
        );

        // Executar todas as vendas em paralelo
        const resultados = await Promise.all(vendasPromises);

        // Verificar se todas foram bem-sucedidas
        const todasSucesso = resultados.every((res) => res.data.sucesso);

        if (todasSucesso) {
          toast.success(`${resultados.length} produtos vendidos com sucesso!`);

          // Limpar carrinho e formulário
          setCarrinhoProdutos([]);
          setFormData({
            produto: "",
            localOrigem: "",
            localDestino: "",
            quantidade: 1,
            data: new Date().toISOString().split("T")[0],
            observacao: "",
          });
        } else {
          toast.warning(
            "Algumas vendas podem não ter sido registradas corretamente"
          );
        }
      } catch (error) {
        console.error("Erro na operação de venda:", error);

        // Melhorar a mensagem de erro para ser mais específica
        const mensagemErro =
          error.response?.data?.mensagem ||
          "Erro ao processar vendas. Tente novamente.";
        toast.error(mensagemErro);

        // Log detalhado para debug
        if (error.response?.data) {
          console.log("Detalhes do erro:", error.response.data);
        }
      } finally {
        setEnviando(false);
      }
    }
  };

  if (carregando) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando dados...</p>
      </div>
    );
  }

  return (
    <div className="movimentacao-container">
      <h1 className="page-title">Movimentação de Estoque</h1>

      <div className="tipo-movimentacao">
        <button
          className={`tipo-btn ${
            tipoMovimentacao === "entrada" ? "active" : ""
          }`}
          onClick={() => handleChangeMovimentacao("entrada")}
        >
          <FaBoxes />
          <span>Adicionar Estoque</span>
        </button>

        <button
          className={`tipo-btn ${
            tipoMovimentacao === "transferencia" ? "active" : ""
          }`}
          onClick={() => handleChangeMovimentacao("transferencia")}
        >
          <FaExchangeAlt />
          <span>Transferência entre Locais</span>
        </button>

        <button
          className={`tipo-btn ${tipoMovimentacao === "venda" ? "active" : ""}`}
          onClick={() => handleChangeMovimentacao("venda")}
        >
          <FaBoxOpen />
          <span>Registrar Venda</span>
        </button>
      </div>

      <div className="card movimentacao-card">
        <h2>
          {tipoMovimentacao === "entrada"
            ? "Adicionar Estoque"
            : tipoMovimentacao === "transferencia"
            ? "Transferir Produto"
            : "Registrar Venda"}
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Seleção de Produto com Autocomplete */}
          <div className="produto-selecao">
            <h3>Seleção de Produto</h3>

            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}>
                <label htmlFor="produto">Produto *</label>
                <ProdutoSelect
                  id="produto"
                  name="produto"
                  value={formData.produto}
                  onChange={handleChange}
                  onProdutoChange={handleProdutoChange}
                  produtoSelecionado={produtoSelecionado}
                  placeholder="Buscar produto por nome ou código..."
                  disabled={Boolean(produtoIdParam && produtoSelecionado)}
                  required={tipoMovimentacao !== "venda"}
                />
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="localOrigem">
                {tipoMovimentacao === "entrada"
                  ? "Local de Entrada *"
                  : tipoMovimentacao === "transferencia"
                  ? "Local de Origem *"
                  : "Local de Saída *"}
              </label>
              <select
                id="localOrigem"
                name="localOrigem"
                value={formData.localOrigem}
                onChange={handleChange}
                required
              >
                <option value="">Selecione o local</option>
                {locais.map((local, index) => (
                  <option key={index} value={local}>
                    {local}
                  </option>
                ))}
              </select>
            </div>

            {tipoMovimentacao === "transferencia" && (
              <div className="form-group">
                <label htmlFor="localDestino">Local de Destino *</label>
                <select
                  id="localDestino"
                  name="localDestino"
                  value={formData.localDestino}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecione o local</option>
                  {locais.map((local, index) => (
                    <option
                      key={index}
                      value={local}
                      disabled={local === formData.localOrigem}
                    >
                      {local}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="quantidade">Quantidade *</label>
              <input
                type="number"
                id="quantidade"
                name="quantidade"
                value={formData.quantidade}
                onChange={handleChange}
                min="1"
                max={
                  tipoMovimentacao !== "entrada"
                    ? estoqueOrigem || undefined
                    : undefined
                }
                required
              />
              {estoqueOrigem > 0 && tipoMovimentacao !== "entrada" && (
                <small>Estoque disponível: {estoqueOrigem}</small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="data">Data *</label>
              <input
                type="date"
                id="data"
                name="data"
                value={formData.data}
                onChange={handleChange}
                max={new Date().toISOString().split("T")[0]}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="observacao">Observação</label>
            <textarea
              id="observacao"
              name="observacao"
              value={formData.observacao}
              onChange={handleChange}
              rows="3"
              placeholder="Adicione uma observação (opcional)"
            />
          </div>

          {/* Botão para adicionar ao carrinho (apenas modo venda) */}
          {tipoMovimentacao === "venda" && (
            <div className="add-to-cart">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={adicionarAoCarrinho}
                disabled={
                  !formData.produto ||
                  !formData.localOrigem ||
                  formData.quantidade <= 0
                }
              >
                <FaPlus /> Adicionar Produto ao Carrinho
              </button>
            </div>
          )}

          {/* Carrinho de produtos (apenas modo venda) */}
          {tipoMovimentacao === "venda" && (
            <div className="carrinho-container">
              <h3>
                <FaShoppingCart /> Produtos para Venda
              </h3>

              {carrinhoProdutos.length > 0 ? (
                <div className="carrinho-tabela">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Produto</th>
                        <th>Local</th>
                        <th>Qtd</th>
                        <th>Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {carrinhoProdutos.map((item, index) => (
                        <tr key={index}>
                          <td>{item.produtoId}</td>
                          <td>{item.produtoNome}</td>
                          <td>{item.localOrigem}</td>
                          <td>{item.quantidade}</td>
                          <td>
                            <button
                              type="button"
                              className="btn-icon btn-delete"
                              onClick={() => removerDoCarrinho(index)}
                            >
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="carrinho-sumario">
                    <p>
                      Total de produtos:{" "}
                      <strong>{carrinhoProdutos.length}</strong>
                    </p>
                    <p>
                      Total de itens:{" "}
                      <strong>
                        {carrinhoProdutos.reduce(
                          (sum, item) => sum + item.quantidade,
                          0
                        )}
                      </strong>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="carrinho-vazio">
                  <p>Nenhum produto adicionado ao carrinho</p>
                  <small>Adicione produtos para registrar a venda</small>
                </div>
              )}
            </div>
          )}

          {/* Resumo da movimentação e botão de envio */}
          <div className="movimentacao-resumo">
            {tipoMovimentacao === "transferencia" &&
              formData.produto &&
              formData.localOrigem &&
              produtoSelecionado && (
                <div className="resumo-card">
                  <h3>Resumo da Transferência</h3>

                  <div className="resumo-detalhes">
                    <p>
                      <strong>Produto:</strong> {produtoSelecionado.nome}
                    </p>
                    <p>
                      <strong>Quantidade:</strong> {formData.quantidade}
                    </p>

                    <div className="movimentacao-fluxo">
                      <div className="local-box">
                        <strong>Origem</strong>
                        <p>{formData.localOrigem}</p>
                      </div>

                      <FaArrowRight className="fluxo-seta" />

                      <div className="local-box">
                        <strong>Destino</strong>
                        <p>{formData.localDestino}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            {tipoMovimentacao === "entrada" &&
              formData.produto &&
              formData.localOrigem &&
              produtoSelecionado && (
                <div className="resumo-card entrada-card">
                  <h3>Resumo da Entrada de Estoque</h3>

                  <div className="resumo-detalhes">
                    <p>
                      <strong>Produto:</strong> {produtoSelecionado.nome}
                    </p>
                    <p>
                      <strong>Quantidade a adicionar:</strong>{" "}
                      {formData.quantidade}
                    </p>
                    <p>
                      <strong>Local de entrada:</strong> {formData.localOrigem}
                    </p>
                    <p>
                      <strong>Data:</strong>{" "}
                      {new Date(formData.data + "T12:00:00").toLocaleDateString(
                        "pt-BR"
                      )}
                    </p>
                    {formData.observacao && (
                      <p>
                        <strong>Observação:</strong> {formData.observacao}
                      </p>
                    )}
                  </div>
                </div>
              )}
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={
                enviando ||
                (tipoMovimentacao === "venda" && carrinhoProdutos.length === 0)
              }
            >
              {enviando ? (
                "Processando..."
              ) : (
                <>
                  <FaSave />
                  {tipoMovimentacao === "entrada"
                    ? "Registrar Entrada de Estoque"
                    : tipoMovimentacao === "transferencia"
                    ? "Concluir Transferência"
                    : "Registrar Venda"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Movimentacao;
