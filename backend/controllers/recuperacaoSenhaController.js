const Usuario = require('../models/Usuario');
const PasswordReset = require('../models/PasswordReset');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Configuração do transporter do nodemailer (ajuste conforme seu provedor de e-mail)
const transporter = nodemailer.createTransport({
  service: 'gmail', // Use seu serviço de e-mail preferido
  auth: {
    user: process.env.EMAIL_USER, // Configure no .env
    pass: process.env.EMAIL_PASS  // Configure no .env
  }
});

// Solicitar recuperação de senha
exports.solicitarRecuperacao = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'E-mail é obrigatório'
      });
    }
    
    // Verificar se o usuário existe
    const usuario = await Usuario.findOne({ email });
    
    if (!usuario) {
      // Por segurança, não informamos que o usuário não existe
      return res.status(200).json({
        sucesso: true,
        mensagem: 'Se o e-mail estiver cadastrado, você receberá instruções para recuperar sua senha'
      });
    }
    
    // Gerar token aleatório
    const token = crypto.randomBytes(20).toString('hex');
    
    // Salvar token no banco
    await PasswordReset.create({
      usuario: usuario._id,
      token: token
    });
    
    // URL do frontend para redefinição de senha
    const resetURL = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/redefinir-senha/${token}`;
    
    // Enviar e-mail
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: usuario.email,
      subject: 'Estoque Fácil - Recuperação de Senha',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Recuperação de Senha</h2>
          <p>Olá, ${usuario.nome}!</p>
          <p>Recebemos uma solicitação para redefinir sua senha. Se você não solicitou esta alteração, ignore este e-mail.</p>
          <p>Para redefinir sua senha, clique no botão abaixo:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetURL}" style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Redefinir Senha</a>
          </div>
          <p>O link é válido por 1 hora e pode ser usado apenas uma vez.</p>
          <p>Se o botão não funcionar, copie e cole o seguinte link no seu navegador:</p>
          <p>${resetURL}</p>
          <p style="margin-top: 30px; font-size: 12px; color: #7f8c8d;">Este é um e-mail automático, por favor não responda.</p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    
    return res.status(200).json({
      sucesso: true,
      mensagem: 'Se o e-mail estiver cadastrado, você receberá instruções para recuperar sua senha'
    });
    
  } catch (error) {
    console.error('Erro ao solicitar recuperação de senha:', error);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao processar a solicitação de recuperação de senha'
    });
  }
};

// Validar token de recuperação
exports.validarToken = async (req, res) => {
  try {
    const { token } = req.params;
    
    // Buscar token no banco
    const resetToken = await PasswordReset.findOne({
      token,
      usado: false,
      dataExpiracao: { $gt: Date.now() }
    });
    
    if (!resetToken) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Token inválido ou expirado'
      });
    }
    
    return res.status(200).json({
      sucesso: true,
      mensagem: 'Token válido'
    });
    
  } catch (error) {
    console.error('Erro ao validar token:', error);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao validar token de recuperação'
    });
  }
};

// Redefinir senha
exports.redefinirSenha = async (req, res) => {
  try {
    const { token } = req.params;
    const { senha, confirmarSenha } = req.body;
    
    // Validar senhas
    if (!senha || senha.length < 6) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'A senha deve ter pelo menos 6 caracteres'
      });
    }
    
    if (senha !== confirmarSenha) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'As senhas não coincidem'
      });
    }
    
    // Buscar token no banco
    const resetToken = await PasswordReset.findOne({
      token,
      usado: false,
      dataExpiracao: { $gt: Date.now() }
    });
    
    if (!resetToken) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Token inválido ou expirado'
      });
    }
    
    // Buscar usuário
    const usuario = await Usuario.findById(resetToken.usuario);
    
    if (!usuario) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Usuário não encontrado'
      });
    }
    
    // Atualizar senha
    usuario.senha = senha;
    await usuario.save();
    
    // Marcar token como usado
    resetToken.usado = true;
    await resetToken.save();
    
    return res.status(200).json({
      sucesso: true,
      mensagem: 'Senha redefinida com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao redefinir senha'
    });
  }
};