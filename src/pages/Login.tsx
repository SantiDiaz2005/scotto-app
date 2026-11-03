import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isRegistering) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Cuenta creada. Ya podés iniciar sesión.');
        setIsRegistering(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/catalogo');
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col justify-center items-center p-4 relative"
      style={{ 
        backgroundImage: "url('/banner-marcas.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Capa oscura/borrosa para que resalte el cuadro azul oscuro */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-0"></div>

      {/* CUADRO DE LOGIN (Más compacto) */}
      <div className="max-w-sm w-full bg-gray-900 rounded-xl shadow-2xl p-6 border border-gray-800 z-10 relative">
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="SA Scotto Accesorios" className="h-24 md:h-28 object-contain" />
        </div>

        <h2 className="text-center text-white text-lg md:text-xl font-bold mb-6">
          {isRegistering ? 'Crear Nueva Cuenta' : 'Iniciar Sesión'}
        </h2>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-2 rounded mb-4 text-sm text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-400 text-xs font-bold mb-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-yellow-600 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-gray-400 text-xs font-bold mb-1">Contraseña (Mín. 6 caracteres)</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-yellow-600 text-sm"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-2 rounded mt-2 transition-colors disabled:opacity-50"
          >
            {loading ? 'Cargando...' : (isRegistering ? 'REGISTRARSE' : 'INGRESAR')}
          </button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-2 text-sm">
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-gray-400 hover:text-white underline transition-colors"
          >
            {isRegistering ? '¿Ya tenés cuenta? Iniciar sesión' : '¿No tenés cuenta? Crear cuenta'}
          </button>
          
          {!isRegistering && (
            <button className="text-yellow-600 hover:text-yellow-500 transition-colors text-xs">
              Olvidé mi contraseña
            </button>
          )}
        </div>
      </div>
    </div>
  );
};