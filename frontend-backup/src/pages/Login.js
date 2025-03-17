import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaWarehouse, FaEnvelope, FaLock, FaUser } from 'react-icons/fa';
import AuthContext from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import './Login.css';

const Login = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [modo, setModo] = useState('login'); // 'login' ou 'registro'
  
  const { usuario, login, registrar, erro } = useContext(AuthContext);
  const navigate = useNavigate();

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (usuario) {
      navigate('/dashboard');
    }
  }, [usuario, navigate]);

  // Exibir erro quando ocorrer
  useEffect(() => {
    if (erro) {
      toast.error(erro);
    }
  }, [erro]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (modo === 'login') {
      // Validar campos
      if (!email || !senha) {
        return toast.error('Por favor, preencha todos os campos');
      }
      
      const sucesso = await login(email, senha);
      if (sucesso) {
        toast.success('Login realizado com sucesso!');
        navigate('/dashboard');
      }
    } else {
      // Validar campos
      if (!nome || !email || !senha) {
        return toast.error('Por favor, preencha todos os campos');
      }
      
      if (senha.length < 6) {
        return toast.error('A senha deve ter pelo menos 6 caracteres');
      }
      
      const sucesso = await registrar(nome, email, senha);
      if (sucesso) {
        toast.success('Conta criada com sucesso!');
        navigate('/dashboard');
      }
    }
  };

  const alternarModo = () => {
    setModo(modo === 'login' ? 'registro' : 'login');
    // Limpar os campos ao alternar
    setNome('');
    setEmail('');
    setSenha('');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <FaWarehouse className="login-logo" />
          <h2>Estoque Fácil</h2>
          <p>{modo === 'login' ? 'Entre na sua conta' : 'Crie sua conta'}</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {modo === 'registro' && (
            <div className="form-group">
              <label htmlFor="nome">
                <FaUser className="input-icon" />
                Nome
              </label>
              <input
                type="text"
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Digite seu nome completo"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">
              <FaEnvelope className="input-icon" />
              E-mail
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Digite seu e-mail"
            />
          </div>

          <div className="form-group">
            <label htmlFor="senha">
              <FaLock className="input-icon" />
              Senha
            </label>
            <input
              type="password"
              id="senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Digite sua senha"
            />
          </div>

          <button type="submit" className="btn-login">
            {modo === 'login' ? 'Entrar' : 'Cadastrar'}
          </button>
        </form>

        <div className="login-footer">
          {modo === 'login' ? (
            <p>
              Não tem uma conta?{' '}
              <button className="link-button" onClick={alternarModo}>
                Cadastre-se
              </button>
            </p>
          ) : (
            <p>
              Já tem uma conta?{' '}
              <button className="link-button" onClick={alternarModo}>
                Entre aqui
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;