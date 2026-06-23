'use client'

import { useState } from "react"
import { mockPedidos } from "@/lib/temp/mockData"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import Badge from "@/components/ui/Badge"
import { Plus, Search, Navigation } from "lucide-react"
import { CrearPedidos } from "@/actions/pedidos.actions"
import { Pedido, Cliente, Parametro } from "@/types"
import Link from "next/link"

interface Props {
  pedidos: Pedido[],
  clientes: Cliente[],
  parametros: Parametro[]
}

export default function Pedidos({pedidos, clientes, parametros}: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleAddPedido = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      setLoading(true)
      setError(null)

      const formData = new FormData(e.currentTarget)
      const result = await CrearPedidos(formData)

      if (result?.error) {
          setError(result.error)
          setLoading(false)
      } else {
          setIsModalOpen(false)
          setLoading(false)
      }
    }

    const getStatusBadge = (status: string) => {
        switch(status) {
        case 'Entregado': return 'success'
        case 'En Tránsito': return 'warning'
        default: return 'info'
        }
    }
  return (
    <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Clientes y Pedidos</h2>
              <p className="text-slate-500 text-sm mt-1">Gestión de alcance de despachos</p>
            </div>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Registrar Pedido
            </Button>
          </div>
    
          <Card className="p-0 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-4">
               <div className="relative flex-1 max-w-md">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <input 
                   type="text" 
                   placeholder="Buscar pedido o cliente..." 
                   className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                 />
               </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-medium">ID Pedido</th>
                    <th className="px-6 py-4 font-medium">Cliente</th>
                    <th className="px-6 py-4 font-medium">Ruta / Destino</th>
                    <th className="px-6 py-4 font-medium">Estado</th>
                    <th className="px-6 py-4 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {pedidos.map((ped) => (
                    <tr key={ped.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">{ped.codigo}</td>
                      <td className="px-6 py-4">{ped.cliente?.razonSocial}</td>
                      <td className="px-6 py-4">{ped.origen?.nombre}/{ped.destino?.nombre}</td>
                      <td className="px-6 py-4">
                        <Badge variant={getStatusBadge(ped.estado)}>
                          {ped.estado}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/pedidos/trazabilidad/${ped.id}`}>
                          <Button variant="outline" size="sm">
                            <Navigation className="w-4 h-4 mr-2" /> Trazabilidad
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
    
          <Modal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            title="Registrar Nuevo Pedido Alcance"
            footer={
              <>
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit">Crear Pedido</Button>
              </>
            }
            funcion={handleAddPedido}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cliente</label>
                <select name="idCliente" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value=''>Seleciona una opcion</option>
                  {clientes.map((cli)=>(
                    <option value={cli.id} key={cli.id}>{cli.razonSocial}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Origen</label>
                  <select name="idOrigen" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value=''>Seleciona una opcion</option>
                    {parametros.map((par)=>(
                      <option value={par.id} key={par.id}>{par.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Destino</label>
                  <select name="idDestino" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value=''>Seleciona una opcion</option>
                    {parametros.map((par)=>(
                      <option value={par.id} key={par.id}>{par.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Factor (Peso/Volumen)</label>
                <input 
                  name="factorPeso"
                  type="text" 
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                  placeholder="Ej. 12 Toneladas"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Observaciones</label>
                <textarea 
                  name="observaciones"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                  rows={3}
                  placeholder="Notas adicionales..."
                ></textarea>
              </div>
            </div>
          </Modal>
    </div>
  )
}
