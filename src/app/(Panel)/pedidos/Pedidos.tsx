'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { mockPedidos } from "@/lib/temp/mockData"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import Badge from "@/components/ui/Badge"
import { Plus, Search, Navigation, Pencil } from "lucide-react"
import { CrearPedidos, ActualizarDatosEntregaPedido } from "@/actions/pedidos.actions"
import { Pedido, Cliente, Parametro, Rol } from "@/types"
import Link from "next/link"

interface Props {
  pedidos: Pedido[],
  clientes: Cliente[],
  parametros: Parametro[],
  rol: Rol
}

export default function Pedidos({pedidos, clientes, parametros, rol}: Props) {
    const esSoloLectura = rol === 'GERENCIA'
    const router = useRouter()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [pedidoEditando, setPedidoEditando] = useState<Pedido | null>(null)
    const [editError, setEditError] = useState<string | null>(null)
    const [loadingEdit, setLoadingEdit] = useState(false)

    const handleAddPedido = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      setLoading(true)
      setError(null)

      const form = e.currentTarget
      const formData = new FormData(form)

      const destinatarioNombre = ((formData.get('destinatarioNombre') as string) || '').trim()
      const destinatarioDireccion = ((formData.get('destinatarioDireccion') as string) || '').trim()
      const destinatarioTelefonoRaw = ((formData.get('destinatarioTelefono') as string) || '').trim()
      const pesoKgRaw = ((formData.get('pesoKg') as string) || '').trim()
      const cantidadUnidadesRaw = ((formData.get('cantidadUnidades') as string) || '').trim()
      const idOrigen = (formData.get('idOrigen') as string) || ''
      const idDestino = (formData.get('idDestino') as string) || ''

      if (!destinatarioNombre) {
          setError('El nombre del destinatario es obligatorio.')
          setLoading(false)
          return
      }
      if (!destinatarioDireccion) {
          setError('La dirección de entrega es obligatoria.')
          setLoading(false)
          return
      }
      const pesoKg = Number(pesoKgRaw)
      if (!pesoKgRaw || !Number.isFinite(pesoKg) || pesoKg <= 0) {
          setError('El peso total debe ser mayor a 0.')
          setLoading(false)
          return
      }
      const cantidadUnidades = Number(cantidadUnidadesRaw)
      if (!Number.isInteger(cantidadUnidades) || cantidadUnidades <= 0) {
          setError('La cantidad de unidades debe ser un entero mayor a 0.')
          setLoading(false)
          return
      }
      if (idOrigen && idDestino && idOrigen === idDestino) {
          setError('El origen y el destino deben ser diferentes.')
          setLoading(false)
          return
      }

      const datosEntrega = {
          destinatarioNombre,
          destinatarioDireccion,
          destinatarioTelefono: destinatarioTelefonoRaw || null,
          pesoKg,
          cantidadUnidades,
      }

      const result = await CrearPedidos(formData, datosEntrega)

      if (result?.error) {
          setError(result.error)
          setLoading(false)
      } else {
          form.reset()
          setIsModalOpen(false)
          setLoading(false)
      }
    }

    const pedidoEditable = (ped: Pedido) =>
        ped.estado === 'PENDIENTE' && ped.viajeId === null && ped.unidadId === null

    const abrirEdicion = (pedido: Pedido) => {
        setEditError(null)
        setPedidoEditando(pedido)
    }

    const cerrarEdicion = () => {
        setPedidoEditando(null)
        setEditError(null)
    }

    const handleEditarEntrega = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!pedidoEditando) return
        setLoadingEdit(true)
        setEditError(null)

        const formData = new FormData(e.currentTarget)
        const destinatarioNombre = ((formData.get('destinatarioNombre') as string) || '').trim()
        const destinatarioDireccion = ((formData.get('destinatarioDireccion') as string) || '').trim()
        const destinatarioTelefonoRaw = ((formData.get('destinatarioTelefono') as string) || '').trim()
        const pesoKgRaw = ((formData.get('pesoKg') as string) || '').trim()
        const cantidadUnidadesRaw = ((formData.get('cantidadUnidades') as string) || '').trim()

        if (!destinatarioNombre) {
            setEditError('El nombre del destinatario es obligatorio.')
            setLoadingEdit(false)
            return
        }
        if (!destinatarioDireccion) {
            setEditError('La dirección de entrega es obligatoria.')
            setLoadingEdit(false)
            return
        }
        const pesoKg = Number(pesoKgRaw)
        if (!pesoKgRaw || !Number.isFinite(pesoKg) || pesoKg <= 0) {
            setEditError('El peso total debe ser mayor a 0.')
            setLoadingEdit(false)
            return
        }
        const cantidadUnidades = Number(cantidadUnidadesRaw)
        if (!Number.isInteger(cantidadUnidades) || cantidadUnidades <= 0) {
            setEditError('La cantidad de unidades debe ser un entero mayor a 0.')
            setLoadingEdit(false)
            return
        }

        const result = await ActualizarDatosEntregaPedido({
            pedidoId: pedidoEditando.id,
            destinatarioNombre,
            destinatarioDireccion,
            destinatarioTelefono: destinatarioTelefonoRaw || null,
            pesoKg,
            cantidadUnidades,
        })

        if (result?.error) {
            setEditError(result.error)
            setLoadingEdit(false)
            return
        }

        cerrarEdicion()
        setLoadingEdit(false)
        router.refresh()
    }

    const ubicaciones = parametros.filter((par) => par.tipo === 'DESTINO' && par.activo)

    const getStatusBadge = (status: string) => {
        switch(status) {
        case 'ENTREGADO': return 'success'
        case 'EN_TRANSITO': return 'warning'
        case 'PENDIENTE': return 'info'
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
            {!esSoloLectura && (
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Registrar Pedido
            </Button>
          )}
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
                        <div className="flex items-center justify-end gap-2">
                          {!esSoloLectura && pedidoEditable(ped) && (
                            <Button variant="outline" size="sm" onClick={() => abrirEdicion(ped)}>
                              <Pencil className="w-4 h-4 mr-2" /> Editar
                            </Button>
                          )}
                          <Link href={`/pedidos/trazabilidad/${ped.id}`}>
                            <Button variant="outline" size="sm">
                              <Navigation className="w-4 h-4 mr-2" /> Trazabilidad
                            </Button>
                          </Link>
                        </div>
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
              {error && (
                <div className="bg-red-50 text-red-600 border border-red-200 rounded-md px-3 py-2 text-sm">
                  {error}
                </div>
              )}
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Cliente</p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cliente</label>
                <select name="idCliente" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value=''>Seleciona una opcion</option>
                  {clientes.map((cli)=>(
                    <option value={cli.id} key={cli.id}>{cli.razonSocial}</option>
                  ))}
                </select>
              </div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Datos de entrega</p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Destinatario</label>
                <input
                  name="destinatarioNombre"
                  type="text"
                  required
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Nombre de quien recibe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Dirección de entrega</label>
                <input
                  name="destinatarioDireccion"
                  type="text"
                  required
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Dirección del punto de entrega"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono / contacto</label>
                <input
                  name="destinatarioTelefono"
                  type="text"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Opcional"
                />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Carga</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Peso total (kg)</label>
                  <input
                    name="pesoKg"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Ej. 1200.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad de unidades / bultos</label>
                  <input
                    name="cantidadUnidades"
                    type="number"
                    min="1"
                    step="1"
                    required
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Ej. 10"
                  />
                </div>
              </div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Ruta</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Origen</label>
                  <select name="idOrigen" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value=''>Seleciona una opcion</option>
                    {ubicaciones.map((par)=>(
                      <option value={par.id} key={par.id}>{par.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Destino</label>
                  <select name="idDestino" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value=''>Seleciona una opcion</option>
                    {ubicaciones.map((par)=>(
                      <option value={par.id} key={par.id}>{par.nombre}</option>
                    ))}
                  </select>
                </div>
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

          <Modal
            isOpen={pedidoEditando !== null}
            onClose={cerrarEdicion}
            title={`Editar entrega ${pedidoEditando?.codigo ?? ''}`}
            footer={
              <>
                <Button type="button" variant="outline" onClick={cerrarEdicion}>Cancelar</Button>
                <Button type="submit" disabled={loadingEdit}>
                  {loadingEdit ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </>
            }
            funcion={handleEditarEntrega}
          >
            <div key={pedidoEditando?.id} className="space-y-4">
              {editError && (
                <div className="bg-red-50 text-red-600 border border-red-200 rounded-md px-3 py-2 text-sm">
                  {editError}
                </div>
              )}
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Datos de entrega</p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Destinatario</label>
                <input
                  name="destinatarioNombre"
                  type="text"
                  required
                  defaultValue={pedidoEditando?.destinatarioNombre ?? ''}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Nombre de quien recibe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Dirección de entrega</label>
                <input
                  name="destinatarioDireccion"
                  type="text"
                  required
                  defaultValue={pedidoEditando?.destinatarioDireccion ?? ''}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Dirección del punto de entrega"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono / contacto</label>
                <input
                  name="destinatarioTelefono"
                  type="text"
                  defaultValue={pedidoEditando?.destinatarioTelefono ?? ''}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Opcional"
                />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Carga</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Peso total (kg)</label>
                  <input
                    name="pesoKg"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    defaultValue={pedidoEditando?.pesoKg ?? ''}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Ej. 1200.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad de unidades / bultos</label>
                  <input
                    name="cantidadUnidades"
                    type="number"
                    min="1"
                    step="1"
                    required
                    defaultValue={pedidoEditando?.cantidadUnidades ?? ''}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Ej. 10"
                  />
                </div>
              </div>
            </div>
          </Modal>
    </div>
  )
}
