import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSave, FaArrowLeft, FaCamera } from 'react-icons/fa';
import api from '../services/api';
import { toast } from 'react-toastify';
import './AdicionarProduto.css';

const AdicionarProduto = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: '',
    tipo: '',
    categoria: '',
    subcategoria: '',
    local: '',
    quantidade: 0,
    dataRegistro: new Date().toISOString().split('T')[0]
  });
  
  const [imagem, setImagem] = useState(null);
  const [previewImagem, setPreviewImagem] = useState(null);
  const [locais, setLocais] = useState([]);
  const [carregando, setCarregando] = useState(false);
  
  // Carregar lista de locais disponíveis
  useEffect(() => {
    const carregarLocais = async () => {
      try {
        const resposta = await api.get('/api/estoque/locais');
        setLocais(resposta.data);
      } catch (error) {
        console.error('Erro ao carregar locais:', error);
      }
    };
    
    carregarLocais();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleImageChange = (e) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    
    // Verificar tipo do arquivo
    if (!file.type.match('image.*')) {
      toast.error('Por favor, selecione uma imagem válida');
      return;
    }
    
    // Verificar tamanho do arquivo (máximo 5 MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5 MB');
      return;
    }
    
    setImagem(file);
    
    // Criar preview da imagem
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImagem(reader.result);
    };
    reader.readAsDataURL(file);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar campos obrigatórios
    if (!formData.nome || !formData.tipo || !formData.categoria || !formData.subcategoria || !formData.local) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    
    // Validar quantidade
    if (formData.quantidade <= 0) {
      toast.error('A quantidade deve ser maior que zero');
      return;
    }
    
    try {
      setCarregando(true);
      
      // Criar FormData para enviar imagem junto com os dados do produto
      const dadosParaEnvio = new FormData();
      Object.keys(formData).forEach(key => {
        dadosParaEnvio.append(key, formData[key]);
      });
      
      if (imagem) {
        dadosParaEnvio.append('imagem', imagem);
      }
      
      // Enviar requisição para criar produto
      const resposta = await api.post('/api/produtos', dadosParaEnvio, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success('Produto cadastrado com sucesso!');
      navigate('/produtos');
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      toast.error(error.response?.data?.mensagem || 'Erro ao cadastrar produto');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="adicionar-produto-container">
      <div className="page-header">
        <h1>Adicionar Novo Produto</h1>
        <button 
          className="btn btn-outline"
          onClick={() => navigate('/produtos')}
        >
          <FaArrowLeft /> Voltar
        </button>
      </div>

      <form className="form-container" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group upload-container">
            <label htmlFor="imagem">Imagem do Produto</label>
            <div 
              className="image-upload" 
              onClick={() => document.getElementById('imagem').click()}
            >
              {previewImagem ? (
                <img src={previewImagem} alt="Preview" className="image-preview" />
              ) : (
                <div className="upload-placeholder">
                  <FaCamera className="camera-icon" />
                  <p>Clique para adicionar imagem</p>
                </div>
              )}
            </div>
            <input
              type="file"
              id="imagem"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />
            <small>Formatos: JPG, PNG. Max. 5MB</small>
          </div>
          
          <div className="form-details">
            <div className="form-group">
              <label htmlFor="nome">Nome do Produto *</label>
              <input
                type="text"
                id="nome"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                required
                placeholder="Ex.: Coca-Cola 2L"
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="tipo">Tipo *</label>
                <input
                  type="text"
                  id="tipo"
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                  required
                  placeholder="Ex.: Garrafa, Lata, Caixa"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="categoria">Categoria *</label>
                <input
                  type="text"
                  id="categoria"
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleChange}
                  required
                  placeholder="Ex.: Bebidas, Cor"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="subcategoria">Subcategoria *</label>
                <input
                  type="text"
                  id="subcategoria"
                  name="subcategoria"
                  value={formData.subcategoria}
                  onChange={handleChange}
                  required
                  placeholder="Ex.: Refrigerantes, Verde"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="dataRegistro">Data de Registro</label>
                <input
                  type="date"
                  id="dataRegistro"
                  name="dataRegistro"
                  value={formData.dataRegistro}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="local">Local *</label>
                <select
                  id="local"
                  name="local"
                  value={formData.local}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecione um local</option>
                  {locais.map((local, index) => (
                    <option key={index} value={local}>{local}</option>
                  ))}
                </select>
                <small>Escolha o local onde o produto será armazenado inicialmente</small>
              </div>
              
              <div className="form-group">
                <label htmlFor="quantidade">Quantidade Inicial *</label>
                <input
                  type="number"
                  id="quantidade"
                  name="quantidade"
                  value={formData.quantidade}
                  onChange={handleChange}
                  min="1"
                  required
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="form-footer">
          <button 
            type="button" 
            className="btn btn-outline"
            onClick={() => navigate('/produtos')}
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={carregando}
          >
            {carregando ? 'Cadastrando...' : (
              <>
                <FaSave /> Cadastrar Produto
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdicionarProduto;