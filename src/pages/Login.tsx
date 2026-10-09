import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { supabase } from '../config/supabase'; // Importamos supabase para escuchar eventos

export const Login = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false); // Estado para saber si estamos cambiando la clave
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [dni, setDni] = useState('');
  const [phone, setPhone] = useState('');
  
  const navigate = useNavigate();

  // Escuchamos si el usuario entra desde el link del mail
  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsUpdatingPassword(true);
      }
    });
  }, []);

  // Función para mandar el link al correo
  const handleResetPasswordRequest = async () => {
    if (!email) {
      alert("Por favor, escribí tu email en el cuadro de arriba y tocá 'Olvidé mi contraseña'.");
      return;
    }
    try {
      await authService.resetPassword(email);
      alert("Te enviamos un correo. Hacé clic en el enlace para cambiar tu contraseña.");
    } catch (error: any) {
      alert("Error al enviar el correo: " + error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    try {
      if (isUpdatingPassword) {
        // FLUJO 3: GUARDAR NUEVA CONTRASEÑA
        await authService.updatePassword(password);
        alert("¡Contraseña actualizada con éxito! Ahora podés iniciar sesión.");
        setIsUpdatingPassword(false);
        setPassword('');
        await authService.logout(); // Cerramos la sesión temporal de recuperación
      } 
      else if (isRegistering) {
        // FLUJO 1: REGISTRO
        await authService.registerUser(email, password, name, dni, phone);
        alert("¡Cuenta creada exitosamente! Ahora podés iniciar sesión.");
        setIsRegistering(false);
        setPassword('');
      } else {
        // FLUJO 2: LOGIN NORMAL
        const profile = await authService.loginUser(email, password);
        localStorage.setItem('user_profile', JSON.stringify(profile));
        
        if (profile.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/catalogo');
        }
      }
    } catch (error: any) {
      setErrorMsg(error.message || "Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-gray-900 rounded-xl shadow-2xl p-8 border border-gray-800">
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="SA Scotto Accesorios" className="h-24 object-contain" />
        </div>
        
        <h2 className="text-center text-white text-xl font-bold mb-6">
          {isUpdatingPassword ? 'Ingresá tu nueva contraseña' : (isRegistering ? 'Crear Nueva Cuenta' : 'Iniciar Sesión')}
        </h2>

        {errorMsg && (
          <div className="bg-red-900 border border-red-500 text-white px-4 py-2 rounded mb-4 text-sm text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Si NO estamos cambiando la clave, mostramos los campos normales */}
          {!isUpdatingPassword && (
            <>
              {isRegistering && (
                <>
                  <div>
                    <label className="block text-gray-400 text-xs font-bold mb-1">Nombre Completo</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-yellow-600 focus:outline-none" />
                  </div>
                  <div className="flex gap-2">
                    <div className="w-1/2">
                      <label className="block text-gray-400 text-xs font-bold mb-1">DNI</label>
                      <input type="text" value={dni} onChange={(e) => setDni(e.target.value)} required className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-yellow-600 focus:outline-none" />
                    </div>
                    <div className="w-1/2">
                      <label className="block text-gray-400 text-xs font-bold mb-1">Teléfono</label>
                      <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} required className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-yellow-600 focus:outline-none" />
                    </div>
                  </div>
                </>
              )}
              <div>
                <label className="block text-gray-400 text-xs font-bold mb-1">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-yellow-600 focus:outline-none" />
              </div>
            </>
          )}

          {/* El campo de contraseña se muestra siempre, pero cambia de nombre si estamos actualizando */}
          <div>
            <label className="block text-gray-400 text-xs font-bold mb-1">
              {isUpdatingPassword ? 'Nueva Contraseña (Mín. 6 caracteres)' : 'Contraseña (Mín. 6 caracteres)'}
            </label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-yellow-600 focus:outline-none" />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-600 text-black font-bold py-3 px-4 rounded transition-colors mt-2"
          >
            {loading ? 'Cargando...' : (isUpdatingPassword ? 'GUARDAR NUEVA CONTRASEÑA' : (isRegistering ? 'REGISTRARME' : 'INGRESAR'))}
          </button>
        </form>

        {/* Botones de abajo, se ocultan si estamos en medio de cambiar la clave */}
        {!isUpdatingPassword && (
          <div className="mt-6 text-center flex flex-col gap-3">
            <button 
              type="button" 
              onClick={() => {
                setIsRegistering(!isRegistering);
                setErrorMsg('');
              }} 
              className="text-gray-400 hover:text-white text-sm transition-colors underline"
            >
              {isRegistering ? '¿Ya tenés cuenta? Iniciar Sesión' : '¿No tenés cuenta? Crear cuenta'}
            </button>

            {!isRegistering && (
              <button 
                type="button"
                onClick={handleResetPasswordRequest}
                className="text-yellow-600 hover:text-yellow-500 text-sm transition-colors"
              >
                Olvidé mi contraseña
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};