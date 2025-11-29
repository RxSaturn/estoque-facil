import React, { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight, FaAngleDoubleLeft, FaAngleDoubleRight } from 'react-icons/fa';
import './Paginacao.css';

const Paginacao = ({ 
  totalItems, 
  onPageChange, 
  onItemsPerPageChange,
  pageName, // identificador único para persistência
  pagina // prop externa para sincronizar a página atual
}) => {
  const itemsPerPageOptions = [10, 20, 30, 50];
  
  // Carregar preferências do usuário do localStorage
  const loadUserPrefs = () => {
    try {
      const savedPrefs = localStorage.getItem(`paginacao_${pageName}`);
      if (savedPrefs) {
        return JSON.parse(savedPrefs);
      }
    } catch (error) {
      console.error('Erro ao carregar preferências de paginação:', error);
    }
    
    return {
      currentPage: 1,
      itemsPerPage: 20 // valor padrão
    };
  };
  
  const [prefs, setPrefs] = useState(loadUserPrefs());
  const { currentPage, itemsPerPage } = prefs;
  
  // Sincronizar com prop externa quando ela mudar (ex: ao filtrar)
  useEffect(() => {
    if (pagina !== undefined && pagina !== currentPage) {
      setPrefs(prev => ({ ...prev, currentPage: pagina }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagina]);
  
  // Calcular total de páginas
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  
  // Persistir preferências quando mudarem
  useEffect(() => {
    try {
      localStorage.setItem(`paginacao_${pageName}`, JSON.stringify(prefs));
    } catch (error) {
      console.error('Erro ao salvar preferências de paginação:', error);
    }
  }, [prefs, pageName]);
  

  
  // Retornar à primeira página quando tamanho da página muda
  useEffect(() => {
    if (currentPage > totalPages) {
      setPrefs(prev => ({ ...prev, currentPage: Math.max(1, totalPages) }));
    }
  }, [totalPages, currentPage]);
  
  // Manipuladores de eventos - chamam callbacks diretamente para evitar loops
  const changePage = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setPrefs(prev => ({ ...prev, currentPage: page }));
      // Chamar callback apenas quando página realmente mudar
      onPageChange(page);
    }
  };
  
  const changeItemsPerPage = (e) => {
    const newItemsPerPage = parseInt(e.target.value, 10);
    if (newItemsPerPage !== itemsPerPage) {
      setPrefs({ currentPage: 1, itemsPerPage: newItemsPerPage });
      // Notificar componente pai das mudanças
      onItemsPerPageChange(newItemsPerPage);
      onPageChange(1); // Voltar para primeira página
    }
  };
  
  // Gerar números de página para exibição
  const getPageNumbers = () => {
    let pages = [];
    
    // Para 7 ou menos páginas, mostrar todas
    if (totalPages <= 7) {
      pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else {
      // Para muitas páginas, mostrar algumas com elipses
      if (currentPage <= 3) {
        pages = [1, 2, 3, 4, '...', totalPages - 1, totalPages];
      } else if (currentPage >= totalPages - 2) {
        pages = [1, 2, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
      } else {
        pages = [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
      }
    }
    
    return pages;
  };
  
  return (
    <div className="paginacao-container">
      <div className="paginacao-info">
        <span>
          Mostrando {Math.min(totalItems, (currentPage - 1) * itemsPerPage + 1)} a {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} itens
        </span>
      </div>
      
      <div className="paginacao-controles">
        <div className="paginacao-botoes">
          {/* Primeira página */}
          <button 
            onClick={() => changePage(1)} 
            disabled={currentPage === 1}
            className="paginacao-btn"
            title="Primeira página"
            type="button"
          >
            <FaAngleDoubleLeft />
          </button>
          
          {/* Página anterior */}
          <button 
            onClick={() => changePage(currentPage - 1)} 
            disabled={currentPage === 1}
            className="paginacao-btn"
            title="Página anterior"
            type="button"
          >
            <FaChevronLeft />
          </button>
          
          {/* Números de página */}
          <div className="paginacao-numeros">
            {getPageNumbers().map((page, index) => (
              <React.Fragment key={index}>
                {page === '...' ? (
                  <span className="paginacao-elipses">...</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => changePage(page)}
                    className={`paginacao-numero ${currentPage === page ? 'active' : ''}`}
                  >
                    {page}
                  </button>
                )}
              </React.Fragment>
            ))}
          </div>
          
          {/* Próxima página */}
          <button 
            onClick={() => changePage(currentPage + 1)} 
            disabled={currentPage === totalPages}
            className="paginacao-btn"
            title="Próxima página"
            type="button"
          >
            <FaChevronRight />
          </button>
          
          {/* Última página */}
          <button 
            onClick={() => changePage(totalPages)} 
            disabled={currentPage === totalPages}
            className="paginacao-btn"
            title="Última página"
            type="button"
          >
            <FaAngleDoubleRight />
          </button>
        </div>
        
        <div className="itens-por-pagina">
          <label htmlFor={`itemsPerPage_${pageName}`}>Itens por página:</label>
          <select 
            id={`itemsPerPage_${pageName}`}
            value={itemsPerPage} 
            onChange={changeItemsPerPage}
          >
            {itemsPerPageOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default Paginacao;
