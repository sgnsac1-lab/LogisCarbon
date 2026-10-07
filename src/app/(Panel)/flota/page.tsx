import Flota from "./Flota"
import { ObtenerFlotilla, ObtenerPedidosDisponiblesParaCarga } from "@/actions/flota.actions"
import { ObtenerParametros } from "@/actions/parametros.actions"
import { getSessionUser } from "@/actions/session.actions"

export default async function page() {

  const [dataFlotilla, dataPedidos, dataParametros, session] = await Promise.all([
    ObtenerFlotilla(),
    ObtenerPedidosDisponiblesParaCarga(),
    ObtenerParametros(),
    getSessionUser()
  ])
  if(!dataFlotilla.success || !dataPedidos.success || !dataParametros.success){
    return(
      <div className="p-8 max-w-7xl mx-auto">
        <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-200">
          <h2 className="font-bold text-lg mb-1">Error de conexión</h2>
        </div>
      </div>
    )
  }
  const listaFlotilla = dataFlotilla.data || []
  const listaPedidos = dataPedidos.data || []
  const listaParadas = (dataParametros.data || []).filter(
    (parametro) => parametro.tipo === 'DESTINO' && parametro.activo === true
  )

  return <Flota flotilla={listaFlotilla} pedidos={listaPedidos} parametros={listaParadas} rol={session?.rol ?? 'OPERACIONES'} />
}
