import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  // Verificar se o usuário está autenticado ao carregar a aplicação
  useEffect(() => {
    const verificarUsuario = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setCarregando(false);
        return;
      }
      
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      try {
        const resposta = await api.get('/api/auth/verificar');
        
        if (resposta.data.sucesso) {
          setUsuario(resposta.data.usuario);
        } else {
          localStorage.removeItem('token');
          api.defaults.headers.common['Authorization'] = '';
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        localStorage.removeItem('token');
        api.defaults.headers.common['Authorization'] = '';
      }
      
      setCarregando(false);
    };
    
    verificarUsuario();
  }, []);

  // Função para realizar login
  const login = async (email, senha) => {
    try {
      setErro(null);
      const resposta = await api.post('/api/auth/login', { email, senha });
      
      if (resposta.data.sucesso) {
        localStorage.setItem('token', resposta.data.token);
        api.defaults.headers.common['Authorization'] = `Bearer ${resposta.data.token}`;
        setUsuario(resposta.data.usuario);
        return true;
      } else {
        setErro(resposta.data.mensagem || 'Erro ao fazer login');
        return false;
      }
    } catch (error) {
      setErro(error.response?.data?.mensagem || 'Erro ao fazer login');
      return false;
    }
  };

  // Função para realizar logout
  const logout = () => {
    localStorage.removeItem('token');
    api.defaults.headers.common['Authorization'] = '';
    setUsuario(null);
  };

  // Função para registrar um novo usuário
  const registrar = async (nome, email, senha) => {
    try {
      setErro(null);
      const resposta = await api.post('/api/auth/registro', { nome, email, senha });
      
      if (resposta.data.sucesso) {
        localStorage.setItem('token', resposta.data.token);
        api.defaults.headers.common['Authorization'] = `Bearer ${resposta.data.token}`;
        setUsuario(resposta.data.usuario);
        return true;
      } else {
        setErro(resposta.data.mensagem || 'Erro ao registrar usuário');
        return false;
      }
    } catch (error) {
      setErro(error.response?.data?.mensagem || 'Erro ao registrar usuário');
      return false;
    }
  };

  // Verificar se o usuário é administrador
  const isAdmin = () => {
    return usuario?.perfil === 'admin';
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        carregando,
        erro,
        login,
        logout,
        registrar,
        isAdmin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;