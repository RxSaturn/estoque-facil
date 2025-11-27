import React, { useState, useRef, useEffect, useCallback } from "react";
import { FaSearch, FaChevronDown, FaTimes } from "react-icons/fa";
import "./SearchableSelect.css";

/**
 * SearchableSelect - Componente de dropdown com busca
 * @param {Object} props
 * @param {string} props.id - ID do elemento
 * @param {string} props.name - Nome do campo para formulário
 * @param {string} props.value - Valor selecionado atualmente
 * @param {Function} props.onChange - Callback quando o valor muda
 * @param {Array} props.options - Array de opções (strings ou objetos {value, label})
 * @param {string} props.placeholder - Texto placeholder
 * @param {boolean} props.disabled - Se o campo está desabilitado
 * @param {string} props.emptyOptionLabel - Texto para a opção vazia (ex: "Todos")
 * @param {string} props.noResultsText - Texto quando não há resultados
 */
const SearchableSelect = ({
  id,
  name,
  value,
  onChange,
  options = [],
  placeholder = "Selecione...",
  disabled = false,
  emptyOptionLabel = "Todos",
  noResultsText = "Nenhum resultado encontrado",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Normalizar opções para o formato {value, label}
  const normalizedOptions = options.map((option) => {
    if (typeof option === "string") {
      return { value: option, label: option };
    }
    return option;
  });

  // Adicionar opção vazia no início
  const allOptions = [
    { value: "", label: emptyOptionLabel },
    ...normalizedOptions,
  ];

  // Filtrar opções baseado no termo de busca
  const filteredOptions = allOptions.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Encontrar o label do valor atual
  const selectedLabel =
    allOptions.find((opt) => opt.value === value)?.label || emptyOptionLabel;

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setSearchTerm("");
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll para o item destacado
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

  // Handlers
  const handleToggle = useCallback(() => {
    if (!disabled) {
      setIsOpen((prev) => !prev);
      if (!isOpen) {
        setSearchTerm("");
        setHighlightedIndex(-1);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    }
  }, [disabled, isOpen]);

  const handleSelect = useCallback(
    (optionValue) => {
      onChange({
        target: {
          name,
          value: optionValue,
        },
      });
      setIsOpen(false);
      setSearchTerm("");
      setHighlightedIndex(-1);
    },
    [name, onChange]
  );

  const handleClear = useCallback(
    (e) => {
      e.stopPropagation();
      onChange({
        target: {
          name,
          value: "",
        },
      });
      setSearchTerm("");
    },
    [name, onChange]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (!isOpen) {
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
          e.preventDefault();
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;
        case "Enter":
          e.preventDefault();
          if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
            handleSelect(filteredOptions[highlightedIndex].value);
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
    },
    [isOpen, highlightedIndex, filteredOptions, handleSelect]
  );

  return (
    <div
      ref={containerRef}
      className={`searchable-select ${isOpen ? "open" : ""} ${
        disabled ? "disabled" : ""
      }`}
      onKeyDown={handleKeyDown}
    >
      <div
        className="searchable-select-trigger"
        onClick={handleToggle}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={`${id}-listbox`}
        tabIndex={disabled ? -1 : 0}
      >
        <span className={`selected-value ${!value ? "placeholder" : ""}`}>
          {value ? selectedLabel : placeholder}
        </span>
        <div className="select-actions">
          {value && !disabled && (
            <button
              type="button"
              className="clear-btn"
              onClick={handleClear}
              aria-label="Limpar seleção"
            >
              <FaTimes />
            </button>
          )}
          <FaChevronDown
            className={`chevron-icon ${isOpen ? "rotated" : ""}`}
          />
        </div>
      </div>

      {isOpen && (
        <div className="searchable-select-dropdown" role="dialog">
          <div className="search-container">
            <FaSearch className="search-icon" />
            <input
              ref={inputRef}
              type="text"
              className="search-input"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setHighlightedIndex(0);
              }}
              aria-label="Buscar opções"
            />
          </div>

          <ul
            ref={listRef}
            id={`${id}-listbox`}
            className="options-list"
            role="listbox"
            aria-label={placeholder}
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <li
                  key={option.value || `empty-${index}`}
                  className={`option-item ${
                    option.value === value ? "selected" : ""
                  } ${highlightedIndex === index ? "highlighted" : ""}`}
                  onClick={() => handleSelect(option.value)}
                  role="option"
                  aria-selected={option.value === value}
                >
                  {option.label}
                </li>
              ))
            ) : (
              <li className="no-results">{noResultsText}</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
