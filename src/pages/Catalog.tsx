import  { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../models/product.model';
import { productService } from '../services/product.service';
import { ProductCard } from '../components/products/ProductCard';
import { CartSidebar } from '../components/cart/CartSidebar';

export const Catalog = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  
  // Estados para Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  
  const navigate = useNavigate();

  const userProfileString = localStorage.getItem('user_profile');
  const userProfile = userProfileString ? JSON.parse(userProfileString) : null;

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await productService.fetchProducts();
        setProducts(data);
      } catch (error) {
        console.error("No se pudieron cargar los productos");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredProducts = products.filter(product => {
    const searchLower = searchTerm.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchLower) ||
      (product.description && product.description.toLowerCase().includes(searchLower)) ||
      product.category.toLowerCase().includes(searchLower)
    );
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  return (
    <div className="h-screen flex flex-col bg-gray-100 font-sans overflow-hidden">
      
      {/* HEADER (Mejorado para celulares) */}
      <header className="bg-black text-white p-3 md:p-4 shadow-md z-[60] flex items-center justify-between border-b border-yellow-600">
        <div className="w-1/4 md:w-1/3 flex items-center">
          <img src="/logo.png" alt="SA Scotto" className="h-8 md:h-12 w-auto object-contain" />
        </div>

        <div className="w-1/2 md:w-1/3 flex justify-center px-2">
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-3 py-1.5 md:py-2 rounded-full bg-gray-800 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>

        <div className="w-1/4 md:w-1/3 flex justify-end relative">
          <button onClick={() => setShowProfile(!showProfile)} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="hidden sm:block font-semibold text-gray-300 text-sm">Mi Cuenta</span>
            <img src="/user-icon.png" alt="Perfil" className="w-8 h-8 md:w-10 md:h-10 rounded-full shadow-md object-cover bg-white" />
          </button>

          {showProfile && (
            <div className="absolute top-12 right-0 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-4 w-64 md:w-72 z-50">
              <h3 className="text-yellow-500 font-bold mb-3 border-b border-gray-700 pb-2">Perfil del Cliente</h3>
              <div className="text-sm text-gray-400 space-y-2 mb-4">
                {userProfile ? (
                  <>
                    <p><strong className="text-white">Nombre:</strong> {userProfile.name}</p>
                    <p><strong className="text-white">DNI:</strong> {userProfile.dni}</p>
                    <p><strong className="text-white">Email:</strong> {userProfile.email}</p>
                    <p><strong className="text-white">Tel:</strong> {userProfile.phone}</p>
                  </>
                ) : (
                  <p>Datos no disponibles.</p>
                )}
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('user_profile');
                  navigate('/login');
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors text-sm"
              >
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </header>

      {/* CUERPO PRINCIPAL */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Contenedor Izquierdo: Catálogo y Paginación */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-100">
          
          {/* Zona Scrolleable de Productos */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="max-w-4xl mx-auto">
              {loading ? (
                <p className="text-center text-gray-500 mt-10 font-medium">Cargando catálogo...</p>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center mt-10">
                  <p className="text-gray-500 text-lg">No se encontraron productos.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {currentProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          </main>

          {/* BARRA DE PAGINACIÓN FIJA ABAJO */}
          {!loading && totalPages > 1 && (
            <div className="bg-white border-t border-gray-200 p-3 flex justify-center items-center gap-4 shadow-md z-10">
              <span className="text-xs md:text-sm text-gray-600 font-semibold hidden sm:block">
                Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredProducts.length)} de {filteredProducts.length}
              </span>
              <div className="flex gap-1 bg-gray-900 rounded p-1">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ◀
                </button>
                <span className="px-4 py-1 text-white font-bold bg-gray-700 rounded text-sm md:text-base">
                  {currentPage} de {totalPages}
                </span>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ▶
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* CARRITO LATERAL */}
        <CartSidebar />
      </div>
    </div>
  );
};