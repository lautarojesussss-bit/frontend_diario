import { Toaster as Sonner } from "sonner"
import { CheckCircle2 } from "lucide-react"

const Toaster = ({ ...props }) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          // Acá definimos tu diseño global minimalista
          toast: "bg-white border border-slate-200 shadow-md rounded-xl p-4 w-full flex items-start gap-3",
          title: "text-slate-900 font-semibold text-sm",
          description: "text-slate-500 text-sm",
          icon: "text-slate-900 mt-0.5",
        },
      }}
      icons={{
        // Reemplazamos el ícono a nivel global
        success: <CheckCircle2 className="h-5 w-5" />,
      }}
      {...props}
    />
  )
}

export { Toaster }
