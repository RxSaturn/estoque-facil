import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaWarehouse, FaLock, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import api from '../services/api';
import { toast } from 'react-toastify';
import './Login.css'; // Reutilizar os estilos da página de login

const RedefinirSenha = () => {
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [redefinindo, setRedefinindo] = useState(false);
  const [tokenValido, setTokenValido] = useState(false);
  const [concluido, setConcluido] = useState(false);
  const [erro, setErro] = useState(null);
  
  const { token } = useParams();
  const navigate = useNavigate();
  
  // Validar token ao carregar a página
  useEffect(() => {
    const validarToken = async () => {
      try {
        setCarregando(true);
        setErro(null);
        
        const response = await api.get(`/api/recuperacao-senha/validar/${token}`);
        
        if (response.data.sucesso) {
          setTokenValido(true);
        } else {
          setErro(response.data.mensagem || 'Token inválido ou expirado');
        }
      } catch (error) {
        console.error('Erro ao validar token:', error);
        setErro('Token inválido ou expirado');
      } finally {
        setCarregando(false);
      }
    };
    
    if (token) {
      validarToken();
    }
  }, [token]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar senhas
    if (!senha || senha.length < 6) {
      return toast.error('A senha deve ter pelo menos 6 caracteres');
    }
    
    if (senha !== confirmarSenha) {
      return toast.error('As senhas não coincidem');
    }
    
    try {
      setRedefinindo(true);
      
      const response = await api.post(`/api/recuperacao-senha/redefinir/${token}`, {
        senha,
        confirmarSenha
      });
      
      if (response.data.sucesso) {
        setConcluido(true);
        toast.success('Senha redefinida com sucesso!');
      } else {
        setErro(response.data.mensagem || 'Erro ao redefinir senha');
      }
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      toast.error(error.response?.data?.mensagem || 'Erro ao redefinir senha');
    } finally {
      setRedefinindo(false);
    }
  };
  
  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <FaWarehouse className="login-logo" />
          <h2>Estoque Fácil</h2>
          <p>Redefinição de Senha</p>
        </div>
        
        {carregando ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Verificando link de recuperação...</p>
          </div>
        ) : erro ? (
          <div className="error-container">
            <FaExclamationTriangle className="error-icon" />
            <h3>Link Inválido</h3>
            <p>{erro}</p>
            <p>O link pode ter expirado ou já foi utilizado.</p>
            <button 
              className="btn-login" 
              onClick={() => navigate('/login')}
            >
              Voltar para Login
            </button>
          </div>
        ) : concluido ? (
          <div className="success-container">
            <FaCheckCircle className="success-icon" />
            <h3>Senha Redefinida</h3>
            <p>Sua senha foi redefinida com sucesso!</p>
            <button 
              className="btn-login" 
              onClick={() => navigate('/login')}
            >
              Ir para Login
            </button>
          </div>
        ) : tokenValido ? (
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="senha">
                <FaLock className="input-icon" />
                Nova Senha
              </label>
              <input
                type="password"
                id="senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite sua nova senha"
                minLength="6"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmarSenha">
                <FaLock className="input-icon" />
                Confirmar Senha
              </label>
              <input
                type="password"
                id="confirmarSenha"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Confirme sua nova senha"
                minLength="6"
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="btn-login"
              disabled={redefinindo}
            >
              {redefinindo ? 'Redefinindo...' : 'Redefinir Senha'}
            </button>
          </form>
        ) : (
          <div className="error-container">
            <FaExclamationTriangle className="error-icon" />
            <h3>Link Inválido</h3>
            <p>O link de recuperação é inválido.</p>
            <button 
              className="btn-login" 
              onClick={() => navigate('/login')}
            >
              Voltar para Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RedefinirSenha;