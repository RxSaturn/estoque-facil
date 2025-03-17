import axios from 'axios';
import { toast } from 'react-toastify';

// Criar instância do axios com configurações padrão
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || ''
});

// Objeto para rastrear requisições em andamento e evitar duplicações
const pendingRequests = {};

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
    
    // Tratamento de erros de autenticação
    if (error.response?.status === 401) {
      // Exibir apenas um toast para erro de autenticação
      toast.error('Sua sessão expirou. Por favor, faça login novamente.', {
        toastId: 'auth-error'
      });
      
      // Limpar token e redirecionar para login
      localStorage.removeItem('token');
      window.location.href = '/login';
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

export default api;