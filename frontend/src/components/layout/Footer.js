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
          <button type="button" className="footer-link">Termos de Uso</button>
          <button type="button" className="footer-link">Política de Privacidade</button>
          <button type="button" className="footer-link">Suporte</button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;