import { useState, useEffect } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO } from 'date-fns';
import { Loader2 } from 'lucide-react';

export default function Graficos() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGraficos = async () => {
      try {
        const res = await fetch(`http://${window.location.hostname}:5000/api/progreso_graficos`, { credentials: "include" });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error("Error trayendo gráficos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGraficos();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!data) return <p className="text-center text-slate-500">No hay datos para mostrar.</p>;

  // Función para formatear las fechas en el eje X ("14 Jun")
  const formatearFecha = (isoString) => format(parseISO(isoString), "dd MMM");

  // Componente interno para reutilizar el mismo diseño en ambos gráficos
// Componente interno para reutilizar el mismo diseño en ambos gráficos
// Agregamos 'id' a las propiedades que recibe
  const ChartPersonalizado = ({ id, titulo, meta, datos, colorBase }) => {
    
    // Usamos el ID limpio que le pasamos a mano
    const gradientId = `color-${id}`;

    return (
      <Card className="w-full rounded-2xl shadow-sm border-slate-200 mb-8 overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold text-slate-800">{titulo}</CardTitle>
          <CardDescription>Meta a largo plazo: {meta} horas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={datos} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colorBase} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={colorBase} stopOpacity={0} />
                  </linearGradient>
                </defs>
                
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatearFecha} 
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  dy={10}
                  minTickGap={30} /* <-- TRUCO PARA QUE LAS FECHAS NO SE SUPERPONGAN */
                />
                <YAxis 
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />
                
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelFormatter={(label) => formatearFecha(label)}
                  formatter={(value) => [`${value} hs`, "Acumulado"]}
                />
                
                <Area 
                  type="monotone" 
                  dataKey="horas" 
                  stroke={colorBase} 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill={`url(#${gradientId})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  };

return (
    <div className="animate-in fade-in duration-500">
      <ChartPersonalizado 
        id="programacion" // <--- ID limpio sin tildes ni espacios
        titulo="Horas de Programación" 
        meta={data.programacion.meta} 
        datos={data.programacion.datos} 
        colorBase="#0f172a" 
      />
      <ChartPersonalizado 
        id="ejercicio" // <--- ID limpio sin tildes ni espacios
        titulo="Horas de Actividad Física" 
        meta={data.ejercicio.meta} 
        datos={data.ejercicio.datos} 
        colorBase="#22c55e" 
      />
    </div>
  );
}