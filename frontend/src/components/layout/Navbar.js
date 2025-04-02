import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaWarehouse,
  FaBoxOpen,
  FaExchangeAlt,
  FaShoppingCart,
  FaFileAlt,
  FaUsers,
  FaSignOutAlt,
} from "react-icons/fa";
import AuthContext from "../../contexts/AuthContext";
import "./Navbar.css";

const Navbar = () => {
  const { usuario, logout, isAdmin } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Se o usuário não estiver autenticado, não exibe o menu
  if (!usuario) {
    return (
      <nav className="navbar">
        <div className="container">
          <Link to="/" className="navbar-logo">
            <FaWarehouse className="logo-icon" />
            <span>Estoque Fácil</span>
          </Link>
        </div>
      </nav>
    );
  }

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <Link to="/dashboard" className="navbar-logo">
          <FaWarehouse className="logo-icon" />
          <span>Estoque Fácil</span>
        </Link>

        <div className="navbar-menu">
          <Link to="/dashboard" className="navbar-item">
            <FaWarehouse />
            <span>Dashboard</span>
          </Link>
          <Link to="/produtos" className="navbar-item">
            <FaBoxOpen />
            <span>Produtos</span>
          </Link>
          <Link to="/movimentacao" className="navbar-item">
            <FaExchangeAlt />
            <span>Movimentação</span>
          </Link>
          <Link to="/historico" className="navbar-item">
            <FaShoppingCart />
            <span>Historico</span>
          </Link>
          <Link to="/relatorios" className="navbar-item">
            <FaFileAlt />
            <span>Relatórios</span>
          </Link>

          {isAdmin() && (
            <Link to="/gerenciamento" className="navbar-item">
              <FaUsers />
              <span>Gerenciamento</span>
            </Link>
          )}
        </div>

        <div className="user-info">
          <span className="username">{usuario.nome}</span>
          <button onClick={handleLogout} className="logout-btn">
            <FaSignOutAlt />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
