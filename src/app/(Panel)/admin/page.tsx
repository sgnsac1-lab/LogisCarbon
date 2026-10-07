import Parametros from "./Parametros"
import { ObtenerParametros, ObtenerRutas } from "@/actions/parametros.actions"

export default async function page() {
  const [response, responseRutas] = await Promise.all([
    ObtenerParametros(),
    ObtenerRutas()
  ])
  if (!response.success || !responseRutas.success) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-200">
          <h2 className="font-bold text-lg mb-1">Error de conexión</h2>
          <p>No se pudieron cargar los parámetros o las rutas.</p>
        </div>
      </div>
    )
  }

  const listaParametros = response.data || []
  const listaRutas = responseRutas.data || []

  return <Parametros parametros={listaParametros} rutas={listaRutas} />
}
