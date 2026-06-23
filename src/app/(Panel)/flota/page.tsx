import Flota from "./Flota"
import { ObtenerFlotilla } from "@/actions/flota.actions"
import { obtenerPedidosParaAsignar } from "@/actions/pedidos.actions"

export default async function page() {

  const [dataFlotilla, dataPedidos] = await Promise.all([
    ObtenerFlotilla(),
    obtenerPedidosParaAsignar()
  ])
  if(!dataFlotilla.success || !dataPedidos.success){
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

  return <Flota flotilla={listaFlotilla} pedidos={listaPedidos} />
}
