import type { Product } from '../../models/product.model'
import { useCart } from '../../context/CartContext'

interface Props {
  product: Product;
}

export const ProductCard = ({ product }: Props) => {
  // Importamos la función para agregar al carrito
  const { addToCart } = useCart();

  return (
    <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow h-32">
      <div className="w-32 h-full flex-shrink-0 bg-gray-50 border-r border-gray-200 flex items-center justify-center p-2">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-contain" />
        ) : (
          <span className="text-xs text-gray-400 text-center">Sin imagen</span>
        )}
      </div>
      
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{product.category}</p>
          <h3 className="text-sm font-semibold text-gray-800 leading-tight line-clamp-2">{product.name}</h3>
          {product.description && (
            <p className="text-xs text-gray-500 mt-1 truncate">{product.description}</p>
          )}
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <span className="text-lg font-bold text-green-700">${product.price.toLocaleString('es-AR')}</span>
          <button 
            onClick={() => addToCart(product)}
            disabled={product.stock <= 0} // Deshabilita si no hay stock
            className={`font-semibold py-1.5 px-4 rounded text-sm transition-all shadow-sm ${
              product.stock > 0 
                ? 'bg-green-600 hover:bg-green-700 active:scale-95 text-white' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {product.stock > 0 ? '+ Agregar' : 'Sin Stock'}
          </button>
        </div>
      </div>
    </div>
  )
}