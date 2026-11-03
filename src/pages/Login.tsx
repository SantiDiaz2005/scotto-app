import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // CAMPOS RECUPERADOS PARA EL REGISTRO
  const [name, setName] = useState('');
  const [dni, setDni] = useState('');
  const [phone, setPhone] = useState('');
  
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
        // 1. Guardamos correo y contraseña en seguridad
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        
        // 2. Armamos la ficha completa en tu tabla 'profiles' automáticamente
        if (data.user) {
          const { error: profileError } = await supabase.from('profiles').insert([{
            id: data.user.id,
            email: email,
            name: name,
            dni: dni,
            phone: phone,
            role: 'cliente',
            is_active: true
          }]);
          
          if (profileError) throw profileError;
        }

        alert('Cuenta creada exitosamente. Ya podés iniciar sesión.');
        setIsRegistering(false);
        setPassword('');
      } else {
        // INICIO DE SESIÓN
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profile) {
          localStorage.setItem('user_profile', JSON.stringify(profile));
          if (profile.role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/catalogo');
          }
        } else {
          navigate('/catalogo');
        }
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
      <div className="absolute inset-0 bg-black/40 z-0"></div>

      <div className="max-w-sm w-full bg-gray-900 rounded-xl shadow-2xl p-6 border border-gray-800 z-10 relative">
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="SA Scotto Accesorios" className="h-24 md:h-28 object-contain" />
        </div>

        <h2 className="text-center text-white text-lg md:text-xl font-bold mb-4">
          {isRegistering ? 'Crear Nueva Cuenta' : 'Iniciar Sesión'}
        </h2>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-2 rounded mb-4 text-sm text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          
          {/* CAMPOS QUE APARECEN SOLO AL REGISTRARSE */}
          {isRegistering && (
            <>
              <div>
                <label className="block text-gray-400 text-xs font-bold mb-1">Nombre y Apellido / Razón Social</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-yellow-600 text-sm"
                  required
                />
              </div>
              <div className="flex gap-2">
                <div className="w-1/2">
                  <label className="block text-gray-400 text-xs font-bold mb-1">DNI / CUIT</label>
                  <input 
                    type="text" 
                    value={dni}
                    onChange={(e) => setDni(e.target.value)}
                    className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-yellow-600 text-sm"
                    required
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-gray-400 text-xs font-bold mb-1">Teléfono</label>
                  <input 
                    type="text" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-yellow-600 text-sm"
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-gray-400 text-xs font-bold mb-1">Correo electrónico</label>
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

        <div className="mt-5 flex flex-col items-center gap-2 text-sm">
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-gray-400 hover:text-white underline transition-colors"
          >
            {isRegistering ? '¿Ya tienes cuenta? Iniciar sesión' : '¿No tienes cuenta? Crear cuenta'}
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