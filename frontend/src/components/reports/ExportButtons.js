/**
 * ExportButtons - Componente de botões de exportação
 */

import React, { memo } from 'react';
import { FaFilePdf, FaFileCsv, FaDownload, FaSpinner } from 'react-icons/fa';
import './ExportButtons.css';

const ExportButtons = memo(({ 
  onExportPDF, 
  onExportCSV, 
  loadingPDF = false, 
  loadingCSV = false,
  disabled = false 
}) => {
  return (
    <div className="export-buttons">
      <h4>Exportar Relatório</h4>
      <div className="export-buttons-group">
        <button
          type="button"
          className="btn-export btn-export-pdf"
          onClick={onExportPDF}
          disabled={disabled || loadingPDF}
        >
          {loadingPDF ? (
            <>
              <FaSpinner className="spin" />
              Gerando PDF...
            </>
          ) : (
            <>
              <FaFilePdf />
              Exportar PDF
            </>
          )}
        </button>

        <button
          type="button"
          className="btn-export btn-export-csv"
          onClick={onExportCSV}
          disabled={disabled || loadingCSV}
        >
          {loadingCSV ? (
            <>
              <FaSpinner className="spin" />
              Gerando CSV...
            </>
          ) : (
            <>
              <FaFileCsv />
              Exportar CSV
            </>
          )}
        </button>
      </div>
      <p className="export-hint">
        <FaDownload /> O PDF inclui gráficos e formatação completa. 
        O CSV é ideal para análise em planilhas.
      </p>
    </div>
  );
});

ExportButtons.displayName = 'ExportButtons';

export default ExportButtons;
