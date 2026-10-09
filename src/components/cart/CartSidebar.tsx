import { useCart } from '../../context/CartContext';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const CartSidebar = () => {
  const { cart, removeFromCart, updateQuantity, total } = useCart();
  
  // Reemplazá este número por el de tu cliente SA Scotto
  const vendorPhone = "5491100000000"; 

  // --- 1. Enviar por WhatsApp (Directo a la app móvil o web) ---
  const handleWhatsApp = () => {
    if (cart.length === 0) return;
    
    let text = "Hola SA Scotto, te paso mi pedido:\n\n";
    cart.forEach(item => {
      text += `* ${item.quantity}x ${item.name} ($${(item.price * item.quantity).toLocaleString('es-AR')})\n`;
    });
    text += `\n*Total estimado: $${total.toLocaleString('es-AR')}*`;

    // Usar api.whatsapp.com suele abrir la app directamente en celulares
    const url = `https://api.whatsapp.com/send/?phone=${vendorPhone}&text=${encodeURIComponent(text)}&type=phone_number&app_absent=0`;
    window.open(url, '_blank');
  };

 // --- 2. Exportar a Excel ---
  const handleExportExcel = () => {
    if (cart.length === 0) return;

    // Agregamos ": any[]" para permitir números y texto en la misma columna
    const dataToExport: any[] = cart.map(item => ({
      'Categoría': item.category,
      'Producto': item.name,
      'Cantidad': item.quantity,
      'Precio Unitario': `$${item.price.toLocaleString('es-AR')}`,
      'Subtotal': `$${(item.price * item.quantity).toLocaleString('es-AR')}`
    }));

    // Agregamos la fila del total al final
    dataToExport.push({
      'Categoría': '',
      'Producto': '',
      'Cantidad': 'TOTAL:',
      'Precio Unitario': '',
      'Subtotal': `$${total.toLocaleString('es-AR')}`
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pedido");
    
    // Genera y descarga el archivo
    XLSX.writeFile(workbook, "Pedido_SAScotto.xlsx");
  };

  // --- 3. Exportar a PDF ---
  const handleExportPDF = () => {
    if (cart.length === 0) return;

    const doc = new jsPDF();
    
    // Título del PDF
    doc.setFontSize(18);
    doc.text("Pedido - SA Scotto Accesorios", 14, 22);
    doc.setFontSize(11);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-AR')}`, 14, 30);

    // Tabla de productos
    const tableData = cart.map(item => [
      item.name,
      item.quantity.toString(),
      `$${item.price.toLocaleString('es-AR')}`,
      `$${(item.price * item.quantity).toLocaleString('es-AR')}`
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Producto', 'Cant.', 'Precio Unit.', 'Subtotal']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [220, 38, 38] }, // Color rojo oscuro para el encabezado
    });

    // Total final
    const finalY = (doc as any).lastAutoTable.finalY || 40;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`Total: $${total.toLocaleString('es-AR')}`, 14, finalY + 10);

    doc.save("Pedido_SAScotto.pdf");
  };

  return (
    <aside className="w-[350px] bg-gray-900 text-white flex flex-col shadow-2xl h-full border-l border-gray-800 flex-shrink-0">
      <div className="p-4 border-b border-gray-700 bg-gray-950">
        <h2 className="text-lg font-bold flex items-center gap-2">
          🛒 Pedido Actual
        </h2>
      </div>

      {/* Lista de items en el carrito */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {cart.length === 0 ? (
          <p className="text-gray-400 text-sm text-center mt-10">El carrito está vacío.</p>
        ) : (
          cart.map((item) => (
            <div key={item.id} className="bg-gray-800 p-3 rounded border border-gray-700">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold line-clamp-2 pr-2">{item.name}</span>
                <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-300 text-sm font-bold">
                  ✕
                </button>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 bg-gray-900 rounded px-2 py-1">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="text-gray-400 hover:text-white px-1">-</button>
                  <span className="text-sm w-4 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="text-gray-400 hover:text-white px-1">+</button>
                </div>
                <span className="text-sm text-green-400 font-bold">
                  ${(item.price * item.quantity).toLocaleString('es-AR')}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Botonera inferior */}
      <div className="p-4 bg-gray-950 border-t border-gray-700 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Total estim.:</span>
          <span className="text-xl font-bold text-white">${total.toLocaleString('es-AR')}</span>
        </div>
        
        {/* Botones de acción */}
        <button 
          onClick={handleWhatsApp}
          disabled={cart.length === 0}
          className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold py-2 px-4 rounded transition-colors flex justify-center items-center gap-2"
        >
          Enviar por WhatsApp
        </button>

        <div className="flex gap-2">
          <button 
            onClick={handleExportPDF}
            disabled={cart.length === 0}
            className="flex-1 bg-red-700 hover:bg-red-600 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold py-2 px-2 rounded text-sm transition-colors"
          >
            Bajar PDF
          </button>
          <button 
            onClick={handleExportExcel}
            disabled={cart.length === 0}
            className="flex-1 bg-blue-700 hover:bg-blue-600 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold py-2 px-2 rounded text-sm transition-colors"
          >
            Bajar Excel
          </button>
        </div>
      </div>
    </aside>
  );
};