const fs = require("fs");
const path = require("path");

/**
 * Exclui um arquivo do sistema de arquivos
 * @param {string} filePath - Caminho do arquivo a ser excluído
 * @returns {Object} Resultado da operação
 */
exports.excluirArquivo = (filePath) => {
  try {
    // Se o caminho for nulo ou indefinido, retornar erro
    if (!filePath) {
      return {
        sucesso: false,
        mensagem: "Caminho de arquivo inválido",
        erro: "INVALID_PATH",
      };
    }

    // Limpar o caminho (remover caracteres de consulta, etc.)
    const caminhoLimpo = filePath.split("?")[0];

    // Array de possíveis caminhos para tentar
    const possiveisCaminhos = [];

    // Baseado no seu feedback - caminho específico para backend/uploads
    if (caminhoLimpo.startsWith("/uploads/")) {
      // 1. Caminho relativo a partir de backend/uploads
      possiveisCaminhos.push(
        path.join("backend/uploads", caminhoLimpo.replace("/uploads/", ""))
      );

      // 2. Caminho absoluto construído a partir da raiz do projeto
      possiveisCaminhos.push(
        path.join(
          process.cwd(),
          "uploads",
          caminhoLimpo.replace("/uploads/", "")
        )
      );
    } else if (caminhoLimpo.includes("/uploads/")) {
      // Se contém /uploads/ em qualquer parte do caminho
      const partes = caminhoLimpo.split("/uploads/");
      possiveisCaminhos.push(path.join("backend/uploads", partes[1]));
      possiveisCaminhos.push(path.join(process.cwd(), "uploads", partes[1]));
    } else {
      // Se é apenas um nome de arquivo
      possiveisCaminhos.push(path.join("backend/uploads", caminhoLimpo));
      possiveisCaminhos.push(path.join(process.cwd(), "uploads", caminhoLimpo));
      possiveisCaminhos.push(caminhoLimpo); // Caminho literal como último recurso
    }

    // Também adicionar o caminho como foi fornecido
    if (!possiveisCaminhos.includes(caminhoLimpo)) {
      possiveisCaminhos.push(caminhoLimpo);
    }

    console.log(`Tentando excluir arquivo: ${caminhoLimpo}`);
    console.log(`Caminhos a tentar:`, possiveisCaminhos);

    // Tentar cada caminho possível até encontrar o arquivo
    for (const caminho of possiveisCaminhos) {
      console.log(`Verificando: ${caminho}`);

      if (fs.existsSync(caminho)) {
        // Excluir o arquivo
        fs.unlinkSync(caminho);
        console.log(`Arquivo excluído com sucesso: ${caminho}`);
        return {
          sucesso: true,
          mensagem: "Arquivo excluído com sucesso",
          caminho: caminho,
        };
      }
    }

    // Se chegou aqui, não encontrou o arquivo em nenhum dos caminhos
    console.log(`Arquivo não encontrado em nenhum dos caminhos tentados.`);
    return {
      sucesso: false,
      mensagem: "Arquivo não encontrado em nenhum caminho tentado",
      erro: "FILE_NOT_FOUND",
      caminhosTentados: possiveisCaminhos,
    };
  } catch (error) {
    console.error(`Erro ao excluir arquivo ${filePath}:`, error);
    return {
      sucesso: false,
      mensagem: `Erro ao excluir arquivo: ${error.message}`,
      erro: error,
    };
  }
};

/**
 * Exclui múltiplos arquivos do sistema de arquivos
 * @param {Array<string>} filePaths - Array com caminhos dos arquivos
 * @returns {Object} Resultado das operações
 */
exports.excluirArquivos = (filePaths) => {
  const resultado = {
    sucesso: true,
    arquivosExcluidos: [],
    erros: [],
  };

  if (!filePaths || !filePaths.length) {
    return { ...resultado, mensagem: "Nenhum arquivo para excluir" };
  }

  for (const filePath of filePaths) {
    const res = this.excluirArquivo(filePath);

    if (res.sucesso) {
      resultado.arquivosExcluidos.push(filePath);
    } else {
      resultado.erros.push({ path: filePath, erro: res.mensagem });
      // Não define sucesso como false porque queremos continuar mesmo se alguns arquivos falharem
    }
  }

  resultado.mensagem = `${resultado.arquivosExcluidos.length} arquivos excluídos com sucesso, ${resultado.erros.length} falhas`;

  return resultado;
};
