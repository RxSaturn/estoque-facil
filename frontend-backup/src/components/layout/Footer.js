import React from 'react';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="container footer-container">
        <div className="footer-content">
          <p>&copy; {currentYear} Estoque Fácil. Todos os direitos reservados.</p>
        </div>
        <div className="footer-links">
          <a href="#" className="footer-link">Termos de Uso</a>
          <a href="#" className="footer-link">Política de Privacidade</a>
          <a href="#" className="footer-link">Suporte</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;