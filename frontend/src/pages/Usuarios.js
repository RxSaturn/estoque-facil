import React, { useState, useEffect, useContext } from 'react';
import { FaUser, FaUserCog, FaUserPlus, FaEdit, FaTrash, FaLock } from 'react-icons/fa';
import api from '../services/api';
import AuthContext from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import './Usuarios.css';

const Usuarios = () => {
  const { usuario: usuarioLogado } = useContext(AuthContext);
  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmaSenha: '',
    perfil: 'funcionario'
  });
  
  const [modoSenha, setModoSenha] = useState(false);
  const [enviando, setEnviando] = useState(false);
  
  useEffect(() => {
    const carregarUsuarios = async () => {
      try {
        setCarregando(true);
        const resposta = await api.get('/api/usuarios');
        setUsuarios(resposta.data);
        setCarregando(false);
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        toast.error('Erro ao carregar usuários. Tente novamente.');
        setCarregando(false);
      }
    };
    
    carregarUsuarios();
  }, []);

  const abrirModal = (usuario = null, modoSenhaAtivo = false) => {
    if (usuario) {
      // Modo edição
      setUsuarioSelecionado(usuario);
      setFormData({
        nome: usuario.nome,
        email: usuario.email,
        senha: '',
        confirmaSenha: '',
        perfil: usuario.perfil
      });
    } else {
      // Modo criação
      setUsuarioSelecionado(null);
      setFormData({
        nome: '',
        email: '',
        senha: '',
        confirmaSenha: '',
        perfil: 'funcionario'
      });
    }
    
    setModoSenha(modoSenhaAtivo);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setUsuarioSelecionado(null);
    setModoSenha(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validarForm = () => {
    if (!formData.nome || !formData.email) {
      toast.error('Nome e e-mail são obrigatórios');
      return false;
    }
    
    if (!usuarioSelecionado || modoSenha) {
      if (!formData.senha) {
        toast.error('Senha é obrigatória');
        return false;
      }
      
      if (formData.senha !== formData.confirmaSenha) {
        toast.error('As senhas não coincidem');
        return false;
      }
      
      if (formData.senha.length < 6) {
        toast.error('A senha deve ter pelo menos 6 caracteres');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarForm()) return;
    
    try {
      setEnviando(true);
      
      if (modoSenha) {
        // Alteração de senha
        await api.put(`/api/usuarios/${usuarioSelecionado._id}/senha`, {
          senha: formData.senha
        });
        
        toast.success('Senha alterada com sucesso!');
      } else if (usuarioSelecionado) {
        // Edição de usuário
        const dadosAtualizacao = {
          nome: formData.nome,
          email: formData.email,
          perfil: formData.perfil
        };
        
        // Adicionar senha apenas se estiver preenchida
        if (formData.senha) {
          dadosAtualizacao.senha = formData.senha;
        }
        
        await api.put(`/api/usuarios/${usuarioSelecionado._id}`, dadosAtualizacao);
        
        // Atualizar lista de usuários
        setUsuarios(usuarios.map(u => 
          u._id === usuarioSelecionado._id ? { ...u, nome: formData.nome, email: formData.email, perfil: formData.perfil } : u
        ));
        
        toast.success('Usuário atualizado com sucesso!');
      } else {
        // Criação de usuário
        const resposta = await api.post('/api/usuarios', formData);
        
        // Adicionar novo usuário à lista
        setUsuarios([...usuarios, resposta.data.usuario]);
        
        toast.success('Usuário criado com sucesso!');
      }
      
      fecharModal();
    } catch (error) {
      console.error('Erro na operação de usuário:', error);
      toast.error(error.response?.data?.mensagem || 'Erro na operação. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  const confirmarExclusao = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário? Esta ação não poderá ser desfeita.')) {
      try {
        await api.delete(`/api/usuarios/${id}`);
        
        // Atualizar lista de usuários
        setUsuarios(usuarios.filter(u => u._id !== id));
        
        toast.success('Usuário excluído com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        toast.error(error.response?.data?.mensagem || 'Erro ao excluir usuário. Tente novamente.');
      }
    }
  };

  if (carregando) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando usuários...</p>
      </div>
    );
  }

  return (
    <div className="usuarios-container">
      <div className="page-header">
        <h1>Gerenciar Usuários</h1>
        <button 
          className="btn btn-primary"
          onClick={() => abrirModal()}
        >
          <FaUserPlus /> Adicionar Usuário
        </button>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="usuarios-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Perfil</th>
                <th>Data de Criação</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.length > 0 ? (
                usuarios.map(usuario => (
                  <tr key={usuario._id}>
                    <td>
                      <div className="usuario-info">
                        <div className="usuario-avatar">
                          {usuario.perfil === 'admin' ? <FaUserCog /> : <FaUser />}
                        </div>
                        <span className="usuario-nome">{usuario.nome}</span>
                      </div>
                    </td>
                    <td>{usuario.email}</td>
                    <td>
                      <span className={`badge ${usuario.perfil === 'admin' ? 'badge-admin' : 'badge-funcionario'}`}>
                        {usuario.perfil === 'admin' ? 'Administrador' : 'Funcionário'}
                      </span>
                    </td>
                    <td>{new Date(usuario.dataCriacao).toLocaleDateString('pt-BR')}</td>
                    <td>
                      <div className="acoes-btns">
                        <button 
                          onClick={() => abrirModal(usuario)} 
                          className="btn-icon btn-edit"
                          title="Editar usuário"
                        >
                          <FaEdit />
                        </button>
                        <button 
                          onClick={() => abrirModal(usuario, true)} 
                          className="btn-icon btn-senha"
                          title="Alterar senha"
                        >
                          <FaLock />
                        </button>
                        {usuarioLogado._id !== usuario._id && (
                          <button 
                            onClick={() => confirmarExclusao(usuario._id)} 
                            className="btn-icon btn-delete"
                            title="Excluir usuário"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="no-data">Nenhum usuário encontrado</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Edição/Criação/Senha */}
      {modalAberto && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>
              {modoSenha ? 'Alterar Senha' : 
               usuarioSelecionado ? 'Editar Usuário' : 'Adicionar Usuário'}
            </h3>
            
            <form onSubmit={handleSubmit}>
              {!modoSenha && (
                <>
                  <div className="form-group">
                    <label htmlFor="nome">Nome</label>
                    <input
                      type="text"
                      id="nome"
                      name="nome"
                      value={formData.nome}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="email">E-mail</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="perfil">Perfil</label>
                    <select
                      id="perfil"
                      name="perfil"
                      value={formData.perfil}
                      onChange={handleChange}
                      required
                    >
                      <option value="funcionario">Funcionário</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                </>
              )}
              
              {(!usuarioSelecionado || modoSenha) && (
                <>
                  <div className="form-group">
                    <label htmlFor="senha">Senha</label>
                    <input
                      type="password"
                      id="senha"
                      name="senha"
                      value={formData.senha}
                      onChange={handleChange}
                      required
                      minLength="6"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="confirmaSenha">Confirmar Senha</label>
                    <input
                      type="password"
                      id="confirmaSenha"
                      name="confirmaSenha"
                      value={formData.confirmaSenha}
                      onChange={handleChange}
                      required
                      minLength="6"
                    />
                  </div>
                </>
              )}
              
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
                  disabled={enviando}
                >
                  {enviando ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Usuarios;