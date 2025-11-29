import React, { useState, useRef, useEffect, useCallback } from "react";
import { FaSearch, FaTimes, FaSpinner, FaBox } from "react-icons/fa";
import api from "../../services/api";
import "./ProdutoSelect.css";

/**
 * ProdutoSelect - Componente de autocomplete para seleção de produtos
 * Otimizado para buscar produtos conforme o usuário digita
 * 
 * @param {Object} props
 * @param {string} [props.id="produto-select"] - ID do elemento
 * @param {string} [props.name="produto"] - Nome do campo para formulário
 * @param {string} [props.value=""] - ID do produto selecionado
 * @param {Function} props.onChange - Callback quando um produto é selecionado
 * @param {Object} [props.selectedProduct=null] - Objeto do produto selecionado (opcional)
 * @param {Function} [props.onProductSelect] - Callback com o objeto completo do produto selecionado
 * @param {boolean} [props.disabled=false] - Se o campo está desabilitado
 * @param {string} [props.placeholder="Digite para buscar produtos..."] - Texto placeholder
 * @param {boolean} [props.required=false] - Se o campo é obrigatório
 * @param {number} [props.debounceMs=300] - Tempo de debounce em milissegundos.
 *        Valores recomendados: 200-500ms. Valores menores aumentam carga na API.
 * @param {number} [props.minSearchLength=2] - Número mínimo de caracteres para iniciar a busca.
 *        Pode ser ajustado para 1 em casos onde caracteres únicos são significativos.
 */
const ProdutoSelect = ({
  id = "produto-select",
  name = "produto",
  value = "",
  onChange,
  selectedProduct = null,
  onProductSelect,
  disabled = false,
  placeholder = "Digite para buscar produtos...",
  required = false,
  debounceMs = 300,
  minSearchLength = 2,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [options, setOptions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [selectedOption, setSelectedOption] = useState(selectedProduct);
  
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const debounceRef = useRef(null);

  // Sync selectedOption with selectedProduct prop
  useEffect(() => {
    if (selectedProduct) {
      setSelectedOption(selectedProduct);
    }
  }, [selectedProduct]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll to highlighted option
  useEffect(() => {
    if (listRef.current && highlightedIndex >= 0) {
      const highlightedItem = listRef.current.children[highlightedIndex];
      if (highlightedItem) {
        highlightedItem.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [highlightedIndex]);

  // Search products with debounce
  const searchProducts = useCallback(async (query) => {
    if (!query || query.trim().length < minSearchLength) {
      setOptions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.get("/api/produtos/buscar", {
        params: { q: query.trim(), limit: 20 },
      });

      if (response.data.sucesso && response.data.produtos) {
        setOptions(response.data.produtos);
      } else {
        setOptions([]);
      }
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      setOptions([]);
    } finally {
      setIsLoading(false);
    }
  }, [minSearchLength]);

  // Handle search term change with debounce
  const handleSearchChange = useCallback((e) => {
    const query = e.target.value;
    setSearchTerm(query);
    setHighlightedIndex(-1);
    
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new debounce
    debounceRef.current = setTimeout(() => {
      searchProducts(query);
    }, debounceMs);
  }, [searchProducts, debounceMs]);

  // Handle product selection
  const handleSelect = useCallback((product) => {
    setSelectedOption(product);
    setSearchTerm("");
    setOptions([]);
    setIsOpen(false);
    setHighlightedIndex(-1);

    // Call onChange with the product ID (for form compatibility)
    if (onChange) {
      onChange({
        target: {
          name,
          value: product._id,
        },
      });
    }

    // Call onProductSelect with full product object
    if (onProductSelect) {
      onProductSelect(product);
    }
  }, [name, onChange, onProductSelect]);

  // Clear selection
  const handleClear = useCallback((e) => {
    e.stopPropagation();
    setSelectedOption(null);
    setSearchTerm("");
    setOptions([]);
    setHighlightedIndex(-1);

    if (onChange) {
      onChange({
        target: {
          name,
          value: "",
        },
      });
    }

    if (onProductSelect) {
      onProductSelect(null);
    }

    // Focus input after clearing
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [name, onChange, onProductSelect]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!isOpen && options.length === 0) {
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
          prev < options.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && options[highlightedIndex]) {
          handleSelect(options[highlightedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
      default:
        break;
    }
  }, [isOpen, options, highlightedIndex, handleSelect]);

  // Handle input focus
  const handleFocus = useCallback(() => {
    if (!disabled) {
      setIsOpen(true);
      if (searchTerm.length >= minSearchLength && options.length === 0) {
        searchProducts(searchTerm);
      }
    }
  }, [disabled, searchTerm, minSearchLength, options.length, searchProducts]);

  // Get stock status
  const getStockStatus = (estoque) => {
    if (estoque === 0) return { class: "out-of-stock", label: "Esgotado" };
    if (estoque <= 5) return { class: "critical", label: "Crítico" };
    if (estoque <= 20) return { class: "low", label: "Baixo" };
    return { class: "available", label: "Disponível" };
  };

  return (
    <div
      ref={containerRef}
      className={`produto-select ${isOpen ? "open" : ""} ${disabled ? "disabled" : ""}`}
    >
      {/* Selected Product Display */}
      {selectedOption ? (
        <div className="produto-select-selected">
          <div className="selected-product-info">
            <FaBox className="product-icon" />
            <div className="product-details">
              <span className="product-id">{selectedOption.id}</span>
              <span className="product-name">{selectedOption.nome}</span>
            </div>
            {selectedOption.estoque !== undefined && (
              <span className={`stock-badge ${getStockStatus(selectedOption.estoque).class}`}>
                {selectedOption.estoque} un.
              </span>
            )}
          </div>
          {!disabled && (
            <button
              type="button"
              className="clear-btn"
              onClick={handleClear}
              aria-label="Limpar seleção"
            >
              <FaTimes />
            </button>
          )}
        </div>
      ) : (
        /* Search Input */
        <div className="produto-select-input-wrapper">
          <FaSearch className="search-icon" />
          <input
            ref={inputRef}
            id={id}
            type="text"
            className="produto-select-input"
            value={searchTerm}
            onChange={handleSearchChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            required={required && !value}
            autoComplete="off"
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-controls={`${id}-listbox`}
          />
          {isLoading && <FaSpinner className="loading-icon spin" />}
        </div>
      )}

      {/* Dropdown Options */}
      {isOpen && !selectedOption && (
        <div className="produto-select-dropdown">
          {isLoading ? (
            <div className="dropdown-loading">
              <FaSpinner className="spin" />
              <span>Buscando produtos...</span>
            </div>
          ) : options.length > 0 ? (
            <ul
              ref={listRef}
              id={`${id}-listbox`}
              className="options-list"
              role="listbox"
              aria-label="Produtos"
            >
              {options.map((product, index) => {
                const stockStatus = getStockStatus(product.estoque);
                return (
                  <li
                    key={product._id}
                    className={`option-item ${highlightedIndex === index ? "highlighted" : ""}`}
                    onClick={() => handleSelect(product)}
                    role="option"
                    aria-selected={highlightedIndex === index}
                  >
                    <div className="option-content">
                      <div className="option-main">
                        <span className="option-id">{product.id}</span>
                        <span className="option-name">{product.nome}</span>
                      </div>
                      <div className={`option-stock ${stockStatus.class}`}>
                        <span className="stock-value">{product.estoque}</span>
                        <span className="stock-label">un.</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : searchTerm.length >= minSearchLength ? (
            <div className="dropdown-empty">
              <span>Nenhum produto encontrado</span>
            </div>
          ) : searchTerm.length > 0 ? (
            <div className="dropdown-hint">
              <span>Digite pelo menos {minSearchLength} caractere{minSearchLength !== 1 ? 's' : ''} para buscar</span>
            </div>
          ) : (
            <div className="dropdown-hint">
              <span>Digite o nome ou código do produto</span>
            </div>
          )}
        </div>
      )}

      {/* Hidden input for form submission */}
      <input type="hidden" name={name} value={value || ""} />
    </div>
  );
};

export default ProdutoSelect;
