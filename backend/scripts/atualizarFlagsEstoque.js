require('dotenv').config();
const mongoose = require('mongoose');
const Produto = require('../models/Produto');
const Estoque = require('../models/Estoque');
const EstoqueService = require('../services/EstoqueService');

async function atualizarFlagsEstoque() {
  try {
    // Conexão com o MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/estoque-facil', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Conectado ao MongoDB');
    console.log('Iniciando atualização de flags de estoque...');
    
    const resultado = await EstoqueService.atualizarFlagsEstoque();
    
    if (resultado.sucesso) {
      console.log('Flags de estoque atualizadas com sucesso!');
      console.log(`- Produtos com estoque baixo: ${resultado.produtosAtualizados.baixo}`);
      console.log(`- Produtos com estoque crítico: ${resultado.produtosAtualizados.critico}`);
      console.log(`- Produtos com estoque esgotado: ${resultado.produtosAtualizados.esgotado}`);
    } else {
      console.error('Erro ao atualizar flags de estoque:', resultado.erro);
    }
  } catch (error) {
    console.error('Erro durante a execução do script:', error);
  } finally {
    // Desconectar do MongoDB
    await mongoose.disconnect();
    console.log('Desconectado do MongoDB');
    process.exit(0);
  }
}

// Executar o script
atualizarFlagsEstoque();