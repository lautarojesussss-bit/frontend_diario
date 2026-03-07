import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({ username: '', password: '' });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // Maneja tanto el login como el registro dependiendo del endpoint que le pasemos
  const handleSubmit = async (e, endpoint) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Nota: asumo que tu prefijo en app.py es /auth
      const res = await fetch(`http://localhost:5000/auth/api/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include" // CLAVE para que envíe/reciba las cookies de sesión
      });
      
      const data = await res.json();
      if (res.ok) {
        onLoginSuccess(data.username);
      } else {
        setError(data.message || "Ocurrió un error");
      }
    } catch (err) {
      setError("Error de conexión con el servidor");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md rounded-2xl shadow-sm border-slate-200">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto bg-slate-900 w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-sm">
            <LayoutDashboard className="text-white h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">Bienvenido</CardTitle>
          <CardDescription>Gestiona tu tiempo y hábitos diarios</CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-100 rounded-xl p-1">
              <TabsTrigger value="login" className="rounded-lg">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="register" className="rounded-lg">Registrarse</TabsTrigger>
            </TabsList>

            {/* PESTAÑA LOGIN */}
            <TabsContent value="login">
              <form onSubmit={(e) => handleSubmit(e, "login")} className="flex flex-col gap-4">
                {error && <p className="text-sm text-red-500 text-center font-medium bg-red-50 py-2 rounded-lg">{error}</p>}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">Usuario</label>
                  <Input name="username" required onChange={handleChange} className="rounded-xl" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">Contraseña</label>
                  <Input name="password" type="password" required onChange={handleChange} className="rounded-xl" />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full rounded-xl bg-slate-900 mt-2">
                  {isLoading ? "Cargando..." : "Entrar"}
                </Button>
              </form>
            </TabsContent>

            {/* PESTAÑA REGISTRO */}
            <TabsContent value="register">
              <form onSubmit={(e) => handleSubmit(e, "register")} className="flex flex-col gap-4">
                {error && <p className="text-sm text-red-500 text-center font-medium bg-red-50 py-2 rounded-lg">{error}</p>}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">Nuevo Usuario</label>
                  <Input name="username" required onChange={handleChange} className="rounded-xl" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">Contraseña</label>
                  <Input name="password" type="password" required onChange={handleChange} className="rounded-xl" />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full rounded-xl bg-slate-900 mt-2">
                  {isLoading ? "Creando..." : "Crear Cuenta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}