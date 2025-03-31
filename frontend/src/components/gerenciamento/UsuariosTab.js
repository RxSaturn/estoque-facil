import React, { useState, useEffect, useCallback } from "react";
import {
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaUser,
  FaUserTie,
  FaKey,
  FaFilter,
  FaTimes,
  FaExclamationTriangle,
  FaUserCog,
} from "react-icons/fa";
import api from "../../services/api";
import { toast } from "react-toastify";
import Paginacao from "../Paginacao";
import "./UsuariosTab.css";
import "./shared-styles.css";

const UsuariosTab = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [busca, setBusca] = useState("");
  const [filtroAvancado, setFiltroAvancado] = useState(false);

  // Estado para paginação
  const [paginacao, setPaginacao] = useState({
    currentPage: 1,
    itemsPerPage: 20,
    totalItems: 0,
  });

  // Estados para filtros
  const [filtros, setFiltros] = useState({
    perfil: "",
  });

  // Estados para modal de formulário
  const [modalAberto, setModalAberto] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
    perfil: "funcionario",
  });
  const [modoEdicao, setModoEdicao] = useState(false);
  const [usuarioAtual, setUsuarioAtual] = useState(null);

  // Estado para modal de senha
  const [modalSenhaAberto, setModalSenhaAberto] = useState(false);
  const [formSenha, setFormSenha] = useState({
    senha: "",
    confirmarSenha: "",
  });

  // Estado para modal de confirmação de exclusão
  const [modalExclusaoAberto, setModalExclusaoAberto] = useState(false);
  const [usuarioExcluir, setUsuarioExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(false);
  const [erroExclusao, setErroExclusao] = useState(null);

  // Função para carregar lista de usuários
  const carregarUsuarios = useCallback(async () => {
    try {
      setCarregando(true);
      setErro(null);

      // Construir parâmetros de consulta
      const params = {
        page: paginacao.currentPage,
        limit: paginacao.itemsPerPage,
        busca: busca || undefined,
        perfil: filtros.perfil || undefined,
      };

      const response = await api.get("/api/usuarios", { params });

      setUsuarios(response.data.usuarios || response.data);

      // Verificar formato da resposta para paginação
      if (response.data.total !== undefined) {
        setPaginacao((prev) => ({
          ...prev,
          totalItems: response.data.total,
        }));
      } else {
        setPaginacao((prev) => ({
          ...prev,
          totalItems: response.data.length || 0,
        }));
      }
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      setErro("Não foi possível carregar a lista de usuários");
      toast.error("Erro ao carregar usuários. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }, [paginacao.currentPage, paginacao.itemsPerPage, busca, filtros]);

  // Carregar usuários na montagem e quando os filtros mudarem
  useEffect(() => {
    carregarUsuarios();
  }, [carregarUsuarios]);

  // Funções de paginação
  const handlePageChange = useCallback((page) => {
    setPaginacao((prev) => ({ ...prev, currentPage: page }));
  }, []);

  const handleItemsPerPageChange = useCallback((itemsPerPage) => {
    setPaginacao((prev) => ({ ...prev, itemsPerPage, currentPage: 1 }));
  }, []);

  // Funções de busca e filtro
  const handleBuscaChange = (e) => {
    setBusca(e.target.value);
  };

  const aplicarBusca = () => {
    setPaginacao((prev) => ({ ...prev, currentPage: 1 }));
    carregarUsuarios();
  };

  const handleChangeFiltro = (e) => {
    const { name, value } = e.target;
    setFiltros((prev) => ({ ...prev, [name]: value }));
    setPaginacao((prev) => ({ ...prev, currentPage: 1 }));
  };

  const limparFiltros = () => {
    setBusca("");
    setFiltros({
      perfil: "",
    });
    setPaginacao((prev) => ({ ...prev, currentPage: 1 }));
  };

  // Funções para o modal de formulário
  const abrirModalCriarUsuario = () => {
    setFormData({
      nome: "",
      email: "",
      senha: "",
      perfil: "funcionario",
    });
    setModoEdicao(false);
    setUsuarioAtual(null);
    setModalAberto(true);
  };

  const abrirModalEditarUsuario = (usuario) => {
    setFormData({
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      senha: "", // Não incluir senha na edição
    });
    setModoEdicao(true);
    setUsuarioAtual(usuario);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setFormData({
      nome: "",
      email: "",
      senha: "",
      perfil: "funcionario",
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();

    // Validar campos
    if (!formData.nome.trim() || !formData.email.trim()) {
      toast.error("Nome e e-mail são obrigatórios");
      return;
    }

    // Validar e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Por favor, insira um e-mail válido");
      return;
    }

    // Validar senha se for criação
    if (!modoEdicao && (!formData.senha || formData.senha.length < 6)) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    try {
      setCarregando(true);

      if (modoEdicao && usuarioAtual) {
        // Atualizar usuário existente (sem senha)
        const dadosAtualizacao = {
          nome: formData.nome,
          email: formData.email,
          perfil: formData.perfil,
        };

        await api.put(`/api/usuarios/${usuarioAtual._id}`, dadosAtualizacao);
        toast.success("Usuário atualizado com sucesso!");
      } else {
        // Criar novo usuário
        await api.post("/api/usuarios", formData);
        toast.success("Usuário criado com sucesso!");
      }

      // Fechar modal e recarregar dados
      fecharModal();
      carregarUsuarios();
    } catch (error) {
      console.error("Erro ao salvar usuário:", error);
      toast.error(error.response?.data?.mensagem || "Erro ao salvar usuário");
    } finally {
      setCarregando(false);
    }
  };

  // Funções para o modal de alteração de senha
  const abrirModalSenha = (usuario) => {
    setUsuarioAtual(usuario);
    setFormSenha({
      senha: "",
      confirmarSenha: "",
    });
    setModalSenhaAberto(true);
  };

  const fecharModalSenha = () => {
    setModalSenhaAberto(false);
    setUsuarioAtual(null);
    setFormSenha({
      senha: "",
      confirmarSenha: "",
    });
  };

  const handleSenhaChange = (e) => {
    const { name, value } = e.target;
    setFormSenha((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitSenha = async (e) => {
    e.preventDefault();

    // Validar senhas
    if (!formSenha.senha || formSenha.senha.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (formSenha.senha !== formSenha.confirmarSenha) {
      toast.error("As senhas não coincidem");
      return;
    }

    try {
      setCarregando(true);

      await api.put(`/api/usuarios/${usuarioAtual._id}/senha`, {
        senha: formSenha.senha,
      });

      toast.success("Senha alterada com sucesso!");
      fecharModalSenha();
    } catch (error) {
      console.error("Erro ao alterar senha:", error);
      toast.error(error.response?.data?.mensagem || "Erro ao alterar senha");
    } finally {
      setCarregando(false);
    }
  };

  // Funções para exclusão de usuário
  const confirmarExclusao = (usuario) => {
    setUsuarioExcluir(usuario);
    setModalExclusaoAberto(true);
    setErroExclusao(null);
  };

  const cancelarExclusao = () => {
    setUsuarioExcluir(null);
    setModalExclusaoAberto(false);
    setErroExclusao(null);
    setExcluindo(false);
  };

  const excluirUsuario = async () => {
    if (!usuarioExcluir) return;

    try {
      setExcluindo(true);

      await api.delete(`/api/usuarios/${usuarioExcluir._id}`);

      toast.success("Usuário removido com sucesso!");
      cancelarExclusao();
      carregarUsuarios();
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);

      // Mensagem de erro melhorada
      const mensagemErro =
        error.response?.data?.mensagem || "Erro ao excluir usuário";
      setErroExclusao(mensagemErro);
      toast.error(mensagemErro);
    } finally {
      setExcluindo(false);
    }
  };

  // Função para obter texto legível do perfil
  const getNomePerfil = (perfil) => {
    switch (perfil) {
      case "admin":
        return "Administrador";
      case "funcionario":
        return "Funcionário";
      default:
        return perfil;
    }
  };

  // Função para formatar data
  const formatarData = (data) => {
    if (!data) return "-";

    try {
      const date = new Date(data);
      return date.toLocaleDateString("pt-BR");
    } catch (error) {
      return "-";
    }
  };

  return (
    <div className="usuarios-tab">
      <div className="tab-header">
        <h2>Gerenciamento de Usuários</h2>
        <button className="btn btn-primary" onClick={abrirModalCriarUsuario}>
          <FaPlus /> Novo Usuário
        </button>
      </div>

      {/* Barra de busca e filtros */}
      <div className="search-filter-container">
        <div className="search-box">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Buscar usuários por nome ou e-mail..."
              value={busca}
              onChange={handleBuscaChange}
              onKeyPress={(e) => e.key === "Enter" && aplicarBusca()}
            />
            <button className="search-button" onClick={aplicarBusca}>
              <FaSearch />
            </button>
          </div>
        </div>

        <div className="filter-controls">
          <button
            type="button"
            className={`btn btn-outline filter-btn ${
              filtroAvancado ? "active" : ""
            }`}
            onClick={() => setFiltroAvancado(!filtroAvancado)}
          >
            <FaFilter />{" "}
            {filtroAvancado ? "Ocultar Filtros" : "Mostrar Filtros"}
          </button>

          {(busca || filtros.perfil) && (
            <button
              type="button"
              className="btn btn-outline clear-btn"
              onClick={limparFiltros}
            >
              <FaTimes /> Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Filtros avançados */}
      {filtroAvancado && (
        <div className="advanced-filters">
          <div className="filter-row">
            <div className="filter-group">
              <label>Perfil</label>
              <select
                name="perfil"
                value={filtros.perfil}
                onChange={handleChangeFiltro}
              >
                <option value="">Todos</option>
                <option value="admin">Administradores</option>
                <option value="funcionario">Funcionários</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tabela de usuários */}
      {carregando && usuarios.length === 0 ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando usuários...</p>
        </div>
      ) : erro ? (
        <div className="error-container">
          <FaExclamationTriangle className="error-icon" />
          <p>{erro}</p>
        </div>
      ) : usuarios.length === 0 ? (
        <div className="empty-state">
          <FaUser className="empty-icon" />
          <h3>Nenhum usuário encontrado</h3>
          <p>
            {busca || filtros.perfil
              ? "Tente ajustar os filtros para ver mais resultados."
              : "Comece adicionando um novo usuário ao sistema."}
          </p>
          <button className="btn btn-primary" onClick={abrirModalCriarUsuario}>
            <FaPlus /> Adicionar Usuário
          </button>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="data-table usuarios-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Perfil</th>
                  <th>Data de Registro</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((usuario) => (
                  <tr
                    key={usuario._id}
                    className={usuario.perfil === "admin" ? "admin-row" : ""}
                  >
                    <td className="nome-usuario">{usuario.nome}</td>
                    <td>{usuario.email}</td>
                    <td className="perfil-cell">
                      <span
                        className={`perfil-badge ${
                          usuario.perfil === "admin" ? "admin" : "funcionario"
                        }`}
                      >
                        {getNomePerfil(usuario.perfil)}
                      </span>
                    </td>
                    <td>{formatarData(usuario.dataCriacao)}</td>
                    <td className="acoes-cell">
                      <div className="acoes-cell-container">
                        <button
                          onClick={() => abrirModalSenha(usuario)}
                          className="btn btn-sm btn-outline"
                          title="Alterar senha"
                        >
                          <FaKey />
                        </button>
                        <button
                          onClick={() => abrirModalEditarUsuario(usuario)}
                          className="btn btn-sm btn-secondary"
                          title="Editar usuário"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => confirmarExclusao(usuario)}
                          className="btn btn-sm btn-danger"
                          title="Excluir usuário"
                          disabled={
                            usuario.perfil === "admin" &&
                            usuarios.filter((u) => u.perfil === "admin")
                              .length <= 1
                          }
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Componente de Paginação */}
          <Paginacao
            totalItems={paginacao.totalItems}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            pageName="gerenciamento_usuarios"
          />
        </>
      )}

      {/* Modal para criar/editar usuário */}
      {modalAberto && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>
              {modoEdicao ? (
                <>
                  <FaUserCog className="modal-icon" /> Editar Usuário
                </>
              ) : (
                <>
                  <FaUserTie className="modal-icon" /> Novo Usuário
                </>
              )}
            </h3>

            <form onSubmit={handleSubmitForm}>
              <div className="form-group">
                <label htmlFor="nome">Nome Completo *</label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleFormChange}
                  required
                  placeholder="Ex: João Silva"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">E-mail *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  required
                  placeholder="Ex: joao@exemplo.com"
                />
              </div>

              {!modoEdicao && (
                <div className="form-group">
                  <label htmlFor="senha">Senha *</label>
                  <input
                    type="password"
                    id="senha"
                    name="senha"
                    value={formData.senha}
                    onChange={handleFormChange}
                    required={!modoEdicao}
                    minLength="6"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="perfil">Perfil *</label>
                <select
                  id="perfil"
                  name="perfil"
                  value={formData.perfil}
                  onChange={handleFormChange}
                  required
                >
                  <option value="funcionario">Funcionário</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={fecharModal}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={carregando}
                >
                  {carregando ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para alterar senha */}
      {modalSenhaAberto && usuarioAtual && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>
              <FaKey className="modal-icon" /> Alterar Senha
            </h3>
            <p className="modal-subtitle">
              Alterando senha de <strong>{usuarioAtual.nome}</strong>
            </p>

            <form onSubmit={handleSubmitSenha}>
              <div className="form-group">
                <label htmlFor="senha">Nova Senha *</label>
                <input
                  type="password"
                  id="senha"
                  name="senha"
                  value={formSenha.senha}
                  onChange={handleSenhaChange}
                  required
                  minLength="6"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmarSenha">Confirmar Senha *</label>
                <input
                  type="password"
                  id="confirmarSenha"
                  name="confirmarSenha"
                  value={formSenha.confirmarSenha}
                  onChange={handleSenhaChange}
                  required
                  minLength="6"
                  placeholder="Repita a senha"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={fecharModalSenha}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={carregando}
                >
                  {carregando ? "Salvando..." : "Alterar Senha"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      {modalExclusaoAberto && usuarioExcluir && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Confirmar Exclusão</h3>

            <div className="exclusao-info">
              <p>
                <strong>Usuário:</strong> {usuarioExcluir.nome}
              </p>
              <p>
                <strong>E-mail:</strong> {usuarioExcluir.email}
              </p>
              <p>
                <strong>Perfil:</strong> {getNomePerfil(usuarioExcluir.perfil)}
              </p>

              <div className="exclusao-aviso">
                <FaExclamationTriangle className="aviso-icon" />
                <p>
                  Esta ação não poderá ser desfeita. O histórico de ações deste
                  usuário será mantido, mas ele não poderá mais acessar o
                  sistema.
                </p>

                {erroExclusao && (
                  <div className="erro-exclusao">
                    <p>{erroExclusao}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={cancelarExclusao}
                disabled={excluindo}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={excluirUsuario}
                disabled={excluindo}
              >
                {excluindo ? (
                  <>
                    <span className="spinner-tiny"></span>
                    Excluindo...
                  </>
                ) : (
                  "Confirmar Exclusão"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsuariosTab;
