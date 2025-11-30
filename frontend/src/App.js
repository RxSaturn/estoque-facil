import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "react-toastify/dist/ReactToastify.css";

// Importação de componentes
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import PrivateRoute from "./components/PrivateRoute";

// Importação de páginas críticas (carregamento imediato)
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

// Importação de contextos
import { AuthProvider } from "./contexts/AuthContext";

// Importação de estilos
import "./styles/design-system.css";
import "./styles/theme.css";
import "./styles/components.css";
import "./App.css";

// Configuração do React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      gcTime: 1000 * 60 * 10, // 10 minutos (anteriormente cacheTime)
      refetchOnWindowFocus: false,
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
    mutations: {
      retry: 1,
    },
  },
});

// Lazy loading para páginas secundárias (carregamento sob demanda)
const Produtos = lazy(() => import("./pages/Produtos"));
const AdicionarProduto = lazy(() => import("./pages/AdicionarProduto"));
const EditarProduto = lazy(() => import("./pages/EditarProduto"));
const Movimentacao = lazy(() => import("./pages/Movimentacao"));
const Historico = lazy(() => import("./pages/Historico"));
const Relatorios = lazy(() => import("./pages/RelatoriosV2"));
const Gerenciamento = lazy(() => import("./pages/Gerenciamento"));
const RedefinirSenha = lazy(() => import("./pages/RedefinirSenha"));

// Componente de loading para Suspense
const LoadingSpinner = () => (
  <div className="loading-container" style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    flexDirection: 'column',
    gap: '1rem'
  }}>
    <div className="loading-spinner"></div>
    <p>Carregando...</p>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  <Route path="/" element={<Login />} />
                  <Route path="/login" element={<Login />} />
                  <Route
                    path="/redefinir-senha/:token"
                    element={<RedefinirSenha />}
                  />
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
                    path="/movimentacoes/adicionar"
                    element={<Movimentacao />}
                  />
                  <Route
                    path="/historico"
                    element={<PrivateRoute component={Historico} />}
                  />
                  <Route
                    path="/relatorios"
                    element={<PrivateRoute component={Relatorios} />}
                  />
                  <Route
                    path="/gerenciamento"
                    element={
                      <PrivateRoute component={Gerenciamento} adminOnly={true} />
                    }
                  />
                </Routes>
              </Suspense>
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
