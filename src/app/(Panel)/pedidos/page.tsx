import Pedidos from "./Pedidos"
import { ObtenerPedidos } from "@/actions/pedidos.actions"
import { ObtenerClientes } from "@/actions/clientes.actions"
import { ObtenerParametros } from "@/actions/parametros.actions"
import { getSessionUser } from "@/actions/session.actions"

export default async function page() {
  const [responsePedidos, responseClientes, responseParametros, session] = await Promise.all([
    ObtenerPedidos(),
    ObtenerClientes(),
    ObtenerParametros(),
    getSessionUser()
  ])
  if(!responsePedidos.success || !responsePedidos.success || !responseParametros.success){
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-200">
          <h2 className="font-bold text-lg mb-1">Error de conexión</h2>
        </div>
      </div>
    )
  }

  const listaPedidos = responsePedidos.data || []
  const listaClientes = responseClientes.data || []
  const listaParametros = responseParametros.data || []

  return<Pedidos pedidos={listaPedidos} clientes={listaClientes} parametros={listaParametros} rol={session?.rol ?? 'OPERACIONES'} />
}
