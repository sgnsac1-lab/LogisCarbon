import Trazabilidad from "./Trazabilidad"
import { ObtenerPedido } from "@/actions/pedidos.actions"
import { ObtenerIncidencias } from "@/actions/incidencias.actions";
import { getSessionUser } from "@/actions/session.actions";

export default async function page({params}:{ params: Promise<{ id: string }>}) {
  const { id } = await params; 
  const pedidoId = Number(id);
  const [dataPedido, dataIncidencias, session] = await Promise.all([
    ObtenerPedido(pedidoId),
    ObtenerIncidencias(pedidoId),
    getSessionUser()
  ])
  if(!dataPedido.success || !dataIncidencias.success){
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-200">
          <h2 className="font-bold text-lg mb-1">Error de conexión</h2>
        </div>
      </div>
    );
  }
  if (!dataPedido.data) {
    return <div>El pedido no existe o fue eliminado.</div>;
  }
  const pedido = dataPedido.data
  const listaIncidencias = dataIncidencias.data || []
  return <Trazabilidad pedido={pedido} incidencias={listaIncidencias} rol={session?.rol ?? 'OPERACIONES'} />
}
