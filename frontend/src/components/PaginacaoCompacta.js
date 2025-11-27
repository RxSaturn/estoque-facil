import React, { useState, useEffect, useCallback } from "react";
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
  const loadUserPrefs = useCallback(() => {
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
      // Silently handle localStorage errors
    }

    return {
      currentPage: 1,
      itemsPerPage: itemsPerPage,
    };
  }, [pageName, itemsPerPage]);

  const [prefs, setPrefs] = useState(loadUserPrefs);
  const currentPage = prefs.currentPage;
  const currentItemsPerPage = prefs.itemsPerPage;

  // Calcular total de páginas
  const totalPages = Math.max(1, Math.ceil(totalItems / currentItemsPerPage));

  // Atualizar quando preferências mudam no localStorage (cross-tab sync)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === `paginacao_${pageName}`) {
        setPrefs(loadUserPrefs());
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [pageName, loadUserPrefs]);

  // Manipuladores de eventos
  const changePage = useCallback((page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      const newPrefs = { ...prefs, currentPage: page };
      setPrefs(newPrefs);
      try {
        localStorage.setItem(`paginacao_${pageName}`, JSON.stringify(newPrefs));
      } catch (error) {
        // Silently handle localStorage errors
      }
      onPageChange(page);
    }
  }, [totalPages, currentPage, prefs, pageName, onPageChange]);

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
