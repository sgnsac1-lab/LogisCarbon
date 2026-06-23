'use client'

import { useState } from "react"
import { mockTrazabilidad } from "@/lib/temp/mockData"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import { CheckCircle2, AlertTriangle, Clock, MapPin } from "lucide-react"
import { Pedido, Incidencia } from "@/types"
import { CrearIncidencias } from "@/actions/incidencias.actions"
import { completarEntrega } from "@/actions/pedidos.actions"

interface Props {
    pedido: Pedido,
    incidencias: Incidencia[]
}

export default function Trazabilidad({pedido, incidencias}: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleAddIncidencia = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        formData.append('pedido_id', String(pedido.id))
        const result = await CrearIncidencias(formData)

        if (result?.error) {
            setError(result.error)
            setLoading(false)
        } else {
            setIsModalOpen(false)
            setLoading(false)
        }
    }

    const formatearFecha = (fecha: Date | string) => {
      return new Date(fecha).toLocaleString('es-PE', {
        timeZone: 'America/Lima',
        hour12: true, // Esto fuerza el uso de a. m. / p. m. en ambos lados
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    };

    const renderIcon = (tipo: string, completado: boolean) => {
        if (!completado) return <Clock className="w-5 h-5 text-slate-400" />
        if (tipo === 'warning') return <AlertTriangle className="w-5 h-5 text-amber-500" />
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />
    }

    const showUpcomingModal = () => {
        alert("Próximamente: Integración con GPS en tiempo real.")
    }
  return (
    <div className="space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Seguimiento e Incidencias</h2>
              <p className="text-slate-500 text-sm mt-1">Timeline y monitoreo de ruta para pedido: <span className="font-bold text-slate-800">{mockTrazabilidad.pedidoId}</span></p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" title="Próximamente" onClick={showUpcomingModal} className="opacity-70">
                 <MapPin className="w-4 h-4 mr-2" /> GPS en tiempo real
              </Button>
              <Button onClick={() => setIsModalOpen(true)}>
                 Añadir Incidencia / Observación
              </Button>
              <Button onClick={() => completarEntrega(pedido.id, pedido.unidadId!)}>
                 Completar Entrega
              </Button>
            </div>
          </div>
    
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
               <Card>
                  <h3 className="text-lg font-semibold text-slate-800 mb-6 border-b border-slate-100 pb-4">Timeline Operativo</h3>
                  <div className="relative border-l-2 border-slate-200 ml-4 space-y-8 pl-8 py-2">

                    <div className="relative">
                        <span className="absolute -left-10.75 flex items-center justify-center w-6 h-6 rounded-full bg-white ring-8 ring-white">
                          {pedido.createdAt? renderIcon('', true) : renderIcon('', false)}
                        </span>
                        <div className="flex flex-col">
                          <h4 className={`text-sm font-semibold`}>
                            Pedido registrado
                          </h4>
                          <time className="mb-1 text-xs font-normal text-slate-400">{formatearFecha(pedido.createdAt)}</time>
                        </div>
                    </div>

                    {incidencias.map((hito, idx) => (
                      <div key={hito.id} className="relative">
                        <span className="absolute -left-10.75 flex items-center justify-center w-6 h-6 rounded-full bg-white ring-8 ring-white">
                          {renderIcon('', true)}
                        </span>
                        <div className="flex flex-col">
                          <h4 className={`text-sm font-semibold`}>
                            {hito.tipoEvento}
                          </h4>
                          <time className="mb-1 text-xs font-normal text-slate-400">{formatearFecha(hito.fechaHora)}</time>
                        </div>
                      </div>
                    ))}
                  </div>
               </Card>
            </div>
            
            <div className="lg:col-span-1 space-y-6">
               <Card className="bg-slate-900 border-none text-white">
                 <h3 className="text-lg font-semibold mb-4 text-emerald-400">Resumen Resumen</h3>
                 <ul className="space-y-3 text-sm">
                   <li className="flex justify-between"><span className="text-slate-400">Estado:</span> <span className="font-medium text-amber-400">{pedido.estado}</span></li>
                   <li className="flex justify-between"><span className="text-slate-400">Unidad:</span> <span className="font-medium text-black">{pedido.unidad?.codigoInterno}</span></li>
                   <li className="flex justify-between"><span className="text-slate-400">Conductor:</span> <span className="font-medium text-black">{pedido.unidad?.conductorActual}</span></li>
                 </ul>
               </Card>
            </div>
          </div>
    
          <Modal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            title="Registrar Evento / Incidencia"
            footer={
              <>
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit">Registrar en Bitácora</Button>
              </>
            }
            funcion={handleAddIncidencia}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Evento</label>
                <input name="tipo_evento" type="text" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Ubicación / Referencia</label>
                 <input name="ubicacion" type="text" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Ej. Ruta 66, KM 120" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Detalle del Evento</label>
                <textarea 
                  name="detalle"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                  rows={4}
                  placeholder="Describa la situación..."
                ></textarea>
              </div>
            </div>
          </Modal>
    </div>
  )
}
