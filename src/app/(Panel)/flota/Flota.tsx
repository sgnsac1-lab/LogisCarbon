'use client'

import { useState } from "react"
import { mockFlota } from "@/lib/temp/mockData"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import Badge from "@/components/ui/Badge"
import { Truck } from "lucide-react"
import { Unidad, Pedido } from "@/types"
import { CrearUnidad, asignarUnidadAPedido } from "@/actions/flota.actions"

interface Props {
    flotilla: Unidad[],
    pedidos: Pedido[]
}

export default function Flota({flotilla, pedidos}:Props) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isNewTruckModalOpen, setIsNewTruckModalOpen] = useState(false)
    const [selectedTruck, setSelectedTruck] = useState<number | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleAddUnidad = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const result = await CrearUnidad(formData)

        if (result?.error) {
            setError(result.error)
            setLoading(false)
        } else {
            setIsNewTruckModalOpen(false)
            setLoading(false)
        }
    }

    const handleAddPedido = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        formData.append('unidad_id', String(selectedTruck))
        const result = await asignarUnidadAPedido(formData)

        if (result?.error) {
            setError(result.error)
            setLoading(false)
        } else {
            setIsModalOpen(false)
            setLoading(false)
        }
    }

    const GuardadUnidad = (id:number) => {
        setSelectedTruck(id)
        setIsModalOpen(true)
    }

  return (
    <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Flota y Asignación</h2>
              <p className="text-slate-500 text-sm mt-1">Gestión de unidades y asignación a pedidos</p>
            </div>
            <Button onClick={() => setIsNewTruckModalOpen(true)}>
              <Truck className="w-4 h-4 mr-2" /> Nuevo Vehículo
            </Button>
          </div>
    
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {flotilla.map((unidad) => (
              <Card key={unidad.id} className="flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-lg ${unidad.estado === 'DISPONIBLE' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                      <Truck className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{unidad.placa}</h3>
                      <p className="text-sm text-slate-500">ID: {unidad.codigoInterno}</p>
                    </div>
                  </div>
                  <Badge variant={
                    unidad.estado === 'DISPONIBLE' ? 'success' : 
                    unidad.estado === 'EN_RUTA' ? 'info' : 'warning'
                  }>
                    {unidad.estado}
                  </Badge>
                </div>
                
                <div className="space-y-2 mb-6 text-sm flex-1">
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Capacidad:</span>
                    <span className="font-medium text-slate-800">{unidad.capacidadTon} TON</span>
                  </div>
                  <div className="flex justify-between pb-2">
                    <span className="text-slate-500">Conductor actual:</span>
                    <span className="font-medium text-slate-800">{unidad.conductorActual}</span>
                  </div>
                </div>
    
                <Button 
                  className="w-full" 
                  variant={unidad.estado === 'DISPONIBLE' ? 'primary' : 'outline'}
                  disabled={unidad.estado !== 'DISPONIBLE'}
                  onClick={() => GuardadUnidad(unidad.id)}
                >
                  Asignar a Pedido
                </Button>
              </Card>
            ))}
          </div>
    
          <Modal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            title="Asignar Unidad a Pedido"
            footer={
              <>
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit">Confirmar Asignación</Button>
              </>
            }
            funcion={handleAddPedido}
          >
            <div className="space-y-4">
              <p className="text-sm text-slate-600 mb-4">Asignando unidad: <strong className="text-slate-900">{selectedTruck}</strong></p>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Seleccionar Pedido Pendiente</label>
                <select name="pedido_id" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value=''>Seleccione un pedido...</option>
                  {pedidos.map((ped)=>(
                    <option value={ped.id} key={ped.id}>{ped.codigo}: {ped.origen?.nombre} - {ped.destino?.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Conductor Asignado</label>
                <input
                    name="conductor"
                    type="text" 
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                />
              </div>
            </div>
          </Modal>
          <Modal 
            isOpen={isNewTruckModalOpen} 
            onClose={() => setIsNewTruckModalOpen(false)} 
            title="Registrar Nuevo Vehículo"
            footer={
              <>
                <Button variant="outline" onClick={() => setIsNewTruckModalOpen(false)}>Cancelar</Button>
                <Button type="submit">Registrar Vehículo</Button>
              </>
            }
            funcion={handleAddUnidad}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Placa</label>
                  <input
                    name="placa"
                    type="text" 
                    placeholder="Ej. ABC-123"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Marca</label>
                  <input
                    name="marca"
                    type="text" 
                    placeholder="Ej. Volvo"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Año</label>
                  <input
                    name="anio"
                    type="number" 
                    placeholder="Ej. 2023"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                  />
                </div>
              </div>
    
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Capacidad</label>
                  <input
                    name="capacidad"
                    type="text" 
                    placeholder="Ej. 30 Ton"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Factor Emisión (kg CO2/km)</label>
                  <input
                    name="factor_emision"
                    type="text" 
                    placeholder="Ej. 0.41"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                  />
                </div>
              </div>
            </div>
          </Modal>
    </div>
  )
}
