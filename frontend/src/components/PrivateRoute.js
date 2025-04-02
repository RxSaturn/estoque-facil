import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from '../contexts/AuthContext';

// Componente para proteger rotas que necessitam de autenticação
const PrivateRoute = ({ component: Component, adminOnly = false }) => {
  const { usuario, carregando, isAdmin } = useContext(AuthContext);

  // Enquanto verifica autenticação, exibe um loading
  if (carregando) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando...</p>
      </div>
    );
  }

  // Se não estiver autenticado, redireciona para o login
  if (!usuario) {
    return <Navigate to="/login" />;
  }

  // Se a rota for apenas para admin e o usuário não for admin, redireciona
  if (adminOnly && !isAdmin()) {
    return <Navigate to="/dashboard" />;
  }

  // Se estiver autenticado e tiver permissão, renderiza o componente
  return <Component />;
};

export default PrivateRoute;