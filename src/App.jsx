import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar"
import Graficos from './components/Graficos'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card" 

// 1. IMPORTAMOS TODOS LOS ÍCONOS EN UNA SOLA LÍNEA AQUÍ:
import { Calendar as CalendarIcon, Check, ChevronsUpDown, Search, Plus, X, LayoutDashboard, LogOut, User as UserIcon, Loader2, LineChart } from 'lucide-react'

import AchievementItem from './components/AchievementItem'
import Login from './components/Login'

// 2. Todos los componentes premium
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
function App() {
  const [eventos, setEventos] = useState([]);
  const [categorias, setCategorias] = useState([]); // Para guardar las opciones del Select
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const fileInputRef = useRef(null); // Esto es para hacer clic en el input invisible
  const [loading, setLoading] = useState(true);
  const [vistaActual, setVistaActual] = useState("diario"); // "diario" o "graficos"

  // --- ESTADOS DE LOS FILTROS ---
  const [fechaFiltro, setFechaFiltro] = useState(new Date()); // Arranca en hoy
  const [categoriaFiltro, setCategoriaFiltro] = useState("todas");
  const [busqueda, setBusqueda] = useState("");
  const [debouncedBusqueda, setDebouncedBusqueda] = useState("");
  const [openCategoria, setOpenCategoria] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [progresoCorto, setProgresoCorto] = useState([]);
  const [progresoLargo, setProgresoLargo] = useState([]);
  const [visiblesCorto, setVisiblesCorto] = useState(['Programación']); // Guarda qué tarjetas de corto plazo están prendidas
  const [visiblesLargo, setVisiblesLargo] = useState(['Programación largo plazo']); // Guarda qué tarjetas de largo plazo están prendidas
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({
    fecha: '',
    hora: '',
    descripcion: '',
    categoria: '',
    tamano_bloque: ''
  });

  // Función para abrir el modal con la hora y fecha actual
  const abrirModalAgregar = () => {
    const now = new Date();
    setAddFormData({
      fecha: format(now, 'yyyy-MM-dd'), // Fecha de hoy
      hora: format(now, 'HH:mm'),       // Hora de este mismo instante
      descripcion: '',
      categoria: '',
      tamano_bloque: ''
    });
    setIsAddOpen(true);
  };

  // Efecto para escuchar el atajo Ctrl + N (o Cmd + N en Mac)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 1. ESTO ES EL DETECTIVE: Te va a imprimir en la consola cada tecla que toques
      console.log("Detectando tecla ->", "Key:", e.key, "| Code:", e.code, "| Alt presionado:", e.altKey);

      // 2. Probemos con Alt + A (KeyA) por si la N está bloqueada por Windows
      if (e.altKey && (e.code === 'KeyA' || e.code === 'KeyN')) {
        e.preventDefault(); 
        abrirModalAgregar();
      }
    };
    
    // Lo atamos al documento entero en la fase de captura para que tenga más prioridad
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  // Función para enviar el nuevo evento al backend
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const payload = new FormData();
    Object.keys(addFormData).forEach(k => payload.append(k, addFormData[k]));

    try {
      const res = await fetch("http://localhost:5000/agregar_evento", {
        method: "POST",
        body: payload,
        credentials: "include"
      });
      if (res.ok) {
        setIsAddOpen(false);
        fetchEventos();
        fetchProgreso(); // Recargamos la tabla
        fetchCategorias(); // Por si agregó una categoría nueva
      }
    } catch (error) {
      console.error("Error al crear:", error);
    }
  };


  const handleLogout = async () => {
    try {
      await fetch("http://localhost:5000/auth/api/logout", { method: "POST", credentials: "include" });
      setIsLoggedIn(false);
      setUsername("");
      setEventos([]);
    } catch (error) {
      console.error("Error al salir", error);
    }
  };
  
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Usamos FormData para empaquetar el archivo como si fuera un formulario HTML real
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await fetch("http://localhost:5000/auth/api/upload_avatar", {
        method: "POST",
        body: formData,
        credentials: "include"
      });
      const data = await res.json();
      
      if (res.ok) {
        setAvatarUrl(data.avatar_url); // Actualizamos la foto en pantalla al instante!
      } else {
        alert("Error al subir imagen: " + data.message);
      }
    } catch (error) {
      console.error("Error subiendo avatar", error);
    }
  };  

  const handleAddChange = (e) => {
    setAddFormData({ ...addFormData, [e.target.name]: e.target.value });
  };

  // Función para traer categorías
  const fetchCategorias = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/categorias", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setCategorias(data);
      }
    } catch (error) {
      console.error("Error al traer categorías:", error);
    }
  };

  // Función modificada para mandar todos los filtros a tu backend
  const fetchEventos = async () => {
    setIsFetching(true); // <-- 1. Al instante ponemos la tabla borrosa
    try {
      let url = new URL("http://localhost:5000/api/eventos");
      
      if (fechaFiltro) url.searchParams.append("fecha", format(fechaFiltro, 'yyyy-MM-dd'));
      if (categoriaFiltro !== "todas") url.searchParams.append("categoria", categoriaFiltro);
      if (debouncedBusqueda.trim() !== "") url.searchParams.append("search", debouncedBusqueda);

      const response = await fetch(url.toString(), { credentials: "include" });
      
      if (response.ok) {
        const data = await response.json();
        setEventos(data); 
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error("Hubo un problema:", error);
      setIsLoggedIn(false);
    } finally {
      setIsFetching(false); // <-- 2. Le devolvemos el color a la tabla
      setLoading(false);
    }
  };

const fetchProgreso = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/progreso", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setProgresoCorto(data.corto_plazo || []);
        setProgresoLargo(data.largo_plazo || []);
      }
    } catch (error) {
      console.error("Error al traer progreso:", error);
    }
  };  

// 1. Carga inicial (Ahora con verificación de sesión)
  useEffect(() => {
    const verificarSesion = async () => {
      try {
        const res = await fetch("http://localhost:5000/auth/api/check_auth", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setUsername(data.username);
          setAvatarUrl(data.avatar_url || "");
          setIsLoggedIn(true);
          // Si está logueado, traemos la info
          fetchCategorias();
          fetchEventos();
          fetchProgreso();
        } else {
          setIsLoggedIn(false);
          setLoading(false);
        }
      } catch (error) {
        setIsLoggedIn(false);
        setLoading(false);
      }
    };
    verificarSesion();
  }, []);

  // 2. NUEVO: Efecto exclusivo para hacer debouncing solo del texto
  useEffect(() => {
    const temporizador = setTimeout(() => {
      setDebouncedBusqueda(busqueda);
    }, 300);

    return () => clearTimeout(temporizador);
  }, [busqueda]); // Solo reacciona cuando cambia el texto

  // 3. Efecto principal: Busca instantáneamente sin demoras
  useEffect(() => {
    if (isLoggedIn) {
      fetchEventos();
      fetchProgreso();
    }
  // Atento acá: usamos debouncedBusqueda en vez de busqueda
  }, [fechaFiltro, categoriaFiltro, debouncedBusqueda]);

    

  const limpiarFiltros = () => {
    setFechaFiltro(null); // Sin fecha = todos los días
    setCategoriaFiltro("todas");
    setBusqueda("");
  };

if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
        <p className="text-slate-500 font-medium text-sm">Cargando información...</p>
      </div>
    );
  }
  if (!isLoggedIn) {
    return (
      <Login 
        onLoginSuccess={(user, avatar) => { 
          setUsername(user);
          setAvatarUrl(avatar || "");        // <-- Guardamos el nombre de usuario
          setIsLoggedIn(true);      // <-- Le avisamos a la app que ya entramos
          setLoading(true);         // <-- Ponemos la pantalla de carga
          fetchCategorias();        // <-- Traemos sus datos
          fetchEventos(); 
          fetchProgreso();          // <-- (Y sumamos el progreso que antes no estaba)
        }} 
      />
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">

{/* --- CABECERA DE LA APP (Minimalista) --- */}
      <div className="flex justify-end items-center mb-6">
        
        <div className="flex items-center gap-4">
          {/* Solo el nombre de usuario, sin textos extra */}
          <span className="text-sm font-semibold text-slate-800">{username}</span>
          
          {/* HoverCard reemplaza al DropdownMenu */}
          <HoverCard openDelay={200} closeDelay={200}>
            <HoverCardTrigger asChild>
              {/* Agrupamos el avatar en un div cliqueable que dispara el input oculto */}
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                
                <Avatar className="h-10 w-10 border-2 border-transparent group-hover:border-slate-300 transition-colors">
                  {/* Si hay URL muestra la imagen, si no, las iniciales */}
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt="Avatar" className="object-cover" />
                  ) : (
                    <AvatarFallback className="bg-slate-900 text-white font-medium">
                      {username ? username.substring(0, 2).toUpperCase() : <UserIcon className="h-4 w-4" />}
                    </AvatarFallback>
                  )}
                </Avatar>

                {/* Capa oscura al pasar el mouse indicando que se puede cambiar la foto */}
                <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <span className="text-[10px] text-white font-semibold">Editar</span>
                </div>

                {/* El input real que hace el trabajo, pero está invisible */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </HoverCardTrigger>
            
            <HoverCardContent align="end" className="w-48 p-2 rounded-xl shadow-md border-slate-100">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg" 
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </Button>
            </HoverCardContent>
          </HoverCard>
        </div>

      </div>

{/* --- BOTONES DE CONFIGURACIÓN DE DASHBOARD --- */}
      <div className="flex gap-4 mb-6">
        
        {/* HOVER CARD CORTO PLAZO */}
        <HoverCard openDelay={200} closeDelay={200}>
          <HoverCardTrigger asChild>
            <Button variant="outline" className="rounded-xl">
              Corto Plazo
            </Button>
          </HoverCardTrigger>
          <HoverCardContent className="w-56 rounded-xl p-1" align="start">
            <div className="px-2 py-1.5 text-sm font-semibold text-slate-900">Mostrar tarjetas diarias</div>
            <div className="h-px bg-slate-100 my-1 mx-2" />
            
            {progresoCorto.map((act) => {
              const isChecked = visiblesCorto.includes(act.titulo);
              return (
                <div
                  key={act.titulo}
                  className="relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors"
                  onClick={() => {
                    if (isChecked) setVisiblesCorto(visiblesCorto.filter(t => t !== act.titulo));
                    else setVisiblesCorto([...visiblesCorto, act.titulo]);
                  }}
                >
                  <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    {isChecked && <Check className="h-4 w-4 text-slate-900" />}
                  </span>
                  {act.titulo}
                </div>
              )
            })}
          </HoverCardContent>
        </HoverCard>

        {/* HOVER CARD LARGO PLAZO */}
        <HoverCard openDelay={200} closeDelay={200}>
          <HoverCardTrigger asChild>
            <Button variant="outline" className="rounded-xl">
              Largo Plazo
            </Button>
          </HoverCardTrigger>
          <HoverCardContent className="w-56 rounded-xl p-1" align="start">
            <div className="px-2 py-1.5 text-sm font-semibold text-slate-900">Mostrar tarjetas globales</div>
            <div className="h-px bg-slate-100 my-1 mx-2" />
            
            {progresoLargo.map((act) => {
              const isChecked = visiblesLargo.includes(act.titulo);
              return (
                <div
                  key={act.titulo}
                  className="relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors"
                  onClick={() => {
                    if (isChecked) setVisiblesLargo(visiblesLargo.filter(t => t !== act.titulo));
                    else setVisiblesLargo([...visiblesLargo, act.titulo]);
                  }}
                >
                  <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    {isChecked && <Check className="h-4 w-4 text-slate-900" />}
                  </span>
                  {act.titulo}
                </div>
              )
            })}
          </HoverCardContent>
        </HoverCard>

      </div>

      {/* --- GRID DE TARJETAS DE PROGRESO --- */}
      {(visiblesCorto.length > 0 || visiblesLargo.length > 0) && (
        <div className="flex flex-wrap gap-4 mb-8">
          
          {/* Tarjetas Corto Plazo (Blancas) */}
          {progresoCorto.filter(act => visiblesCorto.includes(act.titulo)).map(act => (
            <Card key={act.titulo} className="w-64 p-5 rounded-2xl shadow-sm bg-white border-slate-200 transition-all hover:shadow-md">
              <div className="flex flex-col gap-1">
                <h4 className="font-semibold text-slate-800">{act.titulo}</h4>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider truncate" title={act.categoria.join(', ')}>
                  {act.categoria.join(', ')}
                </p>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-slate-900">{(act.total_minutos / 60).toFixed(2)}</span>
                  <span className="text-sm font-medium text-slate-500">/ {(act.meta_minutos / 60).toFixed(0)} hs</span>
                </div>
                <div className="mt-4">
                  {/* Usamos tu color verde original */}
                  <Progress value={act.progreso_porcentaje} className="h-2" indicatorColor="bg-[#97f38bff]" />
                  <span className="text-xs font-semibold text-slate-600 mt-1.5 block text-right">
                    {Math.round(act.progreso_porcentaje)}%
                  </span>
                </div>
              </div>
            </Card>
          ))}

          {/* Tarjetas Largo Plazo (Fondo Gris Slate-50) */}
          {progresoLargo.filter(act => visiblesLargo.includes(act.titulo)).map(act => (
            <Card key={act.titulo} className="w-64 p-5 rounded-2xl shadow-sm bg-slate-50 border-slate-200 transition-all hover:shadow-md">
              <div className="flex flex-col gap-1">
                <h4 className="font-semibold text-slate-800">{act.titulo}</h4>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider truncate" title={act.categoria.join(', ')}>
                  {act.categoria.join(', ')}
                </p>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-slate-900">{(act.total_minutos / 60).toFixed(2)}</span>
                  <span className="text-sm font-medium text-slate-500">/ {(act.meta_minutos / 60).toFixed(0)} hs</span>
                </div>
                <div className="mt-4">
                  <Progress value={act.progreso_porcentaje} className="h-2" indicatorColor="bg-[#97f38bff]" />
                  <span className="text-xs font-semibold text-slate-600 mt-1.5 block text-right">
                    {Math.round(act.progreso_porcentaje)}%
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {/* --- CABECERA DE VISTAS Y ACCIÓN PRINCIPAL --- */}
      <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-2">
        
        {/* Izquierda: Selector de vistas (Tabs) */}
        <div className="flex gap-2">
          <Button 
            variant={vistaActual === "diario" ? "secondary" : "ghost"} 
            className={`rounded-xl px-5 ${vistaActual === "diario" ? "bg-slate-100 text-slate-900" : "text-slate-500"}`}
            onClick={() => setVistaActual("diario")}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Diario y Tabla
          </Button>
          <Button 
            variant={vistaActual === "graficos" ? "secondary" : "ghost"} 
            className={`rounded-xl px-5 ${vistaActual === "graficos" ? "bg-slate-100 text-slate-900" : "text-slate-500"}`}
            onClick={() => setVistaActual("graficos")}>
            <LineChart className="mr-2 h-4 w-4" />
            Estadísticas
          </Button>
        </div>

        {/* Derecha: Botón Global de Nuevo Evento */}
        <div className="flex items-center gap-3">
          <Button 
            onClick={abrirModalAgregar} 
            className="rounded-xl bg-slate-900 text-white hover:bg-slate-800 shadow-sm flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>Nuevo Evento</span>
          </Button>
          
          <div className="hidden sm:flex items-center gap-1 text-slate-400">
            <kbd className="inline-flex items-center justify-center rounded border border-slate-200 bg-slate-100 px-1.5 font-mono text-[11px] font-medium text-slate-500 shadow-sm h-5">
              Alt
            </kbd>
            <span className="text-[10px]">+</span>
            <kbd className="inline-flex items-center justify-center rounded border border-slate-200 bg-slate-100 px-1.5 font-mono text-[11px] font-medium text-slate-500 shadow-sm h-5">
              N
            </kbd>
          </div>
        </div>
      </div>

{/* --- CONTENIDO DINÁMICO SEGÚN LA VISTA --- */}
      {vistaActual === "graficos" ? (
        <Graficos />
      ) : (
        <>
        {/* --- BARRA DE FILTROS ESTILO SHADCN --- */}
        <div className="flex flex-wrap gap-4 items-end mb-6">
          
        {/* Filtro de Fecha (Con Calendario Flotante) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Filtrar por Fecha:</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className={`w-[220px] justify-start text-left font-normal bg-white ${!fechaFiltro && "text-muted-foreground"}`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fechaFiltro ? format(fechaFiltro, "dd/MM/yyyy") : <span>Todas las fechas</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={fechaFiltro}
                  onSelect={setFechaFiltro}
                  initialFocus
                />
                {/* --- AGREGAMOS LOS BOTONES ACÁ ABAJO --- */}
                <div className="flex items-center justify-between p-2 border-t border-slate-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFechaFiltro(null)}
                    className="text-slate-600 hover:text-slate-900 font-normal h-8"
                  >
                    Limpiar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFechaFiltro(new Date())}
                    className="text-blue-600 hover:text-blue-800 font-medium h-8"
                  >
                    Hoy
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Filtro de Categoría (Combobox con buscador) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Filtrar por Categoría:</label>
            <Popover open={openCategoria} onOpenChange={setOpenCategoria}>
              <PopoverTrigger asChild>
                {/* Este botón imita exactamente la estética de un Input de Shadcn */}
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCategoria}
                  className="w-[200px] justify-between bg-white font-normal text-slate-700 hover:bg-slate-50"
                >
                  {/* Agregamos el span con "truncate" para que no se desborde */}
                  <span className="truncate">
                    {categoriaFiltro === "todas"
                      ? "Todas"
                      : categorias.find((cat) => cat === categoriaFiltro) || categoriaFiltro}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar categoría..." />
                  <CommandList>
                    <CommandEmpty>No se encontró...</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="todas"
                        onSelect={() => {
                          setCategoriaFiltro("todas");
                          setOpenCategoria(false);
                        }}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${categoriaFiltro === "todas" ? "opacity-100" : "opacity-0"}`}
                        />
                        Todas
                      </CommandItem>
                      {categorias.map((cat, index) => (
                        <CommandItem
                          key={index}
                          value={cat}
                          onSelect={() => {
                            setCategoriaFiltro(cat);
                            setOpenCategoria(false);
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${categoriaFiltro === cat ? "opacity-100" : "opacity-0"}`}
                          />
                          {cat}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Buscador de texto (Estilo Input Group Shadcn) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Buscar por palabra:</label>
            <div className="flex items-center w-[250px] rounded-xl border border-slate-200 bg-white px-3 shadow-sm focus-within:border-slate-400 focus-within:ring-4 focus-within:ring-slate-200">
              {/* Ícono de la lupa a la izquierda */}
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              
              {/* Input invisible que ocupa el centro */}
              <input
                type="text"
                placeholder="Ej: huevo, ropa..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="flex h-9 w-full border-0 bg-transparent px-2 py-1 text-sm shadow-none outline-none placeholder:text-slate-400"
              />
              
              {/* NUEVO: Botón X para borrar rápido (solo aparece si hay texto) */}
              {busqueda && (
                <button 
                  onClick={() => setBusqueda("")}
                  className="text-slate-400 hover:text-slate-700 focus:outline-none p-1 transition-colors"
                  title="Limpiar búsqueda"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              
              {/* Contador dinámico (le agregamos un borde izquierdo para separarlo) */}
              {busqueda.trim() !== "" && (
                <span className="text-xs text-slate-400 shrink-0 font-medium border-l border-slate-200 pl-2 ml-1">
                  {eventos.length} res.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* --- TABLA --- */}
        <div className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-opacity duration-200 ease-in-out ${isFetching ? "opacity-40 pointer-events-none" : "opacity-100"}`}>        <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-semibold text-slate-900 whitespace-nowrap">Fecha</TableHead>
                <TableHead className="font-semibold text-slate-900">Hora</TableHead>
                <TableHead className="font-semibold text-slate-900">Descripción</TableHead>
                <TableHead className="font-semibold text-slate-900">Categoría</TableHead>
                <TableHead className="font-semibold text-slate-900">Duración (min)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eventos.map((evento) => (
              <AchievementItem key={evento.id} evento={evento} busqueda={debouncedBusqueda} onUpdate={() => { fetchEventos(); fetchProgreso(); }} />
              ))}
            </TableBody>
          </Table>

          {eventos.length === 0 && (
            <p className="text-center text-slate-500 py-8 text-sm">
              No hay eventos que coincidan con los filtros...
            </p>
          )}
        </div>
        </>
      )}

      {/* --- MODAL PARA AGREGAR EVENTO --- */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Evento</DialogTitle>
            {/* Agregamos esto oculto (sr-only = Screen Reader Only) para calmar a Shadcn */}
            <DialogDescription className="sr-only">
              Completa los datos para registrar un nuevo evento en tu historial.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleAddSubmit} className="flex flex-col gap-4 py-4">
            <div className="flex gap-4">
              <div className="flex flex-col gap-1.5 w-1/2">
                <label className="text-sm font-medium text-slate-700">Fecha</label>
                {/* Calendario Shadcn */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-start text-left font-normal rounded-xl ${!addFormData.fecha && "text-muted-foreground"}`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {addFormData.fecha ? format(new Date(addFormData.fecha + "T00:00:00"), "dd/MM/yyyy") : <span>Elegir fecha</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={addFormData.fecha ? new Date(addFormData.fecha + "T00:00:00") : undefined}
                      onSelect={(date) => {
                        if (date) {
                          setAddFormData({ ...addFormData, fecha: format(date, 'yyyy-MM-dd') });
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex flex-col gap-1.5 w-1/2">
                <label className="text-sm font-medium text-slate-700">Hora</label>
                <Input type="time" name="hora" value={addFormData.hora} onChange={handleAddChange} required />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Descripción</label>
              <Textarea 
                name="descripcion" 
                rows="3" 
                value={addFormData.descripcion} 
                onChange={handleAddChange} 
                required
                autoFocus 
              />
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col gap-1.5 w-1/2">
                <label className="text-sm font-medium text-slate-700">Categoría</label>
                <Input type="text" name="categoria" value={addFormData.categoria} onChange={handleAddChange} required />
              </div>
              <div className="flex flex-col gap-1.5 w-1/2">
                <label className="text-sm font-medium text-slate-700">Duración (min)</label>
                <Input type="number" name="tamano_bloque" value={addFormData.tamano_bloque} onChange={handleAddChange} required />
              </div>
            </div>

            <DialogFooter className="mt-4 flex sm:justify-end">
              <Button type="submit" className="rounded-xl w-full sm:w-auto">
                Registrar Evento
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>      
    </div>
  )
}

export default App