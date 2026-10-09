import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx'; // Importamos la librería para leer el Excel
import type { Product } from '../models/product.model';
import type { UserProfile } from '../models/user.model';
import { productService } from '../services/product.service';
import { authService } from '../services/auth.service';

export const Admin = () => {
  const [activeTab, setActiveTab] = useState<'productos' | 'clientes'>('productos');
  const [loading, setLoading] = useState(true);
  
  // Estados de la tabla
  const [products, setProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editStock, setEditStock] = useState<number>(0);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);

  // Estados para el Modal de Creación Manual
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', category: 'General', price: 0, stock: 100 });
  const [isSaving, setIsSaving] = useState(false);

  const navigate = useNavigate();

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

  useEffect(() => { loadData(); }, []);

  // --- EDICIÓN EN LÍNEA ---
  const startEditing = (product: Product) => {
    setEditingId(product.id);
    setEditPrice(product.price);
    setEditStock(product.stock || 0);
  };

  const saveChanges = async (id: string) => {
    await productService.updateProduct(id, { price: editPrice, stock: editStock });
    setEditingId(null);
    loadData();
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    await authService.toggleUserStatus(id, currentStatus);
    loadData();
  };

  // --- CARGA MANUAL DE PRODUCTO ---
  const handleSaveNewProduct = async () => {
    if (!newProduct.name || newProduct.price < 0 || newProduct.stock < 0) {
      return alert("Revisá los datos ingresados.");
    }
    setIsSaving(true);
    try {
      await productService.createProduct({
        name: newProduct.name,
        category: newProduct.category,
        price: newProduct.price,
        stock: newProduct.stock,
        is_active: true,
        description: '',
        image_url: null
      });
      setShowCreateModal(false);
      setNewProduct({ name: '', category: 'General', price: 0, stock: 100 }); // Limpiamos
      loadData(); // Recargamos tabla
    } catch (error) {
      alert("Error al crear producto.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- LECTURA DEL EXCEL ---
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true); // Ponemos a cargar mientras lee
    const reader = new FileReader();
    
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0]; // Leemos la primera hoja
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws); // Convertimos a JSON

        // Mapeamos las columnas del Excel a nuestro formato
        const productsToAdd = data.map((row: any) => ({
          name: row['Nombre'] || row['Descripción'] || row['Descripcion'] || 'Sin nombre',
          category: row['Categoría'] || row['Categoria'] || 'General',
          price: Number(row['Precio']) || Number(row['Costo']) || 0,
          stock: Number(row['Stock']) || Number(row['Cantidad']) || 100,
          is_active: true,
          description: '',
          image_url: null
        }));

        await productService.createProductsBulk(productsToAdd);
        alert(`¡Éxito! Se importaron ${productsToAdd.length} productos nuevos desde el Excel.`);
        loadData();
      } catch (err) {
        console.error(err);
        alert("Error al procesar el Excel. Asegurate de que la primera hoja tenga las columnas correctas.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ''; // Reseteamos el input
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* CABECERA */}
        <div className="flex justify-between items-center mb-6 bg-gray-900 p-4 rounded-lg shadow-md text-white">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <img src="/logo.png" alt="SA Scotto" className="h-10 bg-black p-1 rounded border border-yellow-600" />
            Panel de Control
          </h1>
          <button onClick={() => navigate('/login')} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-bold transition-colors shadow-sm text-white">
            Cerrar Sesión
          </button>
        </div>

        {/* PESTAÑAS */}
        <div className="flex gap-4 mb-4">
          <button onClick={() => setActiveTab('productos')} className={`px-6 py-2 font-bold rounded-t-lg ${activeTab === 'productos' ? 'bg-white text-gray-900 shadow-sm' : 'bg-gray-300 text-gray-600'}`}>
            📦 Productos
          </button>
          <button onClick={() => setActiveTab('clientes')} className={`px-6 py-2 font-bold rounded-t-lg ${activeTab === 'clientes' ? 'bg-white text-gray-900 shadow-sm' : 'bg-gray-300 text-gray-600'}`}>
            👥 Gestión de Clientes
          </button>
        </div>

        <div className="bg-white rounded-b-lg rounded-tr-lg shadow-xl overflow-x-auto p-4">
          
          {loading ? (
            <div className="p-20 text-center flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mb-4"></div>
              <p className="text-gray-500 font-bold text-lg">Procesando base de datos...</p>
            </div>
          ) : activeTab === 'productos' ? (
            
            <div className="flex flex-col gap-4">
              {/* BARRA DE GESTIÓN (EXCEL / MANUAL) */}
              <div className="flex flex-col md:flex-row justify-between items-center bg-gray-900 p-4 rounded-lg border border-gray-700 gap-4">
                <div className="text-white">
                  <h3 className="font-bold text-lg flex items-center gap-2">📄 Carga de Catálogo</h3>
                  <p className="text-xs text-gray-400 mt-1">Subí el Excel maestro o agregá artículos unitarios.</p>
                </div>
                <div className="flex gap-3">
                  <label className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded font-bold shadow-sm transition-colors cursor-pointer flex items-center gap-2">
                    Subir Archivo Excel
                    <input 
                      type="file" 
                      accept=".xlsx, .xls" 
                      onChange={handleExcelUpload}
                      className="hidden" 
                    />
                  </label>
                  <button 
                    onClick={() => setShowCreateModal(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded font-bold shadow-sm transition-colors flex items-center gap-2"
                  >
                    + Artículo Manual
                  </button>
                </div>
              </div>

              {/* TABLA DE PRODUCTOS */}
              <table className="w-full text-left border-collapse min-w-max mt-2">
                <thead className="bg-gray-800 text-white">
                  <tr><th className="p-4">Producto</th><th className="p-4">Categoría</th><th className="p-4 text-right">Precio</th><th className="p-4 text-center">Stock</th><th className="p-4 text-center">Acciones</th></tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="p-4 font-semibold text-gray-800 w-1/3">{p.name}</td>
                      <td className="p-4 text-sm text-gray-500">{p.category}</td>
                      {editingId === p.id ? (
                        <>
                          <td className="p-4 text-right">$<input type="number" value={editPrice} onChange={e => setEditPrice(Number(e.target.value))} className="w-24 p-1 border border-gray-400 rounded text-right ml-1" /></td>
                          <td className="p-4 text-center"><input type="number" value={editStock} onChange={e => setEditStock(Number(e.target.value))} className="w-20 p-1 border border-gray-400 rounded text-center" /> unid.</td>
                          <td className="p-4 flex justify-center gap-2">
                            <button onClick={() => saveChanges(p.id)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm font-semibold shadow-sm">Guardar</button>
                            <button onClick={() => setEditingId(null)} className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1.5 rounded text-sm font-semibold shadow-sm">Cancelar</button>
                          </td>
                        </>
                      ) : (
                        <>
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
          ) : (
            /* VISTA CLIENTES */
            <div>
               {/* ... (Acá queda igual que antes, tu tabla de clientes) ... */}
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
          )}
        </div>
      </div>

      {/* ---------------- MODAL DE CREACIÓN MANUAL ---------------- */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gray-900 p-4 text-white font-bold text-lg flex justify-between items-center">
              Crear Nuevo Producto
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nombre del producto</label>
                <input type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full border border-gray-300 rounded p-2 focus:border-yellow-600 focus:outline-none" placeholder="Ej: Alfombra Goma" />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Categoría</label>
                <input type="text" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} className="w-full border border-gray-300 rounded p-2 focus:border-yellow-600 focus:outline-none" placeholder="Ej: General" />
              </div>

              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Precio ($)</label>
                  <input type="number" value={newProduct.price || ''} onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})} className="w-full border border-gray-300 rounded p-2 focus:border-yellow-600 focus:outline-none" />
                </div>
                <div className="w-1/2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Stock inicial</label>
                  <input type="number" value={newProduct.stock || ''} onChange={e => setNewProduct({...newProduct, stock: Number(e.target.value)})} className="w-full border border-gray-300 rounded p-2 focus:border-yellow-600 focus:outline-none" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-gray-200">
                <button onClick={() => setShowCreateModal(false)} className="px-5 py-2 rounded text-gray-600 font-bold hover:bg-gray-100">
                  Cancelar
                </button>
                <button onClick={handleSaveNewProduct} disabled={isSaving} className="px-5 py-2 rounded bg-green-600 text-white font-bold hover:bg-green-700 disabled:bg-gray-400">
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