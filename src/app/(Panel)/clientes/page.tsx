import Clientes from "./Clientes"
import { ObtenerClientes } from "@/actions/clientes.actions"
import { getSessionUser } from "@/actions/session.actions"

export default async function page() {
   const [response, session] = await Promise.all([ObtenerClientes(), getSessionUser()])
    if (!response.success) {
      return (
        <div className="p-8 max-w-7xl mx-auto">
          <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-200">
            <h2 className="font-bold text-lg mb-1">Error de conexión</h2>
            <p>{response.error}</p>
          </div>
        </div>
      )
    }
    const listaClientes = response.data || []
  return <Clientes clientes={listaClientes} rol={session?.rol ?? 'OPERACIONES'} />
}
