'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { mockCatalogos } from "@/lib/temp/mockData"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Plus } from "lucide-react"
import Badge from "@/components/ui/Badge"
import Modal from "@/components/ui/Modal"
import { CrearParametros, CrearRuta, ActualizarRuta, ActualizarParametroDestino, CambiarEstadoParametroDestino } from "@/actions/parametros.actions"
import { Parametro, Ruta } from "@/types"

interface Props {
    parametros: Parametro[]
    rutas: Ruta[]
}

export default function Parametros({parametros, rutas}:Props) {
    const router = useRouter()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isRutaModalOpen, setIsRutaModalOpen] = useState(false)
    const [isEditRutaModalOpen, setIsEditRutaModalOpen] = useState(false)
    const [isEditParametroModalOpen, setIsEditParametroModalOpen] = useState(false)
    const [editingRuta, setEditingRuta] = useState<Ruta | null>(null)
    const [editingParametro, setEditingParametro] = useState<Parametro | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [rutaError, setRutaError] = useState<string | null>(null)
    const [editParametroError, setEditParametroError] = useState<string | null>(null)
    const [estadoParametroError, setEstadoParametroError] = useState<string | null>(null)

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

    const ubicaciones = parametros.filter((par) => par.tipo === 'DESTINO' && par.activo)

    const handleAddRuta = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setRutaError(null)

        const form = e.currentTarget
        const formData = new FormData(form)
        const origenIdRaw = formData.get('origenId') as string
        const destinoIdRaw = formData.get('destinoId') as string
        const distanciaRaw = formData.get('distanciaKm') as string

        const origenId = origenIdRaw ? parseInt(origenIdRaw) : NaN
        const destinoId = destinoIdRaw ? parseInt(destinoIdRaw) : NaN
        const distanciaKm = distanciaRaw ? parseFloat(distanciaRaw) : NaN

        if (!Number.isInteger(origenId) || !Number.isInteger(destinoId)) {
            setRutaError('Selecciona un origen y un destino.')
            setLoading(false)
            return
        }
        if (origenId === destinoId) {
            setRutaError('El origen y el destino deben ser diferentes.')
            setLoading(false)
            return
        }
        if (!Number.isFinite(distanciaKm) || distanciaKm <= 0) {
            setRutaError('La distancia debe ser mayor a 0.')
            setLoading(false)
            return
        }

        const result = await CrearRuta({ origenId, destinoId, distanciaKm })

        if (result?.error) {
            setRutaError(result.error)
            setLoading(false)
        } else {
            form.reset()
            setIsRutaModalOpen(false)
            setLoading(false)
        }
    }

    const openEditRuta = (ruta: Ruta) => {
        setEditingRuta(ruta)
        setRutaError(null)
        setIsEditRutaModalOpen(true)
    }

    const handleEditRuta = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!editingRuta) return
        setLoading(true)
        setRutaError(null)

        const formData = new FormData(e.currentTarget)
        const distanciaRaw = formData.get('distanciaKm') as string
        const distanciaKm = distanciaRaw ? parseFloat(distanciaRaw) : NaN
        const activo = formData.get('activo') === 'on'

        if (!Number.isFinite(distanciaKm) || distanciaKm <= 0) {
            setRutaError('La distancia debe ser mayor a 0.')
            setLoading(false)
            return
        }

        const result = await ActualizarRuta({ id: editingRuta.id, distanciaKm, activo })

        if (result?.error) {
            setRutaError(result.error)
            setLoading(false)
        } else {
            setIsEditRutaModalOpen(false)
            setEditingRuta(null)
            setLoading(false)
        }
    }

    const openEditParametro = (par: Parametro) => {
        setEditingParametro(par)
        setEditParametroError(null)
        setIsEditParametroModalOpen(true)
    }

    const closeEditParametro = () => {
        setIsEditParametroModalOpen(false)
        setEditingParametro(null)
        setEditParametroError(null)
    }

    const handleEditParametro = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!editingParametro) return
        setLoading(true)
        setEditParametroError(null)

        const formData = new FormData(e.currentTarget)
        const nombre = String(formData.get('nombre') ?? '').trim()

        if (!nombre) {
            setEditParametroError('El nombre del destino es obligatorio.')
            setLoading(false)
            return
        }

        const result = await ActualizarParametroDestino({ parametroId: editingParametro.id, nombre })

        if (result?.error) {
            setEditParametroError(result.error)
            setLoading(false)
            return
        }

        closeEditParametro()
        setLoading(false)
        router.refresh()
    }

    const handleDesactivarParametro = async (par: Parametro) => {
        if (!window.confirm('¿Desactivar este destino? Dejará de estar disponible para nuevos pedidos y rutas.')) return

        setLoading(true)
        setEstadoParametroError(null)

        const result = await CambiarEstadoParametroDestino({ parametroId: par.id, activo: false })

        if (result?.error) {
            setEstadoParametroError(result.error)
            setLoading(false)
            return
        }

        setLoading(false)
        router.refresh()
    }

    const handleActivarParametro = async (par: Parametro) => {
        if (!window.confirm(`¿Activar el destino "${par.nombre}"?`)) return

        setLoading(true)
        setEstadoParametroError(null)

        const result = await CambiarEstadoParametroDestino({ parametroId: par.id, activo: true })

        if (result?.error) {
            setEstadoParametroError(result.error)
            setLoading(false)
            return
        }

        setLoading(false)
        router.refresh()
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

          {estadoParametroError && (
            <div className="bg-red-50 text-red-600 border border-red-200 rounded-md px-3 py-2 text-sm">
              {estadoParametroError}
            </div>
          )}
    
          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-medium">ID</th>
                    <th className="px-6 py-4 font-medium">Tipo</th>
                    <th className="px-6 py-4 font-medium">Nombre</th>
                    <th className="px-6 py-4 font-medium">Estado</th>
                    <th className="px-6 py-4 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {parametros.map((par) => (
                    <tr key={par.id} className={`transition-colors hover:bg-slate-50/50 ${par.tipo === 'DESTINO' && !par.activo ? 'opacity-60' : ''}`}>
                      <td className="px-6 py-4 font-medium text-slate-900">{par.id}</td>
                      <td className="px-6 py-4">{par.tipo}</td>
                      <td className="px-6 py-4">{par.nombre}</td>
                      <td className="px-6 py-4">
                        <Badge variant={par.activo === true ? 'success' : 'default'}>
                          {par.activo === true ? 'Activo':'Inactivo'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {par.tipo === 'DESTINO' ? (
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" disabled={loading} onClick={() => openEditParametro(par)}>
                              Editar
                            </Button>
                            {par.activo ? (
                              <Button variant="danger" size="sm" disabled={loading} onClick={() => handleDesactivarParametro(par)}>
                                Desactivar
                              </Button>
                            ) : (
                              <Button variant="primary" size="sm" disabled={loading} onClick={() => handleActivarParametro(par)}>
                                Activar
                              </Button>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
    
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Rutas y distancias</h3>
              <p className="text-slate-500 text-sm mt-1">Distancias configuradas entre ubicaciones (direccional)</p>
            </div>
            <Button onClick={() => { setRutaError(null); setIsRutaModalOpen(true) }}>
              <Plus className="w-4 h-4 mr-2" /> Nueva ruta
            </Button>
          </div>

          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-medium">Origen</th>
                    <th className="px-6 py-4 font-medium">Destino</th>
                    <th className="px-6 py-4 font-medium">Distancia (km)</th>
                    <th className="px-6 py-4 font-medium">Estado</th>
                    <th className="px-6 py-4 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {rutas.map((ruta) => (
                    <tr key={ruta.id} className={`transition-colors hover:bg-slate-50/50 ${ruta.activo ? '' : 'opacity-60'}`}>
                      <td className="px-6 py-4">{ruta.origen?.nombre}</td>
                      <td className="px-6 py-4">{ruta.destino?.nombre}</td>
                      <td className="px-6 py-4">{ruta.distanciaKm} km</td>
                      <td className="px-6 py-4">
                        <Badge variant={ruta.activo ? 'success' : 'default'}>
                          {ruta.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="outline" size="sm" onClick={() => openEditRuta(ruta)}>Editar</Button>
                      </td>
                    </tr>
                  ))}
                  {rutas.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-6 text-center text-slate-400">No hay rutas registradas.</td>
                    </tr>
                  )}
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

          <Modal
            isOpen={isRutaModalOpen}
            onClose={() => setIsRutaModalOpen(false)}
            title="Nueva Ruta"
            footer={
              <>
                <Button variant="outline" onClick={() => setIsRutaModalOpen(false)}>Cancelar</Button>
                <Button type="submit">Guardar</Button>
              </>
            }
            funcion={handleAddRuta}
          >
            <div className="space-y-4">
                {rutaError && (
                  <div className="bg-red-50 text-red-600 border border-red-200 rounded-md px-3 py-2 text-sm">{rutaError}</div>
                )}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Origen</label>
                    <select name="origenId" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                      <option value=''>Selecciona una opción</option>
                      {ubicaciones.map((par) => (
                        <option value={par.id} key={par.id}>{par.nombre}</option>
                      ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Destino</label>
                    <select name="destinoId" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                      <option value=''>Selecciona una opción</option>
                      {ubicaciones.map((par) => (
                        <option value={par.id} key={par.id}>{par.nombre}</option>
                      ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Distancia (km)</label>
                    <input
                      name="distanciaKm"
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Ej. 1010"
                    />
                </div>
            </div>
          </Modal>

          <Modal
            isOpen={isEditRutaModalOpen}
            onClose={() => { setIsEditRutaModalOpen(false); setEditingRuta(null) }}
            title="Editar Ruta"
            footer={
              <>
                <Button variant="outline" onClick={() => { setIsEditRutaModalOpen(false); setEditingRuta(null) }}>Cancelar</Button>
                <Button type="submit">Guardar</Button>
              </>
            }
            funcion={handleEditRuta}
          >
            <div className="space-y-4">
                {rutaError && (
                  <div className="bg-red-50 text-red-600 border border-red-200 rounded-md px-3 py-2 text-sm">{rutaError}</div>
                )}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Origen</label>
                    <input
                      type="text"
                      value={editingRuta?.origen?.nombre ?? ''}
                      disabled
                      readOnly
                      className="w-full rounded-md border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Destino</label>
                    <input
                      type="text"
                      value={editingRuta?.destino?.nombre ?? ''}
                      disabled
                      readOnly
                      className="w-full rounded-md border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Distancia (km)</label>
                    <input
                      name="distanciaKm"
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      defaultValue={editingRuta?.distanciaKm}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>
                <div className="flex items-center space-x-2 pt-2">
                    <input name="activo" type="checkbox" id="rutaActivo" defaultChecked={editingRuta?.activo} className="rounded text-emerald-600 focus:ring-emerald-500" />
                    <label htmlFor="rutaActivo" className="text-sm text-slate-700">Ruta Activa</label>
                </div>
            </div>
          </Modal>

          <Modal
            isOpen={isEditParametroModalOpen}
            onClose={closeEditParametro}
            title="Editar Destino"
            footer={
              <>
                <Button variant="outline" onClick={closeEditParametro}>Cancelar</Button>
                <Button type="submit" disabled={loading}>Guardar</Button>
              </>
            }
            funcion={handleEditParametro}
          >
            <div className="space-y-4">
                {editParametroError && (
                  <div className="bg-red-50 text-red-600 border border-red-200 rounded-md px-3 py-2 text-sm">{editParametroError}</div>
                )}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                    <input
                      type="text"
                      value="DESTINO"
                      disabled
                      readOnly
                      className="w-full rounded-md border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nombre / Descripción</label>
                    <input
                      name="nombre"
                      type="text"
                      defaultValue={editingParametro?.nombre}
                      placeholder="Ej. Planta Este"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>
            </div>
          </Modal>
    </div>
  )
}
