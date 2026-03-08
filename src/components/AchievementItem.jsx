import { useState, memo } from "react"
import { format } from "date-fns" // <-- Sumamos date-fns
import { Calendar as CalendarIcon } from "lucide-react" // <-- Sumamos el ícono
import { TableRow, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
// <-- Sumamos el Calendario y el Popover:
import { Calendar } from "@/components/ui/calendar" 
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "sonner"

// La magia del resaltador sigue intacta
const Resaltador = ({ texto, busqueda }) => {
  if (!busqueda || !texto) return <>{texto}</>;
  const partes = texto.toString().split(new RegExp(`(${busqueda})`, 'gi'));
  return (
    <>
      {partes.map((parte, indice) => 
        parte.toLowerCase() === busqueda.toLowerCase() ? (
          <mark key={indice} className="bg-yellow-200 text-slate-900 rounded-sm px-0.5">{parte}</mark>
        ) : (
          <span key={indice}>{parte}</span>
        )
      )}
    </>
  );
};

function AchievementItem({ evento, busqueda, onUpdate }) {
  const { id, fecha, hora, descripcion, categoria, tamano_bloque } = evento;
  
  // Estados para controlar el modal y el formulario
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    fecha: fecha,
    hora: hora,
    descripcion: descripcion,
    categoria: categoria,
    tamano_bloque: tamano_bloque
  });

  const [year, month, day] = fecha.split('-');
  const fechaFormateada = `${day}/${month}/${year}`;

  // Manejador genérico para cuando escribís en cualquier input del modal
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Función para mandar los datos actualizados a tus nuevas rutas API de Flask
  const handleUpdate = async (e) => {
    e.preventDefault();
    
    // Armamos los datos igual que un formulario HTML tradicional
    const formPayload = new FormData();
    Object.keys(formData).forEach(key => formPayload.append(key, formData[key]));

    try {
      // APUNTAMOS A LA NUEVA RUTA /api/
      const res = await fetch(`http://localhost:5000/api/editar_evento/${id}`, {
        method: 'POST',
        body: formPayload,
        credentials: "include"
      });
      
      if (res.ok) {
        setIsOpen(false); // Cerramos la carta
        if (onUpdate) onUpdate(); // Recargamos la tabla de App.jsx
        toast.success("Evento actualizado", {
          description: "Los cambios se guardaron exitosamente.",
        });

      }
    } catch (error) {
      console.error("Error al actualizar:", error);
    }
  };

  // Función para borrar el evento usando la nueva ruta API
  const handleDelete = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/borrar_evento/${id}`, {
        method: 'POST',
        credentials: "include"
      });
      
      if (res.ok) {
        setIsOpen(false);
        if (onUpdate) onUpdate();
        toast.success("Evento eliminado", {
          description: "El registro fue borrado de tu diario.",
        });
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      
      {/* 1. EL GATILLO AHORA ENVUELVE A TODA LA FILA */}
      <DialogTrigger asChild>
        {/* Le damos estilo de cursor-pointer y un hover gris para que el usuario sepa que puede clikear */}
        <TableRow className="cursor-pointer hover:bg-slate-50 transition-colors">
          <TableCell className="font-medium whitespace-nowrap">{fechaFormateada}</TableCell>
          <TableCell>{hora}</TableCell>
          
          {/* 2. EL TRUCO DEL TEXTO CLARITO (text-slate-500) */}
          <TableCell className="leading-relaxed">
            <Resaltador texto={descripcion} busqueda={busqueda} />
          </TableCell>
          
          <TableCell><Resaltador texto={categoria} busqueda={busqueda} /></TableCell>
          <TableCell>{tamano_bloque}</TableCell>
          
          {/* 3. BORRAMOS EL TABLECELL QUE TENÍA EL BOTÓN EDITAR */}
        </TableRow>
      </DialogTrigger>

      {/* --- CARTA FLOTANTE (MODAL) --- */}
      <DialogContent className="sm:max-w-[700px] bg-white sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle>Editar Evento</DialogTitle>
          {/* Descripción oculta */}
          <DialogDescription className="sr-only">
            Modifica los detalles de este evento o elimínalo de tu historial.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleUpdate} className="flex flex-col gap-4 py-4">
          <div className="flex gap-4">
            <div className="flex flex-col gap-1.5 w-1/2">
              <label className="text-sm font-medium text-slate-700">Fecha</label>
              
              {/* Calendario Shadcn para la edición */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start text-left font-normal rounded-xl ${!formData.fecha && "text-muted-foreground"}`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.fecha ? format(new Date(formData.fecha + "T00:00:00"), "dd/MM/yyyy") : <span>Elegir fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.fecha ? new Date(formData.fecha + "T00:00:00") : undefined}
                    onSelect={(date) => {
                      if (date) {
                        // Usamos handleChange simulando el evento para reutilizar tu lógica
                        handleChange({ target: { name: 'fecha', value: format(date, 'yyyy-MM-dd') } });
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

            </div>
            <div className="flex flex-col gap-1.5 w-1/2">
              <label className="text-sm font-medium text-slate-700">Hora</label>
              <Input type="time" name="hora" value={formData.hora} onChange={handleChange} required />
            </div>
          </div>

        <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Descripción</label>
            <Textarea 
              name="descripcion" 
              rows="3" 
              value={formData.descripcion} 
              onChange={handleChange} 
              required
              autoFocus 
              onFocus={(e) => {
                const longitud = e.target.value.length;
                e.target.setSelectionRange(longitud, longitud);
              }}
            />
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col gap-1.5 w-1/2">
              <label className="text-sm font-medium text-slate-700">Categoría</label>
              <Input type="text" name="categoria" value={formData.categoria} onChange={handleChange} required />
            </div>
            <div className="flex flex-col gap-1.5 w-1/2">
              <label className="text-sm font-medium text-slate-700">Duración (min)</label>
              <Input type="number" name="tamano_bloque" value={formData.tamano_bloque} onChange={handleChange} required />
            </div>
          </div>

          <DialogFooter className="mt-4 flex sm:justify-end gap-2">
          {/* --- NUEVA ALERTA DE SHADCN ENVOLVIENDO EL BOTÓN --- */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                {/* 1. Volvemos a tu botón negro original */}
                <Button type="button" className="bg-slate-900 text-white hover:bg-slate-900 rounded-xl">
                  Eliminar
                </Button>
              </AlertDialogTrigger>
              
              {/* 2. Le quitamos el padding (p-0) y el hueco (gap-0) por defecto para armar nuestro diseño en bloques */}
              <AlertDialogContent className="bg-white sm:rounded-2xl p-0 gap-0 overflow-hidden border-slate-200 shadow-lg">
                
                {/* Bloque superior blanco con el texto */}
                <div className="p-6">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-slate-900">¿Estás completamente seguro?</AlertDialogTitle>
                    <AlertDialogDescription className="mt-2 text-slate-500">
                      Esta acción no se puede deshacer. El evento será eliminado permanentemente de tu historial y no sumará horas a tu progreso.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                </div>

                {/* Bloque inferior gris (Footer) */}
                <AlertDialogFooter className="bg-slate-50 border-t border-slate-200 py-3 px-6">
                  <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                  {/* Botón confirmar negro */}
                  <AlertDialogAction onClick={handleDelete} className="bg-slate-900 hover:bg-slate-900 text-white rounded-xl">
                    Confirmar
                  </AlertDialogAction>
                </AlertDialogFooter>

              </AlertDialogContent>
            </AlertDialog>
            
            {/* Botón Clarito (Outline) */}
            <Button type="submit" variant="outline" className="rounded-xl">
              Guardar cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default memo(AchievementItem)