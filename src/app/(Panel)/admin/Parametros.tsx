'use client'

import { useState } from "react"
import { mockCatalogos } from "@/lib/temp/mockData"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Plus } from "lucide-react"
import Badge from "@/components/ui/Badge"
import Modal from "@/components/ui/Modal"
import { CrearParametros } from "@/actions/parametros.actions"
import { Parametro } from "@/types"

interface Props {
    parametros: Parametro[]
}

export default function Parametros({parametros}:Props) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleAddParametro = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const result = await CrearParametros(formData)

        if (result?.error) {
            setError(result.error)
            setLoading(false)
        } else {
            setIsModalOpen(false)
            setLoading(false)
        }
    }

  return (
    <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Seguridad y Parámetros</h2>
              <p className="text-slate-500 text-sm mt-1">Gestión de catálogos principales del sistema</p>
            </div>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Nuevo Registro
            </Button>
          </div>
    
          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-medium">ID</th>
                    <th className="px-6 py-4 font-medium">Tipo</th>
                    <th className="px-6 py-4 font-medium">Nombre</th>
                    <th className="px-6 py-4 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {parametros.map((par) => (
                    <tr key={par.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">{par.id}</td>
                      <td className="px-6 py-4">{par.tipo}</td>
                      <td className="px-6 py-4">{par.nombre}</td>
                      <td className="px-6 py-4">
                        <Badge variant={par.activo === true ? 'success' : 'default'}>
                          {par.activo === true ? 'Activo':'Inactivo'}
                        </Badge>
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
            title="Nuevo Parámetro"
            footer={
              <>
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit">Guardar</Button>
              </>
            }
            funcion={handleAddParametro}
          >
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Catálogo</label>
                    <select name="tipo" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value='DESTINO'>Destino</option>
                    <option value='FACTOR_OPERATIVO'>Operativo</option>
                    <option value='TIPO_EVENTO'>Evento</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nombre / Descripción</label>
                    <input 
                    type="text"
                    name="nombre"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                    placeholder="Ej. Planta Este"
                    />
                </div>
                <div className="flex items-center space-x-2 pt-2">
                    <input name="activo" type="checkbox" id="activo" defaultChecked className="rounded text-emerald-600 focus:ring-emerald-500" />
                    <label htmlFor="activo" className="text-sm text-slate-700">Registro Activo</label>
                </div>
            </div>
          </Modal>
    </div>
  )
}
