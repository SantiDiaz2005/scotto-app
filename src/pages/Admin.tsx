import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import type { Product } from '../models/product.model';
import type { UserProfile } from '../models/user.model';
import { productService } from '../services/product.service';
import { authService } from '../services/auth.service';
import { supabase } from '../config/supabase';

export const Admin = () => {
  const [activeTab, setActiveTab] = useState<'productos' | 'clientes'>('productos');
  const [loading, setLoading] = useState(true);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // ESTADOS DE EDICIÓN
  const [editName, setEditName] = useState<string>(''); // NUEVO: Estado para el nombre
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editStock, setEditStock] = useState<number>(0);
  const [editDescription, setEditDescription] = useState<string>(''); 
  
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', category: 'General', price: 0, stock: 100, description: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const navigate = useNavigate();

  // NUEVO: Control de Seguridad Estricto (Candado + Permisos)
  useEffect(() => {
    const checkSecurity = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // 1. Si no hay sesión iniciada, lo mandamos al login
      if (!session) {
        navigate('/login');
        return;
      }

      // 2. Verificamos que el mail del usuario sea de un administrador.
      // ACÁ PODÉS AGREGAR EL MAIL DE SCOTTO CUANDO SE CREE LA CUENTA
      const adminEmails = [
        'santi.diazgiannone2@gmail.com', 
        'mail.de.scotto@ejemplo.com'
      ];
      
      // Si el correo del usuario no está en la lista de arriba...
      if (!adminEmails.includes(session.user.email || '')) {
         // Lo rebotamos de vuelta a la vista de cliente
         navigate('/catalogo');
         return;
      }

      // 3. Si pasó ambos filtros, es un admin y le cargamos los datos
      loadData();
    };
    
    checkSecurity();
  }, [navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const prodData = await productService.fetchProducts();
      setProducts(prodData);
      const profData = await authService.getProfiles();
      setProfiles(profData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const startEditing = (product: Product) => {
    setEditingId(product.id);
    setEditName(product.name); // Cargamos el nombre actual
    setEditPrice(product.price);
    setEditStock(product.stock || 0);
    setEditDescription(product.description || ''); 
  };

  const saveChanges = async (id: string) => {
    await productService.updateProduct(id, { 
      name: editName, // Guardamos el nuevo nombre
      price: editPrice, 
      stock: editStock,
      description: editDescription 
    });
    setEditingId(null);
    loadData();
  };

  const handleImageChange = async (productId: string, file: File) => {
    setIsSaving(true);
    const imageUrl = await productService.uploadImage(file);
    if (imageUrl) {
      await productService.updateProduct(productId, { image_url: imageUrl });
      loadData();
    } else {
      alert("Error al subir la imagen");
    }
    setIsSaving(false);
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    await authService.toggleUserStatus(id, currentStatus);
    loadData();
  };

  const handleSaveNewProduct = async () => {
    if (!newProduct.name || newProduct.price < 0 || newProduct.stock < 0) {
      return alert("Revisá los datos ingresados.");
    }
    setIsSaving(true);
    try {
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await productService.uploadImage(imageFile);
      }

      await productService.createProduct({
        name: newProduct.name,
        category: newProduct.category,
        price: newProduct.price,
        stock: newProduct.stock,
        description: newProduct.description,
        is_active: true,
        image_url: imageUrl
      });
      setShowCreateModal(false);
      setNewProduct({ name: '', category: 'General', price: 0, stock: 100, description: '' });
      setImageFile(null);
      loadData();
    } catch (error) {
      alert("Error al crear producto.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        const productsToAdd = data.map((row: any) => ({
          name: row['Nombre'] || row['Descripción'] || row['Descripcion'] || 'Sin nombre',
          category: row['Categoría'] || row['Categoria'] || 'General',
          price: Number(row['Precio']) || Number(row['Costo']) || 0,
          stock: Number(row['Stock']) || Number(row['Cantidad']) || 100,
          is_active: true,
          description: row['Detalle'] || '',
          image_url: null
        }));

        await productService.createProductsBulk(productsToAdd);
        alert(`¡Éxito! Se importaron ${productsToAdd.length} productos nuevos.`);
        loadData();
      } catch (err) {
        console.error(err);
        alert("Error al procesar el Excel.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans pb-20">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 bg-gray-900 p-4 rounded-lg shadow-md text-white gap-4">
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-3 w-full justify-center md:justify-start">
            <img src="/logo.png" alt="SA Scotto" className="h-8 md:h-10 bg-black p-1 rounded border border-yellow-600" />
            Panel de Control
          </h1>
          <button onClick={async () => {
            await supabase.auth.signOut();
            navigate('/login');
          }} className="w-full md:w-auto bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-bold transition-colors shadow-sm text-white">
            Cerrar Sesión
          </button>
        </div>

        <div className="flex gap-2 md:gap-4 mb-4">
          <button onClick={() => setActiveTab('productos')} className={`flex-1 md:flex-none px-4 md:px-6 py-2 font-bold rounded-t-lg text-sm md:text-base ${activeTab === 'productos' ? 'bg-white text-gray-900 shadow-sm' : 'bg-gray-300 text-gray-600'}`}>
            📦 Productos
          </button>
          <button onClick={() => setActiveTab('clientes')} className={`flex-1 md:flex-none px-4 md:px-6 py-2 font-bold rounded-t-lg text-sm md:text-base ${activeTab === 'clientes' ? 'bg-white text-gray-900 shadow-sm' : 'bg-gray-300 text-gray-600'}`}>
            👥 Clientes
          </button>
        </div>

        <div className="bg-white rounded-b-lg rounded-tr-lg shadow-xl overflow-hidden p-3 md:p-4">
          
          {loading ? (
            <div className="p-20 text-center flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mb-4"></div>
              <p className="text-gray-500 font-bold text-lg">Procesando base de datos...</p>
            </div>
          ) : activeTab === 'productos' ? (
            
            <div className="flex flex-col gap-4">
              
              <div className="flex flex-col md:flex-row justify-between items-center bg-gray-900 p-4 rounded-lg border border-gray-700 gap-4">
                <div className="text-white text-center md:text-left">
                  <h3 className="font-bold text-lg flex items-center justify-center md:justify-start gap-2">📄 Carga de Catálogo</h3>
                  <p className="text-xs text-gray-400 mt-1">Subí el Excel maestro o agregá artículos unitarios.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <label className="w-full sm:w-auto text-center bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded font-bold shadow-sm transition-colors cursor-pointer text-sm">
                    Subir Archivo Excel
                    <input type="file" accept=".xlsx, .xls" onChange={handleExcelUpload} className="hidden" />
                  </label>
                  <button onClick={() => setShowCreateModal(true)} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded font-bold shadow-sm transition-colors text-sm">
                    + Artículo Manual
                  </button>
                </div>
              </div>

              <div className="w-full mt-2">
                <input
                  type="text"
                  placeholder="🔍 Buscar artículo para editar (ej: alfombra)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-yellow-600 focus:outline-none shadow-sm text-gray-700 font-medium"
                />
              </div>

              {/* VISTA MÓVIL */}
              <div className="block md:hidden space-y-4 mt-2">
                {currentProducts.map(p => (
                  <div key={p.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">{p.category}</span>
                      <label className="cursor-pointer relative block w-12 h-12 flex-shrink-0" title="Tocar para cambiar foto">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="w-12 h-12 object-cover rounded border" />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 text-gray-600 rounded border flex items-center justify-center text-[10px] font-bold">
                            + FOTO
                          </div>
                        )}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && handleImageChange(p.id, e.target.files[0])} />
                      </label>
                    </div>
                    
                    {/* MOSTRAMOS EL NOMBRE COMO TEXTO SI NO EDITA */}
                    {!editingId && <h4 className="font-bold text-gray-900 leading-tight">{p.name}</h4>}
                    {p.description && !editingId && <p className="text-sm text-gray-600 italic">{p.description}</p>}
                    
                    {editingId === p.id ? (
                      <div className="flex flex-col gap-3 mt-2 p-3 bg-gray-50 rounded border border-gray-200">
                        {/* NUEVO INPUT PARA EL NOMBRE EN CELULAR */}
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-bold text-gray-600">Nombre del artículo:</span>
                          <input 
                            type="text" 
                            value={editName} 
                            onChange={e => setEditName(e.target.value)} 
                            className="w-full p-2 border border-gray-400 rounded text-sm bg-white font-bold text-gray-900" 
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-bold text-gray-600">Descripción:</span>
                          <textarea 
                            value={editDescription} 
                            onChange={e => setEditDescription(e.target.value)} 
                            className="w-full p-2 border border-gray-400 rounded text-sm bg-white" 
                            rows={2}
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-gray-600">Precio:</span>
                          <div className="flex items-center text-gray-900 font-bold">
                            $<input type="number" value={editPrice} onChange={e => setEditPrice(Number(e.target.value))} className="w-20 p-1 ml-1 border border-gray-400 rounded text-right bg-white" />
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-gray-600">Stock:</span>
                          <div className="flex items-center">
                            <input type="number" value={editStock} onChange={e => setEditStock(Number(e.target.value))} className="w-16 p-1 border border-gray-400 rounded text-center bg-white" />
                            <span className="ml-1 text-sm text-gray-600 font-semibold">unid.</span>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => saveChanges(p.id)} className="flex-1 bg-green-600 text-white py-2 rounded font-bold">Guardar</button>
                          <button onClick={() => setEditingId(null)} className="flex-1 bg-gray-500 text-white py-2 rounded font-bold">Cancelar</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-end mt-2">
                        <div className="flex flex-col gap-1">
                          <span className="text-lg font-bold text-green-700">${p.price.toLocaleString('es-AR')}</span>
                          <span className={`w-fit px-2 py-0.5 rounded text-xs font-bold ${p.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {p.stock} unid.
                          </span>
                        </div>
                        <button onClick={() => startEditing(p)} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold shadow-sm">
                          ✏️ Editar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* VISTA ESCRITORIO */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-max mt-2">
                  <thead className="bg-gray-800 text-white">
                    <tr>
                      <th className="p-4 w-16">Foto</th>
                      <th className="p-4">Producto</th>
                      <th className="p-4">Categoría</th>
                      <th className="p-4 text-right">Precio</th>
                      <th className="p-4 text-center">Stock</th>
                      <th className="p-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentProducts.map(p => (
                      <tr key={p.id} className="border-b border-gray-200 hover:bg-gray-50">
                        
                        <td className="p-4">
                          <label className="cursor-pointer relative block w-12 h-12 group hover:opacity-80 transition-opacity" title="Clic para cambiar foto">
                            {p.image_url ? (
                              <img src={p.image_url} alt="Prod" className="w-12 h-12 object-cover rounded border" />
                            ) : (
                              <div className="flex items-center justify-center w-12 h-12 bg-gray-200 rounded border text-xs text-gray-500 font-bold text-center leading-tight">
                                Subir
                              </div>
                            )}
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && handleImageChange(p.id, e.target.files[0])} />
                          </label>
                        </td>

                        {editingId === p.id ? (
                          <>
                            {/* EN MODO EDICIÓN, MOSTRAMOS INPUTS DE NOMBRE Y DESCRIPCIÓN */}
                            <td className="p-4 w-1/3">
                              <input 
                                type="text" 
                                value={editName} 
                                onChange={e => setEditName(e.target.value)} 
                                className="w-full p-1.5 border border-gray-400 rounded text-sm font-semibold text-gray-900 mb-2" 
                              />
                              <input 
                                type="text" 
                                value={editDescription} 
                                onChange={e => setEditDescription(e.target.value)} 
                                placeholder="Agregar descripción o detalle..." 
                                className="w-full p-1.5 border border-gray-400 rounded text-sm" 
                              />
                            </td>
                            <td className="p-4 text-sm text-gray-500">{p.category}</td>
                            <td className="p-4 text-right">$<input type="number" value={editPrice} onChange={e => setEditPrice(Number(e.target.value))} className="w-24 p-1 border border-gray-400 rounded text-right ml-1" /></td>
                            <td className="p-4 text-center"><input type="number" value={editStock} onChange={e => setEditStock(Number(e.target.value))} className="w-20 p-1 border border-gray-400 rounded text-center" /> unid.</td>
                            <td className="p-4 flex justify-center gap-2">
                              <button onClick={() => saveChanges(p.id)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm font-semibold shadow-sm">Guardar</button>
                              <button onClick={() => setEditingId(null)} className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1.5 rounded text-sm font-semibold shadow-sm">Cancelar</button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="p-4 w-1/3">
                              <p className="font-semibold text-gray-800">{p.name}</p>
                              {p.description && <p className="text-xs text-gray-500 mt-1 italic">{p.description}</p>}
                            </td>
                            <td className="p-4 text-sm text-gray-500">{p.category}</td>
                            <td className="p-4 text-right font-bold text-green-700">${p.price.toLocaleString('es-AR')}</td>
                            <td className="p-4 text-center"><span className={`px-3 py-1 rounded-full text-xs font-bold ${p.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{p.stock} unid.</span></td>
                            <td className="p-4 flex justify-center"><button onClick={() => startEditing(p)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-1.5 rounded text-sm font-semibold shadow-sm transition-colors">✏️ Editar</button></td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex justify-between items-center bg-gray-50 p-3 rounded border">
                  <span className="text-sm text-gray-600 font-bold">
                    Página {currentPage} de {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 bg-gray-800 text-white rounded disabled:opacity-50">Anterior</button>
                    <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-1 bg-gray-800 text-white rounded disabled:opacity-50">Siguiente</button>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div>
              <div className="block md:hidden space-y-4">
                {profiles.map(user => (
                  <div key={user.id} className={`p-4 border rounded-lg shadow-sm ${user.is_active ? 'bg-white border-gray-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-gray-900">{user.name}</h4>
                        <p className="text-xs text-gray-500">DNI: {user.dni}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-200 text-red-900'}`}>
                        {user.is_active ? 'Activo' : 'Desactivado'}
                      </span>
                    </div>
                    <div className="mb-3">
                      <p className="text-sm text-gray-700">{user.email}</p>
                      <p className="text-xs text-gray-500">Tel: {user.phone}</p>
                    </div>
                    <button onClick={() => toggleStatus(user.id, user.is_active)} className={`w-full py-2 rounded text-sm font-bold text-white ${user.is_active ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
                      {user.is_active ? 'Desactivar Usuario' : 'Activar Usuario'}
                    </button>
                  </div>
                ))}
              </div>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-max">
                  <thead className="bg-gray-800 text-white">
                    <tr><th className="p-4">Nombre y DNI</th><th className="p-4">Contacto</th><th className="p-4 text-center">Estado</th><th className="p-4 text-center">Acción</th></tr>
                  </thead>
                  <tbody>
                    {profiles.map(user => (
                      <tr key={user.id} className={`border-b border-gray-200 ${user.is_active ? 'hover:bg-gray-50' : 'bg-red-50 opacity-75'}`}>
                        <td className="p-4"><p className="font-bold text-gray-800">{user.name}</p><p className="text-xs text-gray-500">DNI: {user.dni}</p></td>
                        <td className="p-4"><p className="text-sm text-gray-700">{user.email}</p><p className="text-xs text-gray-500">Tel: {user.phone}</p></td>
                        <td className="p-4 text-center"><span className={`px-3 py-1 rounded-full text-xs font-bold ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-200 text-red-900'}`}>{user.is_active ? 'Activo' : 'Desactivado'}</span></td>
                        <td className="p-4 text-center">
                          <button onClick={() => toggleStatus(user.id, user.is_active)} className={`px-4 py-1.5 rounded text-sm font-semibold text-white ${user.is_active ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
                            {user.is_active ? 'Desactivar' : 'Activar'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gray-900 p-4 text-white font-bold text-lg flex justify-between items-center">
              Crear Nuevo Producto
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white text-2xl">✕</button>
            </div>
            
            <div className="p-4 md:p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nombre del producto</label>
                <input type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full border border-gray-300 rounded p-2 focus:border-yellow-600 focus:outline-none" />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Categoría</label>
                <input type="text" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} className="w-full border border-gray-300 rounded p-2 focus:border-yellow-600 focus:outline-none" />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Descripción (Opcional)</label>
                <input type="text" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} placeholder="Detalle del repuesto..." className="w-full border border-gray-300 rounded p-2 focus:border-yellow-600 focus:outline-none" />
              </div>

              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Precio ($)</label>
                  <input type="number" value={newProduct.price || ''} onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})} className="w-full border border-gray-300 rounded p-2 focus:border-yellow-600 focus:outline-none" />
                </div>
                <div className="w-1/2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Stock</label>
                  <input type="number" value={newProduct.stock || ''} onChange={e => setNewProduct({...newProduct, stock: Number(e.target.value)})} className="w-full border border-gray-300 rounded p-2 focus:border-yellow-600 focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Subir Foto (Opcional)</label>
                <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100" />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 mt-4 border-t border-gray-200">
                <button onClick={() => setShowCreateModal(false)} className="w-full sm:w-auto px-5 py-2 rounded text-gray-600 font-bold hover:bg-gray-100 border border-gray-300 sm:border-none">Cancelar</button>
                <button onClick={handleSaveNewProduct} disabled={isSaving} className="w-full sm:w-auto px-5 py-2 rounded bg-green-600 text-white font-bold hover:bg-green-700 disabled:bg-gray-400">
                  {isSaving ? 'Guardando...' : 'Guardar Producto'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};