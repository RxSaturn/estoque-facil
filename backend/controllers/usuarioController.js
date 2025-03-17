const Usuario = require('../models/Usuario');

// Listar todos os usuários
exports.listarUsuarios = async (req, res) => {
  try {
    // Excluir senha dos resultados
    const usuarios = await Usuario.find().select('-senha');
    
    res.status(200).json(usuarios);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao listar usuários'
    });
  }
};

// Criar novo usuário
exports.criarUsuario = async (req, res) => {
  try {
    const { nome, email, senha, perfil } = req.body;
    
    // Verificar se o email já está em uso
    const usuarioExistente = await Usuario.findOne({ email });
    
    if (usuarioExistente) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Este e-mail já está em uso'
      });
    }
    
    // Criar o usuário
    const novoUsuario = await Usuario.create({
      nome,
      email,
      senha,
      perfil: perfil || 'funcionario'
    });
    
    // Retornar usuário sem a senha
    const usuarioSemSenha = {
      _id: novoUsuario._id,
      nome: novoUsuario.nome,
      email: novoUsuario.email,
      perfil: novoUsuario.perfil,
      dataCriacao: novoUsuario.dataCriacao
    };
    
    res.status(201).json({
      sucesso: true,
      usuario: usuarioSemSenha
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao criar usuário'
    });
  }
};

// Atualizar usuário
exports.atualizarUsuario = async (req, res) => {
  try {
    const { nome, email, perfil, senha } = req.body;
    
    // Verificar se o usuário existe
    const usuario = await Usuario.findById(req.params.id);
    
    if (!usuario) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Usuário não encontrado'
      });
    }
    
    // Verificar se o email está sendo alterado e se já está em uso
    if (email !== usuario.email) {
      const emailExistente = await Usuario.findOne({ email });
      
      if (emailExistente) {
        return res.status(400).json({
          sucesso: false,
          mensagem: 'Este e-mail já está em uso'
        });
      }
    }
    
    // Atualizar dados
    usuario.nome = nome || usuario.nome;
    usuario.email = email || usuario.email;
    usuario.perfil = perfil || usuario.perfil;
    
    // Se a senha foi fornecida, atualizá-la
    if (senha) {
      usuario.senha = senha;
    }
    
    await usuario.save();
    
    // Retornar usuário sem a senha
    const usuarioAtualizado = {
      _id: usuario._id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      dataCriacao: usuario.dataCriacao
    };
    
    res.status(200).json({
      sucesso: true,
      usuario: usuarioAtualizado
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao atualizar usuário'
    });
  }
};

// Alterar senha de usuário
exports.alterarSenha = async (req, res) => {
  try {
    const { senha } = req.body;
    
    if (!senha || senha.length < 6) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'A senha deve ter pelo menos 6 caracteres'
      });
    }
    
    // Verificar se o usuário existe
    const usuario = await Usuario.findById(req.params.id);
    
    if (!usuario) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Usuário não encontrado'
      });
    }
    
    // Atualizar a senha
    usuario.senha = senha;
    await usuario.save();
    
    res.status(200).json({
      sucesso: true,
      mensagem: 'Senha alterada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao alterar senha'
    });
  }
};

// Remover usuário
exports.removerUsuario = async (req, res) => {
  try {
    // Verificar se o usuário existe
    const usuario = await Usuario.findById(req.params.id);
    
    if (!usuario) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Usuário não encontrado'
      });
    }
    
    // Não permitir que o usuário remova a si mesmo
    if (req.usuario.id === req.params.id) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Você não pode remover seu próprio usuário'
      });
    }
    
    await Usuario.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      sucesso: true,
      mensagem: 'Usuário removido com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover usuário:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao remover usuário'
    });
  }
};