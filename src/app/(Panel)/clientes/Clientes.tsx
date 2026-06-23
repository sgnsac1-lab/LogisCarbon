'use client'

import { useState } from "react";
import { mockClientes } from "@/lib/temp/mockData";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import { Plus, Users } from "lucide-react";
import { Cliente } from "@/types"
import { CrearClientes } from "@/actions/clientes.actions";

interface Props {
  clientes: Cliente[]
}

export default function Clientes({clientes}: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newCliente, setNewCliente] = useState({ razonSocial: "", documento: "" });
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleAddCliente = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const result = await CrearClientes(formData)

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
          <h2 className="text-2xl font-bold text-slate-800">Directorio de Clientes</h2>
          <p className="text-slate-500 text-sm mt-1">Gestión de cuentas y empresas cliente</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Nuevo Cliente
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">ID Cliente</th>
                <th className="px-6 py-4 font-medium">Razón Social</th>
                <th className="px-6 py-4 font-medium">Documento (RUC)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {clientes.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{cliente.id}</td>
                  <td className="px-6 py-4 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    {cliente.razonSocial}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">{cliente.documento}</td>
                </tr>
              ))}
              {clientes.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    No hay clientes registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Registrar Nuevo Cliente"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" >Guardar Cliente</Button>
          </>
        }
        funcion={handleAddCliente}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Razón Social</label>
            <input 
              type="text" 
              name="razon_social"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" 
              placeholder="Ej. Logística Global SAC"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Documento (RUC)</label>
            <input 
              type="text" 
              name="documento"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" 
              placeholder="Ej. 20123456789"
              maxLength={11}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
