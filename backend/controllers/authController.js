const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

// Gerar token JWT
const gerarToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Controller para login
exports.login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    // Verificar se email e senha foram fornecidos
    if (!email || !senha) {
      return res.status(400).json({ 
        sucesso: false, 
        mensagem: 'Por favor, informe e-mail e senha' 
      });
    }

    // Verificar se o usuário existe
    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(401).json({ 
        sucesso: false, 
        mensagem: 'E-mail ou senha inválidos' 
      });
    }

    // Verificar se a senha está correta
    const senhaCorreta = await usuario.verificarSenha(senha);
    if (!senhaCorreta) {
      return res.status(401).json({ 
        sucesso: false, 
        mensagem: 'E-mail ou senha inválidos' 
      });
    }

    // Gerar token e retornar usuário logado
    res.status(200).json({
      sucesso: true,
      token: gerarToken(usuario._id),
      usuario: {
        id: usuario._id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ 
      sucesso: false, 
      mensagem: 'Erro ao realizar login. Tente novamente mais tarde.' 
    });
  }
};

// Controller para registro de novo usuário
exports.registro = async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    // Verificar se todos os campos foram fornecidos
    if (!nome || !email || !senha) {
      return res.status(400).json({ 
        sucesso: false, 
        mensagem: 'Por favor, preencha todos os campos obrigatórios' 
      });
    }

    // Verificar se o usuário já existe
    const usuarioExistente = await Usuario.findOne({ email });
    if (usuarioExistente) {
      return res.status(400).json({ 
        sucesso: false, 
        mensagem: 'Este e-mail já está sendo utilizado' 
      });
    }

    // Criar novo usuário
    const novoUsuario = await Usuario.create({
      nome,
      email,
      senha,
      perfil: 'funcionario' // Perfil padrão para novos usuários
    });

    // Gerar token e retornar novo usuário
    res.status(201).json({
      sucesso: true,
      token: gerarToken(novoUsuario._id),
      usuario: {
        id: novoUsuario._id,
        nome: novoUsuario.nome,
        email: novoUsuario.email,
        perfil: novoUsuario.perfil
      }
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ 
      sucesso: false, 
      mensagem: 'Erro ao registrar usuário. Tente novamente mais tarde.' 
    });
  }
};

// Verificar usuário atual
exports.verificarUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id).select('-senha');
    if (!usuario) {
      return res.status(404).json({ 
        sucesso: false, 
        mensagem: 'Usuário não encontrado' 
      });
    }

    res.status(200).json({
      sucesso: true,
      usuario: {
        id: usuario._id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil
      }
    });
  } catch (error) {
    console.error('Erro ao verificar usuário:', error);
    res.status(500).json({ 
      sucesso: false, 
      mensagem: 'Erro ao verificar usuário. Tente novamente mais tarde.' 
    });
  }
};