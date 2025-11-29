import axios from 'axios';
import { toast } from 'react-toastify';

// Criar instância do axios com configurações padrão
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '',
  timeout: 60000 // Timeout estendido para permitir relatórios de períodos longos
});

// Objeto para rastrear requisições em andamento e evitar duplicações
const pendingRequests = {};

// Contador de erros de conexão para não mostrar múltiplos toasts
let connectionErrorCount = 0;
let connectionErrorToastId = 'connection-error-toast';
let isReconnected = false;

// Interceptor de requisições
api.interceptors.request.use(
  (config) => {
    // Obter o token do localStorage
    const token = localStorage.getItem('token');
    
    // Adicionar token no cabeçalho se existir
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Criar um identificador único para a requisição (URL + método)
    const requestId = `${config.url}|${config.method}`;
    
    // Se for uma requisição GET, verificar se já existe uma igual em andamento
    if (config.method.toLowerCase() === 'get') {
      // Cancelar requisição anterior se existir
      if (pendingRequests[requestId]) {
        pendingRequests[requestId].cancel('Requisição cancelada por duplicação');
      }
      
      // Criar um token para cancelamento
      const cancelToken = axios.CancelToken.source();
      config.cancelToken = cancelToken.token;
      
      // Armazenar o token de cancelamento
      pendingRequests[requestId] = cancelToken;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de respostas
api.interceptors.response.use(
  (response) => {
    // Remover requisição do controle de pendentes
    const requestId = `${response.config.url}|${response.config.method}`;
    delete pendingRequests[requestId];
    
    // Se houve problemas de conexão antes e agora está funcionando
    if (connectionErrorCount > 0) {
      connectionErrorCount = 0;
      
      // Mostrar mensagem de reconexão apenas uma vez
      if (!isReconnected) {
        isReconnected = true;
        toast.dismiss(connectionErrorToastId);
        
        toast.success('Conexão com o servidor restaurada', {
          autoClose: 3000,
          onClose: () => {
            isReconnected = false; // Reset flag para futuras desconexões
          }
        });
      }
    }
    
    return response;
  },
  (error) => {
    // Se for um erro de cancelamento, apenas ignore
    if (axios.isCancel(error)) {
      return new Promise(() => {});
    }
    
    // Remover requisição do controle de pendentes
    if (error.config) {
      const requestId = `${error.config.url}|${error.config.method}`;
      delete pendingRequests[requestId];
    }
    
    // Tratamento de erros de conexão melhorado
    // IMPORTANTE: Verificar se é um erro REAL de conexão (sem resposta do servidor)
    // e não um erro HTTP (como 500) que TEM resposta
    const isRealConnectionError = 
      !error.response && 
      (error.code === 'ECONNABORTED' || 
       error.code === 'ERR_NETWORK' || 
       error.code === 'ECONNREFUSED' ||
       error.message === 'Network Error');
    
    if (isRealConnectionError) {
      connectionErrorCount++;
      
      // Mostrar toast apenas se não existir ainda
      if (!toast.isActive(connectionErrorToastId)) {
        toast.error(
          <div>
            <strong>Erro de conexão com o servidor</strong>
            <p>Não foi possível conectar ao servidor backend.</p>
            <p>Verifique se o servidor está rodando.</p>
          </div>,
          {
            toastId: connectionErrorToastId,
            autoClose: false,
            closeOnClick: false
          }
        );
      }
      
      console.error(`Erro de conexão (tentativa ${connectionErrorCount}):`, error.message || 'Falha na conexão com o servidor');
      return Promise.reject({
        isConnectionError: true,
        message: 'Não foi possível conectar ao servidor',
        originalError: error
      });
    }
    
    // Tratamento de erros de autenticação
    if (error.response?.status === 401) {
      // Verificar se estamos na página de login para evitar redirecionamento em loop
      const isLoginPage = window.location.pathname === '/login';
      
      if (!isLoginPage) {
        // Exibir apenas um toast para erro de autenticação
        toast.error('Sua sessão expirou. Por favor, faça login novamente.', {
          toastId: 'auth-error'
        });
        
        // Limpar token e redirecionar para login
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      
      return Promise.reject(error);
    }
    
    // Tratamento de outros erros específicos
    if (error.response?.status === 404) {
      console.error('Recurso não encontrado:', error.config.url);
    } else if (error.response?.status === 500) {
      console.error('Erro no servidor:', error.response.data);
    }
    
    return Promise.reject(error);
  }
);

// Função helper para verificar status do servidor
api.checkServerStatus = async () => {
  try {
    await api.get('/api/health', { timeout: 3000 });
    return true;
  } catch (error) {
    console.log('Servidor indisponível:', error.message);
    return false;
  }
};

export default api;
