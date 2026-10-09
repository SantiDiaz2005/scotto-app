import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';

export const CartSidebar = () => {
  const { items, removeFromCart, updateQuantity, getTotal, clearCart } = useCart();
  const [isOpen, setIsOpen] = useState(false);

  const generatePDF = () => {
    alert("Próximamente: Generar PDF");
  };

  const sendWhatsApp = () => {
    alert("Próximamente: Enviar por WhatsApp");
  };

  const downloadExcel = () => {
    alert("Próximamente: Bajar Excel");
  };

  return (
    <React.Fragment>
      {/* Botón flotante SOLO visible en celular */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="md:hidden fixed bottom-6 right-6 bg-yellow-600 text-black p-4 rounded-full shadow-2xl z-50 flex items-center justify-center font-bold border-2 border-black"
        >
          🛒 <span className="ml-2 bg-black text-white px-2 rounded-full text-sm">{items.length}</span>
        </button>
      )}

      {/* Fondo oscuro para cuando se abre en celular */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Contenedor del carrito */}
      <div className={`
        fixed inset-y-0 right-0 z-50 w-5/6 max-w-sm bg-[#0F172A] border-l border-gray-700 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 md:w-96
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        
        {/* Cabecera */}
        <div className="p-4 bg-[#1E293B] border-b border-gray-700 flex justify-between items-center text-white">
          <h2 className="text-xl font-bold flex items-center gap-2">🛒 Pedido Actual</h2>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-gray-400 hover:text-white text-2xl font-bold p-2">✕</button>
        </div>

        {/* Lista de productos */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <p>El carrito está vacío.</p>
            </div>
          ) : (
            items.map(item => (
              <div key={item.product.id} className="bg-[#1E293B] p-3 rounded-lg border border-gray-700 shadow-sm relative pr-10">
                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="absolute top-2 right-2 text-red-400 hover:text-red-300 bg-red-900 bg-opacity-30 p-1 rounded transition-colors"
                  title="Eliminar producto"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-white text-sm leading-tight pr-6">{item.product.name}</span>
                  <span className="text-yellow-500 font-bold">${item.product.price.toLocaleString('es-AR')} c/u</span>
                </div>
                <div className="flex items-center gap-3 mt-3 bg-gray-900 p-1 rounded-md w-fit">
                  <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-white font-bold transition-colors">-</button>
                  <span className="font-bold w-6 text-center text-white">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-white font-bold transition-colors">+</button>
                </div>
                <div className="mt-2 text-right text-gray-300 font-semibold text-sm">
                  Subtotal: ${(item.product.price * item.quantity).toLocaleString('es-AR')}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totales y Botones */}
        <div className="p-4 bg-[#1E293B] border-t border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-300 font-semibold">Total estim.:</span>
            <span className="text-2xl font-bold text-white">${getTotal().toLocaleString('es-AR')}</span>
          </div>

          <div className="space-y-2">
            <button
              onClick={sendWhatsApp}
              disabled={items.length === 0}
              className="w-full bg-[#128C7E] hover:bg-[#075E54] text-white font-bold py-3 px-4 rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Enviar por WhatsApp
            </button>
            <div className="flex gap-2">
              <button
                onClick={generatePDF}
                disabled={items.length === 0}
                className="w-1/2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Bajar PDF
              </button>
              <button
                onClick={downloadExcel}
                disabled={items.length === 0}
                className="w-1/2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Bajar Excel
              </button>
            </div>
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="w-full mt-2 text-red-400 hover:text-red-300 text-sm font-semibold underline py-1"
              >
                Vaciar Carrito
              </button>
            )}
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};