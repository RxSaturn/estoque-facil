import React, { useState, useRef, useEffect, useCallback } from "react";
import { FaSearch, FaTimes, FaSpinner, FaBoxOpen } from "react-icons/fa";
import api from "../../services/api";
import "./ProdutoSelect.css";

/**
 * ProdutoSelect - Search-as-you-type product selection component
 * Replaces standard <select> with autocomplete functionality
 * 
 * @param {Object} props
 * @param {string} props.id - ID do elemento
 * @param {string} props.name - Nome do campo para formulário
 * @param {string} props.value - ID do produto selecionado (_id do MongoDB)
 * @param {Function} props.onChange - Callback quando o valor muda
 * @param {string} props.placeholder - Texto placeholder
 * @param {boolean} props.disabled - Se o campo está desabilitado
 * @param {boolean} props.required - Se o campo é obrigatório
 * @param {Object} props.produtoSelecionado - Objeto do produto selecionado (opcional, para exibição inicial)
 * @param {Function} props.onProdutoChange - Callback com objeto completo do produto selecionado
 */
const ProdutoSelect = ({
  id,
  name,
  value,
  onChange,
  placeholder = "Buscar produto por nome ou código...",
  disabled = false,
  required = false,
  produtoSelecionado: produtoInicialProp = null,
  onProdutoChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [produtoSelecionado, setProdutoSelecionado] = useState(produtoInicialProp);
  
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Sync with external produtoSelecionado prop
  useEffect(() => {
    if (produtoInicialProp) {
      setProdutoSelecionado(produtoInicialProp);
    }
  }, [produtoInicialProp]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll to highlighted item
  useEffect(() => {
    if (listRef.current && highlightedIndex >= 0) {
      const highlightedItem = listRef.current.children[highlightedIndex];
      if (highlightedItem) {
        highlightedItem.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }, [highlightedIndex]);

  // Search products with debounce
  const buscarProdutos = useCallback(async (termo) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!termo || termo.length < 1) {
      setProdutos([]);
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        setCarregando(true);
        const response = await api.get("/api/produtos/buscar", {
          params: { q: termo, limite: 20 },
        });
        
        if (response.data.sucesso && response.data.produtos) {
          setProdutos(response.data.produtos);
        } else {
          setProdutos([]);
        }
      } catch (error) {
        console.error("Erro ao buscar produtos:", error);
        setProdutos([]);
      } finally {
        setCarregando(false);
      }
    }, 300); // 300ms debounce
  }, []);

  // Effect to search when term changes
  useEffect(() => {
    if (isOpen) {
      buscarProdutos(searchTerm);
    }
    
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchTerm, isOpen, buscarProdutos]);

  // Handle input focus
  const handleFocus = useCallback(() => {
    if (!disabled) {
      setIsOpen(true);
      setHighlightedIndex(-1);
    }
  }, [disabled]);

  // Handle search input change
  const handleSearchChange = useCallback((e) => {
    const termo = e.target.value;
    setSearchTerm(termo);
    setHighlightedIndex(-1);
    if (!isOpen) {
      setIsOpen(true);
    }
  }, [isOpen]);

  // Handle product selection
  const handleSelect = useCallback((produto) => {
    setProdutoSelecionado(produto);
    
    // Notify parent via onChange (simulates native event)
    onChange({
      target: {
        name,
        value: produto._id,
      },
    });
    
    // Notify parent with full product object
    if (onProdutoChange) {
      onProdutoChange(produto);
    }
    
    setIsOpen(false);
    setSearchTerm("");
    setHighlightedIndex(-1);
  }, [name, onChange, onProdutoChange]);

  // Handle clear selection
  const handleClear = useCallback((e) => {
    e.stopPropagation();
    setProdutoSelecionado(null);
    
    onChange({
      target: {
        name,
        value: "",
      },
    });
    
    if (onProdutoChange) {
      onProdutoChange(null);
    }
    
    setSearchTerm("");
    setProdutos([]);
    
    // Focus input after clear
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [name, onChange, onProdutoChange]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < produtos.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && produtos[highlightedIndex]) {
          handleSelect(produtos[highlightedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setSearchTerm("");
        setHighlightedIndex(-1);
        break;
      default:
        break;
    }
  }, [isOpen, highlightedIndex, produtos, handleSelect]);

  return (
    <div
      ref={containerRef}
      className={`produto-select ${isOpen ? "open" : ""} ${disabled ? "disabled" : ""}`}
    >
      {/* Selected product display */}
      {produtoSelecionado && !isOpen ? (
        <div className="produto-select-selected" onClick={() => !disabled && setIsOpen(true)}>
          <div className="produto-select-info">
            {produtoSelecionado.imagemUrl && (
              <img
                src={produtoSelecionado.imagemUrl}
                alt={produtoSelecionado.nome}
                className="produto-select-img"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            )}
            <div className="produto-select-details">
              <span className="produto-select-nome">{produtoSelecionado.nome}</span>
              <span className="produto-select-id">{produtoSelecionado.id}</span>
            </div>
          </div>
          {!disabled && (
            <button
              type="button"
              className="produto-select-clear"
              onClick={handleClear}
              aria-label="Limpar seleção"
            >
              <FaTimes />
            </button>
          )}
        </div>
      ) : (
        /* Search input */
        <div className="produto-select-search">
          <FaSearch className="produto-select-search-icon" />
          <input
            ref={inputRef}
            id={id}
            type="text"
            className="produto-select-input"
            placeholder={placeholder}
            value={searchTerm}
            onChange={handleSearchChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            required={required && !value}
            autoComplete="off"
          />
          {carregando && (
            <FaSpinner className="produto-select-loading" />
          )}
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="produto-select-dropdown">
          {carregando ? (
            <div className="produto-select-loading-container">
              <FaSpinner className="spinner" />
              <span>Buscando produtos...</span>
            </div>
          ) : produtos.length > 0 ? (
            <ul
              ref={listRef}
              className="produto-select-list"
              role="listbox"
              aria-label="Produtos"
            >
              {produtos.map((produto, index) => (
                <li
                  key={produto._id}
                  className={`produto-select-item ${
                    highlightedIndex === index ? "highlighted" : ""
                  } ${value === produto._id ? "selected" : ""}`}
                  onClick={() => handleSelect(produto)}
                  role="option"
                  aria-selected={value === produto._id}
                >
                  <div className="produto-item-content">
                    {produto.imagemUrl ? (
                      <img
                        src={produto.imagemUrl}
                        alt={produto.nome}
                        className="produto-item-img"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling && (e.target.nextSibling.style.display = 'flex');
                        }}
                      />
                    ) : null}
                    <div className="produto-item-placeholder" style={{ display: produto.imagemUrl ? 'none' : 'flex' }}>
                      <FaBoxOpen />
                    </div>
                    <div className="produto-item-details">
                      <span className="produto-item-nome">{produto.nome}</span>
                      <div className="produto-item-meta">
                        <span className="produto-item-id">{produto.id}</span>
                        <span className="produto-item-categoria">
                          {produto.tipo} - {produto.categoria}
                        </span>
                      </div>
                    </div>
                    <div className="produto-item-estoque">
                      <span className={`estoque-badge ${produto.estoque <= 0 ? "sem-estoque" : produto.estoque <= 10 ? "estoque-baixo" : ""}`}>
                        {produto.estoque} un
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : searchTerm.length > 0 ? (
            <div className="produto-select-empty">
              <FaBoxOpen className="empty-icon" />
              <span>Nenhum produto encontrado</span>
              <small>Tente outro termo de busca</small>
            </div>
          ) : (
            <div className="produto-select-hint">
              <FaSearch className="hint-icon" />
              <span>Digite para buscar produtos</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProdutoSelect;
