import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const CartSidebar = () => {
  const { items, removeFromCart, updateQuantity, getTotal, clearCart } = useCart();
  const [isOpen, setIsOpen] = useState(false);

  // ---------- FUNCIÓN: DESCARGAR PDF ----------
  const generatePDF = () => {
    if (items.length === 0) return;

    const doc = new jsPDF();
    
    // Título y fecha
    doc.setFontSize(18);
    doc.text("Pedido - SA Scotto", 14, 22);
    
    doc.setFontSize(11);
    const date = new Date().toLocaleDateString('es-AR');
    doc.text(`Fecha: ${date}`, 14, 30);

    // Armamos los datos para la tabla
    const tableColumn = ["Producto", "Cantidad", "Precio Unitario", "Subtotal"];
    const tableRows: any[] = [];

    items.forEach(item => {
      const productData = [
        item.product.name,
        item.quantity,
        `$${item.product.price.toLocaleString('es-AR')}`,
        `$${(item.product.price * item.quantity).toLocaleString('es-AR')}`
      ];
      tableRows.push(productData);
    });

    // Dibujamos la tabla usando el plugin autotable
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] } // Color azul oscuro de la app
    });

    // Total al final
    const finalY = (doc as any).lastAutoTable.finalY || 40;
    doc.setFontSize(14);
    doc.text(`TOTAL ESTIMADO: $${getTotal().toLocaleString('es-AR')}`, 14, finalY + 15);

    doc.save("pedido_scotto.pdf");
  };

  // ---------- FUNCIÓN: DESCARGAR EXCEL ----------
  const downloadExcel = () => {
    if (items.length === 0) return;

    // Armamos un array de objetos (cada objeto es una fila del Excel)
    const excelData = items.map(item => ({
      Producto: item.product.name,
      Categoría: item.product.category,
      Cantidad: item.quantity,
      'Precio Unit.': item.product.price,
      Subtotal: item.product.price * item.quantity
    }));

    // Agregamos una fila en blanco y luego la del Total General
    excelData.push({ Producto: '', Categoría: '', Cantidad: 0, 'Precio Unit.': 0, Subtotal: 0 });
    excelData.push({
      Producto: 'TOTAL GENERAL',
      Categoría: '',
      Cantidad: 0,
      'Precio Unit.': 0,
      Subtotal: getTotal()
    });

    // Creamos el archivo Excel
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pedido");

    // Lo descargamos
    XLSX.writeFile(workbook, "pedido_scotto.xlsx");
  };

  // ---------- FUNCIÓN: ENVIAR WHATSAPP ----------
  const sendWhatsApp = () => {
    const phoneNumber = "5493512254595"; 
    
    let message = "Hola SA Scotto, quiero hacer el siguiente pedido:\n\n";

    items.forEach(item => {
      // Usamos viñetas y formato más compacto
      message += `▪️ ${item.quantity} x ${item.product.name} ($${item.product.price.toLocaleString('es-AR')})\n`;
    });

    // Total en negritas sin frases extra largas
    message += `\n*Total estimado: $${getTotal().toLocaleString('es-AR')}*`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
  };

  return (
    <React.Fragment>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="md:hidden fixed bottom-6 right-6 bg-yellow-600 text-black p-4 rounded-full shadow-2xl z-50 flex items-center justify-center font-bold border-2 border-black"
        >
          🛒 <span className="ml-2 bg-black text-white px-2 rounded-full text-sm">{items.length}</span>
        </button>
      )}

      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`
        fixed inset-y-0 right-0 z-50 w-5/6 max-w-sm bg-[#0F172A] border-l border-gray-700 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 md:w-96
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        
        <div className="p-4 bg-[#1E293B] border-b border-gray-700 flex justify-between items-center text-white">
          <h2 className="text-xl font-bold flex items-center gap-2">🛒 Pedido Actual</h2>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-gray-400 hover:text-white text-2xl font-bold p-2">✕</button>
        </div>

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