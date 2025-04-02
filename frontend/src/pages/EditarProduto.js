import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaSave, FaArrowLeft, FaCamera, FaBox } from 'react-icons/fa';
import api from '../services/api';
import { toast } from 'react-toastify';
import './AdicionarProduto.css'; // Reusa os estilos da página de adicionar produto

const EditarProduto = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: '',
    tipo: '',
    categoria: '',
    subcategoria: ''
  });
  
  const [imagem, setImagem] = useState(null);
  const [previewImagem, setPreviewImagem] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [estoques, setEstoques] = useState([]);
  
  // Carregar dados do produto
  useEffect(() => {
    const carregarProduto = async () => {
      try {
        setCarregando(true);
        
        const resposta = await api.get(`/api/produtos/${id}`);
        
        if (resposta.data.sucesso) {
          const { produto, estoques } = resposta.data;
          
          setFormData({
            nome: produto.nome,
            tipo: produto.tipo,
            categoria: produto.categoria,
            subcategoria: produto.subcategoria
          });
          
          setPreviewImagem(produto.imagemUrl);
          setEstoques(estoques || []);
        } else {
          toast.error('Erro ao carregar dados do produto');
          navigate('/produtos');
        }
      } catch (error) {
        console.error('Erro ao carregar produto:', error);
        toast.error('Produto não encontrado ou erro ao carregar dados');
        navigate('/produtos');
      } finally {
        setCarregando(false);
      }
    };
    
    carregarProduto();
  }, [id, navigate]);

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
    if (!formData.nome || !formData.tipo || !formData.categoria || !formData.subcategoria) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    
    try {
      setSalvando(true);
      
      // Criar FormData para enviar imagem junto com os dados do produto
      const dadosParaEnvio = new FormData();
      Object.keys(formData).forEach(key => {
        dadosParaEnvio.append(key, formData[key]);
      });
      
      if (imagem) {
        dadosParaEnvio.append('imagem', imagem);
      }
      
      // Enviar requisição para atualizar produto
      const resposta = await api.put(`/api/produtos/${id}`, dadosParaEnvio, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (resposta.data.sucesso) {
        toast.success('Produto atualizado com sucesso!');
        navigate('/produtos');
      } else {
        toast.error('Erro ao atualizar produto');
      }
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      toast.error(error.response?.data?.mensagem || 'Erro ao atualizar produto');
    } finally {
      setSalvando(false);
    }
  };

  // Nova função para adicionar estoque
  const adicionarEstoque = () => {
    // Navegar para a página de movimentação com parâmetro de produto pré-selecionado
    navigate(`/movimentacoes/adicionar?produtoId=${id}&tipo=entrada`);
  };

  if (carregando) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando dados do produto...</p>
      </div>
    );
  }

  return (
    <div className="adicionar-produto-container">
      <div className="page-header">
        <h1>Editar Produto</h1>
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
            
            <div className="estoques-container">
              <h3>Estoque Atual</h3>
              
              {estoques.length > 0 ? (
                <table className="estoques-table">
                  <thead>
                    <tr>
                      <th>Local</th>
                      <th>Quantidade</th>
                      <th>Última Atualização</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estoques.map((estoque, index) => (
                      <tr key={index}>
                        <td>{estoque.local}</td>
                        <td>{estoque.quantidade}</td>
                        <td>{new Date(estoque.ultimaAtualizacao).toLocaleDateString('pt-BR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="no-data">Nenhum estoque cadastrado para este produto.</p>
              )}
              
              <p>
                <small>Para atualizar quantidade ou transferir estoque, utilize a seção de Movimentações.</small>
              </p>
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

          {/* Botão de Adicionar Estoque */}
          <button 
            type="button" 
            className="btn btn-adicionar-estoque"
            onClick={adicionarEstoque}
          >
            <FaBox /> Adicionar Estoque
          </button>

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={salvando}
          >
            {salvando ? 'Salvando...' : (
              <>
                <FaSave /> Salvar Alterações
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditarProduto;
