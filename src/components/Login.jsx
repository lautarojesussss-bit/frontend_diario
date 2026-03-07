import { useState } from 'react';

// Le pasamos una "prop" llamada onLoginSuccess que ejecutaremos cuando el login sea exitoso
function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault(); // Evitamos que la página se recargue al mandar el formulario

    try {
      const response = await fetch("http://localhost:5000/auth/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // ¡ESTA ES LA LÍNEA MÁGICA! 
        // Le dice al navegador: "Guardá y enviá las cookies de sesión de Flask"
        credentials: "include", 
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.status === "success") {
        // Si sale bien, avisamos a App.jsx que ya estamos logueados
        onLoginSuccess();
      } else {
        // Si sale mal, mostramos el mensaje de error de Flask
        setError(data.message);
      }
    } catch (err) {
      setError("Error al conectar con el servidor");
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2 style={{ textAlign: 'center' }}>Iniciar Sesión</h2>
      
      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label>Nombre de usuario:</label>
          <input 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            required 
          />
        </div>
        <div>
          <label>Contraseña:</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            required 
          />
        </div>
        <button type="submit" style={{ padding: '10px', backgroundColor: '#0d6efd', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Ingresar
        </button>
      </form>
    </div>
  );
}

export default Login;