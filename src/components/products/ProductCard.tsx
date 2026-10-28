import { useState } from 'react';
import { useCart } from '../../context/CartContext';
import type { Product } from '../../models/product.model';

interface Props {
  product: Product;
}

export const ProductCard = ({ product }: Props) => {
  const { addToCart } = useCart();
  const [isZoomed, setIsZoomed] = useState(false); // Estado para controlar si la foto está ampliada

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4 shadow-sm flex items-center gap-4">
        {/* Contenedor de la Imagen */}
        <div className="w-20 h-20 md:w-24 md:h-24 flex-shrink-0 relative">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              onClick={() => setIsZoomed(true)}
              className="w-full h-full object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
              title="Clic para ampliar"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded border text-xs text-gray-400 text-center p-2">
              Sin imagen
            </div>
          )}
        </div>
        
        {/* Textos del Producto */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{product.category}</p>
          <h3 className="font-bold text-gray-800 text-sm md:text-base leading-tight mt-1">{product.name}</h3>
          {product.description && (
            <p className="text-xs text-gray-500 mt-1 uppercase truncate">{product.description}</p>
          )}
          <div className="mt-2 text-green-700 font-bold text-base md:text-lg">
            ${product.price.toLocaleString('es-AR')}
          </div>
        </div>

        {/* Botón Agregar */}
        <div className="flex-shrink-0">
          <button
            onClick={() => addToCart(product)}
            className="bg-green-600 hover:bg-green-700 text-white px-3 md:px-4 py-2 rounded text-sm md:text-base font-bold shadow transition-colors whitespace-nowrap"
          >
            + Agregar
          </button>
        </div>
      </div>

      {/* MODAL DE ZOOM (Se muestra solo si isZoomed es true) */}
      {isZoomed && product.image_url && (
        <div 
          className="fixed inset-0 z-[100] bg-black bg-opacity-80 flex items-center justify-center p-4 cursor-pointer backdrop-blur-sm transition-all"
          onClick={() => setIsZoomed(false)}
        >
          <div className="relative max-w-4xl max-h-screen flex justify-center items-center">
            <img
              src={product.image_url}
              alt={product.name}
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl cursor-default border-2 border-gray-700"
              onClick={(e) => e.stopPropagation()} 
            />
            {/* Botón Cerrar (Cruz) */}
            <button 
              onClick={() => setIsZoomed(false)}
              className="absolute -top-12 right-0 md:-right-12 text-white hover:text-red-500 transition-colors"
              title="Cerrar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};