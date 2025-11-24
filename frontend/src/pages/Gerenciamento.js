import React, { useState } from "react";
import { FaUsers, FaWarehouse, FaExclamationTriangle } from "react-icons/fa";
import UsuariosTab from "../components/gerenciamento/UsuariosTab";
import LocaisTab from "../components/gerenciamento/LocaisTab";
import "./Gerenciamento.css";

const Gerenciamento = () => {
  const [activeTab, setActiveTab] = useState("usuarios");

  return (
    <div className="gerenciamento-container">
      <div className="page-header">
        <h1>Gerenciamento do Sistema</h1>
      </div>

      <div className="admin-notice">
        <FaExclamationTriangle className="notice-icon" />
        <span>
          Esta seção é destinada apenas a administradores. Alterações realizadas
          aqui afetam todo o sistema.
        </span>
      </div>

      <div className="tabs-container">
        <div className="tabs-header">
          <button
            className={`tab-button ${activeTab === "usuarios" ? "active" : ""}`}
            onClick={() => setActiveTab("usuarios")}
          >
            <FaUsers className="tab-icon" />
            <span>Usuários</span>
          </button>
          <button
            className={`tab-button ${activeTab === "locais" ? "active" : ""}`}
            onClick={() => setActiveTab("locais")}
          >
            <FaWarehouse className="tab-icon" />
            <span>Locais</span>
          </button>
        </div>

        <div className="tab-content">
          {activeTab === "usuarios" && <UsuariosTab />}
          {activeTab === "locais" && <LocaisTab />}
        </div>
      </div>
    </div>
  );
};

export default Gerenciamento;
