import React, { useState, useEffect } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "./PaginacaoCompacta.css";

/**
 * PaginacaoCompacta - Versão compacta do componente de paginação
 * Apenas botões de navegação e indicador de página atual
 */
const PaginacaoCompacta = ({
  totalItems,
  onPageChange,
  itemsPerPage = 20,
  pageName,
}) => {
  // Carregar preferências do usuário do localStorage
  const loadUserPrefs = () => {
    try {
      const savedPrefs = localStorage.getItem(`paginacao_${pageName}`);
      if (savedPrefs) {
        const parsed = JSON.parse(savedPrefs);
        return {
          currentPage: parsed.currentPage || 1,
          itemsPerPage: parsed.itemsPerPage || itemsPerPage,
        };
      }
    } catch (error) {
      console.error("Erro ao carregar preferências de paginação:", error);
    }

    return {
      currentPage: 1,
      itemsPerPage: itemsPerPage,
    };
  };

  const [prefs, setPrefs] = useState(loadUserPrefs());
  const currentPage = prefs.currentPage;
  const currentItemsPerPage = prefs.itemsPerPage;

  // Calcular total de páginas
  const totalPages = Math.max(1, Math.ceil(totalItems / currentItemsPerPage));

  // Atualizar quando preferências mudam no localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      setPrefs(loadUserPrefs());
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageName]);

  // Sincronizar com o estado do localStorage
  useEffect(() => {
    const interval = setInterval(() => {
      const newPrefs = loadUserPrefs();
      if (
        newPrefs.currentPage !== prefs.currentPage ||
        newPrefs.itemsPerPage !== prefs.itemsPerPage
      ) {
        setPrefs(newPrefs);
      }
    }, 500);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs, pageName]);

  // Manipuladores de eventos
  const changePage = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      const newPrefs = { ...prefs, currentPage: page };
      setPrefs(newPrefs);
      try {
        localStorage.setItem(`paginacao_${pageName}`, JSON.stringify(newPrefs));
      } catch (error) {
        console.error("Erro ao salvar preferências:", error);
      }
      onPageChange(page);
    }
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="paginacao-compacta">
      <button
        onClick={() => changePage(currentPage - 1)}
        disabled={currentPage === 1}
        className="paginacao-compacta-btn"
        title="Página anterior"
        type="button"
      >
        <FaChevronLeft />
      </button>

      <span className="paginacao-compacta-info">
        Página {currentPage} de {totalPages}
      </span>

      <button
        onClick={() => changePage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="paginacao-compacta-btn"
        title="Próxima página"
        type="button"
      >
        <FaChevronRight />
      </button>
    </div>
  );
};

export default PaginacaoCompacta;
