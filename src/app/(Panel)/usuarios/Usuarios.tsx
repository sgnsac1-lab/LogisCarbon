'use client'

import { useState } from "react"
import { mockUsuarios } from "@/lib/temp/mockData"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import Badge from "@/components/ui/Badge"
import { Plus, Users } from "lucide-react"
import { Usuario } from "@/types"
import { registrarUsuarioAdmin } from "@/actions/usuarios.actions"

interface Props {
    usuarios: Usuario[]
}

export default function Usuarios({usuarios}: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleAddUsuario = async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault()
            setLoading(true)
            setError(null)
    
            const formData = new FormData(e.currentTarget)
            const result = await registrarUsuarioAdmin(formData)
    
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
              <h2 className="text-2xl font-bold text-slate-800">Gestión de Usuarios</h2>
              <p className="text-slate-500 text-sm mt-1">Administración de accesos y roles del sistema</p>
            </div>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Nuevo Usuario
            </Button>
          </div>
    
          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-medium">Nombre</th>
                    <th className="px-6 py-4 font-medium">Email</th>
                    <th className="px-6 py-4 font-medium">Rol</th>
                    <th className="px-6 py-4 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {usuarios.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900 flex items-center">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mr-3">
                           <Users className="w-4 h-4" />
                        </div>
                        {user.nombre}
                      </td>
                      <td className="px-6 py-4">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className="text-slate-700 bg-slate-100 px-2 py-1 rounded-md text-xs font-medium">
                          {user.rol}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={user.activo === true ? 'success' : 'default'}>
                          {user.activo}
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
            title="Crear Nuevo Usuario"
            footer={
              <>
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit">Guardar Usuario</Button>
              </>
            }
            funcion={handleAddUsuario}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                <input
                  name="nombre_completo"
                  type="text" 
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                  placeholder="Ej. Carlos Mendoza"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
                <input
                  name="email"
                  type="email" 
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
                <select name="rol" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value='ADMIN'>Admin</option>
                  <option value='OPERACIONES'>Operaciones</option>
                  <option value='GERENCIA'>Gerencia</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña Inicial</label>
                <input
                  name="password"
                  type="password" 
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                  placeholder="••••••••"
                />
              </div>
            </div>
          </Modal>
    </div>
  )
}
