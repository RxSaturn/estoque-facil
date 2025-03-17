import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Importação de componentes
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import PrivateRoute from './components/PrivateRoute';

// Importação de páginas
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Produtos from './pages/Produtos';
import AdicionarProduto from './pages/AdicionarProduto';
import EditarProduto from './pages/EditarProduto';
import Movimentacao from './pages/Movimentacao';
import Vendas from './pages/Vendas';
import Relatorios from './pages/Relatorios';
import Usuarios from './pages/Usuarios';

// Importação de contextos
import { AuthProvider } from './contexts/AuthContext';

import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app-container">
          <ToastContainer 
            position="top-center" 
            autoClose={3000} 
            hideProgressBar={false}
            newestOnTop={true}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            limit={3} // Limita o número de toasts exibidos simultaneamente
          />
          <Navbar />
          <main className="container">
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<Login />} />
              <Route 
                path="/dashboard" 
                element={<PrivateRoute component={Dashboard} />} 
              />
              <Route 
                path="/produtos" 
                element={<PrivateRoute component={Produtos} />} 
              />
              <Route 
                path="/produtos/adicionar" 
                element={<PrivateRoute component={AdicionarProduto} />} 
              />
              <Route 
                path="/produtos/editar/:id" 
                element={<PrivateRoute component={EditarProduto} />} 
              />
              <Route 
                path="/movimentacao" 
                element={<PrivateRoute component={Movimentacao} />} 
              />
              <Route 
                path="/vendas" 
                element={<PrivateRoute component={Vendas} />} 
              />
              <Route 
                path="/relatorios" 
                element={<PrivateRoute component={Relatorios} />} 
              />
              <Route 
                path="/usuarios" 
                element={<PrivateRoute component={Usuarios} adminOnly={true} />} 
              />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;