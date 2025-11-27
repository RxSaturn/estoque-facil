const jwt = require("jsonwebtoken");
const Usuario = require("../models/Usuario");

exports.proteger = async (req, res, next) => {
  try {
    // Verificar se o token existe
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Acesso negado. É necessário fazer login.",
      });
    }

    // Verificar token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Verificar se o usuário ainda existe
    const usuarioAtual = await Usuario.findById(decoded.id);
    if (!usuarioAtual) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "O usuário associado a este token não existe mais",
      });
    }

    // Conceder acesso à rota
    req.usuario = usuarioAtual;
    next();
  } catch (error) {
    console.error("Erro na autenticação:", error);
    return res.status(401).json({
      sucesso: false,
      mensagem: "Token inválido ou expirado",
    });
  }
};

// Middleware para verificar se o usuário é administrador
exports.admin = (req, res, next) => {
  if (req.usuario && req.usuario.perfil === "admin") {
    next();
  } else {
    res.status(403).json({
      sucesso: false,
      mensagem: "Acesso negado. É necessário ter permissão de administrador.",
    });
  }
};
