import Rentabilidad from "./Rentabilidad"
import { ObtenerPedidos } from "@/actions/pedidos.actions"
import { getSessionUser } from "@/actions/session.actions"

export default async function page() {
  const [response, session] = await Promise.all([ObtenerPedidos(), getSessionUser()])
  if(!response.success){
      return (
        <div className="p-8 max-w-7xl mx-auto">
          <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-200">
            <h2 className="font-bold text-lg mb-1">Error de conexión</h2>
            <p>{response.error}</p>
          </div>
        </div>
      )
  }
  const listaPedidos = response.data || []
  const listaPedidosFiltered = listaPedidos.filter((ped)=>
    ped.estado === 'ENTREGADO' &&
    (ped.viajeId === null || ped.viaje?.estado === 'CERRADO')
  )
  return <Rentabilidad pedidos={listaPedidosFiltered} rol={session?.rol ?? 'OPERACIONES'} />
}
