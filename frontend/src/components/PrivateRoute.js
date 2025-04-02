import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import AuthContext from '../contexts/AuthContext'; // Updated import

const PrivateRoute = ({ component: Component, adminOnly = false }) => {
  const { usuario, carregando, isAdmin } = useContext(AuthContext);

  if (carregando) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando...</p>
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }

  return Component ? <Component /> : <Outlet />;
};

export default PrivateRoute;
