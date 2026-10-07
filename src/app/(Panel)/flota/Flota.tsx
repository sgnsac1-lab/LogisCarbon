'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { mockFlota } from "@/lib/temp/mockData"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import Badge from "@/components/ui/Badge"
import { Truck } from "lucide-react"
import { Unidad, Pedido, Viaje, ViajeTramo, Parametro, Rol } from "@/types"
import { CrearUnidad, AsignarPedidosAViaje, ObtenerViajePlanificadoPorUnidad, ConfigurarRecorridoViaje, IniciarViaje, DesasignarPedidoDeViaje, DescartarViajePlanificado, ActualizarUnidad, CambiarEstadoMantenimientoUnidad } from "@/actions/flota.actions"

interface Props {
    flotilla: Unidad[],
    pedidos: Pedido[],
    parametros: Parametro[],
    rol: Rol
}

interface ViajePlanificadoData {
    viaje: Viaje
    capacidadKg: number
    pesoOcupadoKg: number
    pesoDisponibleKg: number
    distanciaTotal: number | null
}

function pedidoIncompleto(pedido: Pedido): boolean {
    return (
        pedido.pesoKg === null ||
        pedido.pesoKg <= 0 ||
        pedido.cantidadUnidades === null ||
        pedido.cantidadUnidades <= 0 ||
        !pedido.destinatarioNombre ||
        pedido.destinatarioNombre.trim() === '' ||
        !pedido.destinatarioDireccion ||
        pedido.destinatarioDireccion.trim() === ''
    )
}

export default function Flota({flotilla, pedidos, parametros, rol}:Props) {
    const esSoloLectura = rol === 'GERENCIA'
    const router = useRouter()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isNewTruckModalOpen, setIsNewTruckModalOpen] = useState(false)
    const [selectedTruck, setSelectedTruck] = useState<number | null>(null)
    const [viajePlanificado, setViajePlanificado] = useState<ViajePlanificadoData | null>(null)
    const [selectedPedidoIds, setSelectedPedidoIds] = useState<number[]>([])
    const [paradas, setParadas] = useState<number[]>([])
    const [paradaSeleccionada, setParadaSeleccionada] = useState('')
    const [conductor, setConductor] = useState('')
    const [loading, setLoading] = useState(false)
    const [loadingViaje, setLoadingViaje] = useState(false)
    const [loadingRecorrido, setLoadingRecorrido] = useState(false)
    const [recorridoError, setRecorridoError] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [unidadEnEdicion, setUnidadEnEdicion] = useState<Unidad | null>(null)
    const [editError, setEditError] = useState<string | null>(null)
    const [mantenimientoError, setMantenimientoError] = useState<string | null>(null)

    const nombreParada = (id: number) =>
        parametros.find((parametro) => parametro.id === id)?.nombre ?? `#${id}`

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
            router.refresh()
        }
    }

    const openGestionCarga = async (id: number) => {
        setSelectedTruck(id)
        setIsModalOpen(true)
        setSelectedPedidoIds([])
        setConductor('')
        setViajePlanificado(null)
        setError(null)
        setParadas([])
        setParadaSeleccionada('')
        setRecorridoError(null)
        setLoadingViaje(true)

        const res = await ObtenerViajePlanificadoPorUnidad(id)
        if (res.success) {
            setViajePlanificado(res.data ?? null)
            if (res.data?.viaje?.conductor) {
                setConductor(res.data.viaje.conductor)
            }
        } else {
            setError(res.error ?? 'No se pudo cargar el viaje planificado.')
        }
        setLoadingViaje(false)
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setSelectedPedidoIds([])
        setConductor('')
        setViajePlanificado(null)
        setError(null)
        setParadas([])
        setParadaSeleccionada('')
        setRecorridoError(null)
    }

    const togglePedido = (id: number) => {
        setSelectedPedidoIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        )
    }

    const agregarParada = () => {
        const paradaId = Number(paradaSeleccionada)
        if (!Number.isInteger(paradaId) || paradaId <= 0) return
        setParadas((prev) => [...prev, paradaId])
        setParadaSeleccionada('')
        setRecorridoError(null)
    }

    const quitarParada = (index: number) => {
        setParadas((prev) => prev.filter((_, itemIndex) => itemIndex !== index))
        setRecorridoError(null)
    }

    const moverParada = (index: number, direccion: number) => {
        setParadas((prev) => {
            const destino = index + direccion
            if (destino < 0 || destino >= prev.length) return prev
            const copia = [...prev]
            const temporal = copia[index]
            copia[index] = copia[destino]
            copia[destino] = temporal
            return copia
        })
        setRecorridoError(null)
    }

    const guardarRecorrido = async () => {
        if (!viajePlanificado?.viaje) return
        setLoadingRecorrido(true)
        setRecorridoError(null)

        const result = await ConfigurarRecorridoViaje({
            viajeId: viajePlanificado.viaje.id,
            paradaIds: paradas,
        })

        if (!result.success) {
            setRecorridoError(result.error ?? 'No se pudo guardar el recorrido.')
            setLoadingRecorrido(false)
            return
        }

        const res = await ObtenerViajePlanificadoPorUnidad(viajePlanificado.viaje.unidadId)
        if (res.success) {
            setViajePlanificado(res.data ?? null)
        }
        setParadas([])
        setParadaSeleccionada('')
        setLoadingRecorrido(false)
        router.refresh()
    }

    const handleIniciarViaje = async () => {
        if (!viajePlanificado?.viaje) return
        setLoading(true)
        setError(null)

        const result = await IniciarViaje({ viajeId: viajePlanificado.viaje.id })

        if (!result.success) {
            setError(result.error ?? 'No se pudo iniciar el viaje.')
            setLoading(false)
            return
        }

        closeModal()
        setLoading(false)
        router.refresh()
    }

    const handleAsignarCarga = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (selectedTruck === null) return
        setLoading(true)
        setError(null)

        const result = await AsignarPedidosAViaje({
            unidadId: selectedTruck,
            pedidoIds: selectedPedidoIds,
            conductor: conductor,
        })

        if (!result.success) {
            setError(result.error ?? 'No se pudo asignar la carga al viaje.')
            setLoading(false)
            return
        }

        closeModal()
        setLoading(false)
        router.refresh()
    }

    const handleQuitarPedido = async (pedido: Pedido) => {
        if (!viajePlanificado?.viaje || viajePlanificado.viaje.estado !== 'PLANIFICADO') return

        const advertencia =
            tramos.length > 0
                ? '\n\nEl recorrido planificado se eliminará y deberá configurarse nuevamente.'
                : ''
        if (!window.confirm(`¿Quitar ${pedido.codigo} de este viaje?${advertencia}`)) return

        setLoading(true)
        setError(null)
        setRecorridoError(null)

        const result = await DesasignarPedidoDeViaje({
            viajeId: viajePlanificado.viaje.id,
            pedidoId: pedido.id,
        })

        if (!result.success) {
            setError(result.error ?? 'No se pudo quitar el pedido del viaje.')
            setLoading(false)
            return
        }

        if (result.data?.viajeEliminado) {
            closeModal()
            setLoading(false)
            router.refresh()
            return
        }

        setSelectedPedidoIds([])
        setParadas([])
        setParadaSeleccionada('')
        setRecorridoError(null)

        const res = await ObtenerViajePlanificadoPorUnidad(viajePlanificado.viaje.unidadId)
        if (res.success) {
            setViajePlanificado(res.data ?? null)
        } else {
            setError(res.error ?? 'No se pudo recargar el viaje planificado.')
        }
        setLoading(false)
        router.refresh()
    }

    const handleDescartarViaje = async () => {
        if (!viajePlanificado?.viaje || viajePlanificado.viaje.estado !== 'PLANIFICADO') return
        const confirmado = window.confirm(
            'Se liberarán todos los pedidos asignados y se eliminará el recorrido planificado. Esta acción solo afecta un viaje que todavía no ha iniciado.'
        )
        if (!confirmado) return

        setLoading(true)
        setError(null)

        const result = await DescartarViajePlanificado({ viajeId: viajePlanificado.viaje.id })

        if (!result.success) {
            setError(result.error ?? 'No se pudo descartar el viaje planificado.')
            setLoading(false)
            return
        }

        closeModal()
        setLoading(false)
        router.refresh()
    }

    const handleEditarUnidad = (unidad: Unidad) => {
        setUnidadEnEdicion(unidad)
        setEditError(null)
        setIsEditModalOpen(true)
    }

    const closeEditModal = () => {
        setIsEditModalOpen(false)
        setUnidadEnEdicion(null)
        setEditError(null)
    }

    const handleGuardarEdicion = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!unidadEnEdicion) return
        setLoading(true)
        setEditError(null)

        const formData = new FormData(e.currentTarget)
        const placa = String(formData.get('placa') ?? '').trim()
        const codigoInterno = String(formData.get('codigoInterno') ?? '').trim()
        const marca = String(formData.get('marca') ?? '').trim()
        const anio = Number(formData.get('anio'))
        const capacidadTon = Number(formData.get('capacidadTon'))
        const factorEmision = Number(formData.get('factorEmision'))

        if (!placa) {
            setEditError('La placa es obligatoria.')
            setLoading(false)
            return
        }
        if (!codigoInterno) {
            setEditError('El código interno es obligatorio.')
            setLoading(false)
            return
        }
        if (!marca) {
            setEditError('La marca es obligatoria.')
            setLoading(false)
            return
        }
        if (!Number.isInteger(anio) || anio <= 0) {
            setEditError('El año debe ser un entero válido.')
            setLoading(false)
            return
        }
        if (!Number.isFinite(capacidadTon) || capacidadTon <= 0) {
            setEditError('La capacidad debe ser mayor a 0.')
            setLoading(false)
            return
        }
        if (!Number.isFinite(factorEmision) || factorEmision <= 0) {
            setEditError('El factor de emisión debe ser mayor a 0.')
            setLoading(false)
            return
        }

        const result = await ActualizarUnidad({
            unidadId: unidadEnEdicion.id,
            placa,
            codigoInterno,
            marca,
            anio,
            capacidadTon,
            factorEmision,
        })

        if (!result.success) {
            setEditError(result.error ?? 'No se pudo actualizar la unidad.')
            setLoading(false)
            return
        }

        closeEditModal()
        setLoading(false)
        router.refresh()
    }

    const handleEnviarMantenimiento = async (unidad: Unidad) => {
        const confirmado = window.confirm(
            `¿Enviar la unidad ${unidad.placa} a mantenimiento? No podrá recibir nuevos viajes hasta que vuelva a estar disponible.`
        )
        if (!confirmado) return

        setLoading(true)
        setMantenimientoError(null)

        const result = await CambiarEstadoMantenimientoUnidad({
            unidadId: unidad.id,
            enMantenimiento: true,
        })

        if (!result.success) {
            setMantenimientoError(result.error ?? 'No se pudo enviar la unidad a mantenimiento.')
            setLoading(false)
            return
        }

        setLoading(false)
        router.refresh()
    }

    const handleMarcarDisponible = async (unidad: Unidad) => {
        const confirmado = window.confirm(`¿Marcar la unidad ${unidad.placa} como disponible?`)
        if (!confirmado) return

        setLoading(true)
        setMantenimientoError(null)

        const result = await CambiarEstadoMantenimientoUnidad({
            unidadId: unidad.id,
            enMantenimiento: false,
        })

        if (!result.success) {
            setMantenimientoError(result.error ?? 'No se pudo marcar la unidad como disponible.')
            setLoading(false)
            return
        }

        setLoading(false)
        router.refresh()
    }

    const selectedUnidad = flotilla.find((unidad) => unidad.id === selectedTruck) ?? null
    const capacidadKg = selectedUnidad ? selectedUnidad.capacidadTon * 1000 : 0
    const pesoOcupadoKg = viajePlanificado?.pesoOcupadoKg ?? 0
    const pesoSeleccionadoKg = pedidos
        .filter((pedido) => selectedPedidoIds.includes(pedido.id))
        .reduce((acc, pedido) => acc + (pedido.pesoKg ?? 0), 0)
    const pesoFinalKg = pesoOcupadoKg + pesoSeleccionadoKg
    const pesoDisponibleFinalKg = capacidadKg - pesoFinalKg
    const sobrepeso = pesoFinalKg > capacidadKg
    const conductorBloqueado = Boolean(viajePlanificado?.viaje?.conductor)
    const pedidosEnViaje = viajePlanificado?.viaje?.pedidos ?? []
    const tramos: ViajeTramo[] = viajePlanificado?.viaje?.tramos ?? []
    const distanciaTotalViaje = viajePlanificado?.distanciaTotal ?? viajePlanificado?.viaje?.distanciaTotal ?? 0
    const puedeIniciar =
        Boolean(viajePlanificado?.viaje) &&
        pedidosEnViaje.length > 0 &&
        Boolean(viajePlanificado?.viaje?.conductor && viajePlanificado.viaje.conductor.trim() !== '') &&
        tramos.length > 0 &&
        typeof distanciaTotalViaje === 'number' &&
        Number.isFinite(distanciaTotalViaje) &&
        distanciaTotalViaje > 0
    const puedeConfirmar =
        selectedTruck !== null &&
        selectedPedidoIds.length > 0 &&
        !sobrepeso &&
        !loading &&
        !loadingViaje

  return (
    <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Flota y Asignación</h2>
              <p className="text-slate-500 text-sm mt-1">Gestión de unidades y planificación de carga</p>
            </div>
            {!esSoloLectura && (
            <Button onClick={() => setIsNewTruckModalOpen(true)}>
              <Truck className="w-4 h-4 mr-2" /> Nuevo Vehículo
            </Button>
          )}
          </div>

          {mantenimientoError && (
            <div className="bg-red-50 text-red-600 border border-red-200 rounded-md px-3 py-2 text-sm">
              {mantenimientoError}
            </div>
          )}
    
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
    
                {!esSoloLectura && (
                <Button 
                  className="w-full" 
                  variant={unidad.estado === 'DISPONIBLE' ? 'primary' : 'outline'}
                  disabled={unidad.estado !== 'DISPONIBLE'}
                  onClick={() => openGestionCarga(unidad.id)}
                >
                  Gestionar carga
                </Button>
              )}

                {!esSoloLectura && (() => {
                  const viajeActivo = unidad.viajeActivo ?? null
                  const tieneViajeActivo = Boolean(viajeActivo)
                  const esEditable = unidad.estado === 'DISPONIBLE' && !tieneViajeActivo
                  const tituloEditar =
                    unidad.estado === 'EN_RUTA'
                      ? 'La unidad está en ruta y no puede editarse.'
                      : unidad.estado === 'MANTENIMIENTO'
                        ? 'La unidad está en mantenimiento y no puede editarse.'
                        : tieneViajeActivo
                          ? 'Descarte el viaje planificado para editar la unidad.'
                          : ''
                  const puedeEnviarMantenimiento = unidad.estado === 'DISPONIBLE' && !tieneViajeActivo
                  const tituloMantenimiento =
                    unidad.estado === 'EN_RUTA'
                      ? 'La unidad está en ruta y no puede pasar a mantenimiento.'
                      : tieneViajeActivo
                        ? 'Descarte el viaje planificado para enviar la unidad a mantenimiento.'
                        : ''
                  const esMantenimiento = unidad.estado === 'MANTENIMIENTO'

                  return (
                    <div className="mt-2 flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        disabled={!esEditable}
                        title={tituloEditar}
                        onClick={() => handleEditarUnidad(unidad)}
                      >
                        Editar
                      </Button>
                      {esMantenimiento ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full"
                          disabled={loading}
                          onClick={() => handleMarcarDisponible(unidad)}
                        >
                          Marcar disponible
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          disabled={!puedeEnviarMantenimiento || loading}
                          title={tituloMantenimiento}
                          onClick={() => handleEnviarMantenimiento(unidad)}
                        >
                          Enviar a mantenimiento
                        </Button>
                      )}
                    </div>
                  )
                })()}
              </Card>
            ))}
          </div>
    
          <Modal 
            isOpen={isModalOpen} 
            onClose={closeModal} 
            title="Gestionar Carga"
            footer={
              <>
                <Button variant="outline" onClick={closeModal}>Cancelar</Button>
                {viajePlanificado?.viaje?.estado === 'PLANIFICADO' && (
                  <Button type="button" variant="danger" onClick={handleDescartarViaje} disabled={loading}>
                    Descartar viaje
                  </Button>
                )}
                {puedeIniciar && (
                  <Button type="button" variant="outline" onClick={handleIniciarViaje} disabled={loading}>
                    Iniciar viaje
                  </Button>
                )}
                <Button type="submit" disabled={!puedeConfirmar}>Confirmar</Button>
              </>
            }
            funcion={handleAsignarCarga}
          >
            <div className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 border border-red-200 rounded-md px-3 py-2 text-sm">
                  {error}
                </div>
              )}

              {loadingViaje ? (
                <p className="text-sm text-slate-500">Cargando viaje planificado...</p>
              ) : (
                <>
                  {viajePlanificado?.viaje && (
                    <div className="rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm">
                      <span className="text-emerald-700">Viaje planificado: </span>
                      <span className="font-semibold text-emerald-900">{viajePlanificado.viaje.codigo}</span>
                    </div>
                  )}

                  {conductorBloqueado ? (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Conductor</label>
                      <input
                        type="text"
                        value={conductor}
                        disabled
                        readOnly
                        className="w-full rounded-md border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-500"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Conductor</label>
                      <input
                        type="text"
                        value={conductor}
                        onChange={(e) => setConductor(e.target.value)}
                        required
                        placeholder="Nombre del conductor"
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  )}

                  {pedidosEnViaje.length > 0 && (
                    <div className="rounded-md border border-slate-200">
                      <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
                        Pedidos en el viaje
                      </div>
                      <div className="divide-y divide-slate-100">
                        {pedidosEnViaje.map((pedido) => (
                          <div key={pedido.id} className="px-3 py-2 text-sm flex items-center justify-between gap-2">
                            <span className="text-slate-700 min-w-0 flex-1 truncate">
                              {pedido.codigo} · {pedido.cliente?.razonSocial ?? 'Sin cliente'} · {pedido.destino?.nombre ?? ''}
                            </span>
                            <span className="text-slate-500 whitespace-nowrap">
                              {(pedido.pesoKg ?? 0).toLocaleString('es-PE')} kg · {pedido.cantidadUnidades ?? 0} bultos
                            </span>
                            {viajePlanificado?.viaje?.estado === 'PLANIFICADO' && (
                              <button
                                type="button"
                                onClick={() => handleQuitarPedido(pedido)}
                                disabled={loading}
                                className="rounded border border-red-200 px-2 text-xs text-red-600 hover:bg-red-50 disabled:opacity-40 whitespace-nowrap"
                              >
                                Quitar
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Pedidos disponibles</label>
                    <div className="max-h-56 overflow-y-auto rounded-md border border-slate-200 divide-y divide-slate-100">
                      {pedidos.length === 0 && (
                        <p className="px-3 py-3 text-sm text-slate-400">No hay pedidos pendientes disponibles.</p>
                      )}
                      {pedidos.map((pedido) => {
                        const incompleto = pedidoIncompleto(pedido)
                        return (
                          <label
                            key={pedido.id}
                            className={`flex items-start gap-3 px-3 py-2 text-sm ${incompleto ? 'opacity-60' : 'cursor-pointer hover:bg-slate-50'}`}
                          >
                            <input
                              type="checkbox"
                              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                              checked={selectedPedidoIds.includes(pedido.id)}
                              disabled={incompleto}
                              onChange={() => togglePedido(pedido.id)}
                            />
                            <span className="flex-1">
                              <span className="block font-medium text-slate-800">
                                {pedido.codigo} · {pedido.cliente?.razonSocial ?? 'Sin cliente'}
                              </span>
                              <span className="block text-slate-500">
                                {pedido.destino?.nombre ?? 'Sin destino'} · {(pedido.pesoKg ?? 0).toLocaleString('es-PE')} kg · {pedido.cantidadUnidades ?? 0} bultos
                              </span>
                              {pedido.destinatarioNombre && (
                                <span className="block text-xs text-slate-400">Entrega: {pedido.destinatarioNombre}</span>
                              )}
                              {incompleto && (
                                <span className="block text-xs font-medium text-amber-600">Datos incompletos</span>
                              )}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">{selectedPedidoIds.length} pedido(s) seleccionado(s)</p>
                  </div>

                  <div className="rounded-md bg-slate-50 border border-slate-200 p-3 text-sm">
                    <p className="text-xs font-semibold uppercase text-slate-500 mb-2">Capacidad</p>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Capacidad total</span>
                        <span className="font-medium text-slate-800">{capacidadKg.toLocaleString('es-PE')} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Carga actual</span>
                        <span className="font-medium text-slate-800">{pesoOcupadoKg.toLocaleString('es-PE')} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Nueva carga</span>
                        <span className="font-medium text-slate-800">{pesoSeleccionadoKg.toLocaleString('es-PE')} kg</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-200 pt-1">
                        <span className="text-slate-500">Carga final</span>
                        <span className="font-medium text-slate-800">{pesoFinalKg.toLocaleString('es-PE')} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Disponible</span>
                        <span className={`font-medium ${pesoDisponibleFinalKg < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {pesoDisponibleFinalKg.toLocaleString('es-PE')} kg
                        </span>
                      </div>
                    </div>
                  </div>

                  {sobrepeso && (
                    <div className="bg-red-50 text-red-600 border border-red-200 rounded-md px-3 py-2 text-sm">
                      La carga seleccionada supera la capacidad de la unidad.
                    </div>
                  )}

                  {viajePlanificado?.viaje && (
                    <div className="rounded-md border border-slate-200 p-3">
                      <p className="text-xs font-semibold uppercase text-slate-500 mb-2">Recorrido del viaje</p>

                      {tramos.length > 0 ? (
                        <div className="mb-3">
                          <div className="divide-y divide-slate-100">
                            {tramos.map((tramo) => (
                              <div key={tramo.id} className="flex justify-between gap-2 py-1 text-sm">
                                <span className="text-slate-700">
                                  {tramo.orden}. {tramo.origen?.nombre ?? nombreParada(tramo.origenId)} → {tramo.destino?.nombre ?? nombreParada(tramo.destinoId)}
                                </span>
                                <span className="text-slate-500 whitespace-nowrap">
                                  {tramo.distanciaKm.toLocaleString('es-PE')} km
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between border-t border-slate-200 mt-2 pt-2 text-sm font-medium">
                            <span className="text-slate-600">Distancia total</span>
                            <span className="text-slate-800">
                              {(viajePlanificado.viaje.distanciaTotal ?? distanciaTotalViaje).toLocaleString('es-PE')} km
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400 mb-3">Recorrido pendiente de configurar.</p>
                      )}

                      {pedidosEnViaje.length > 0 && (
                        <div className="mb-3 space-y-0.5 text-xs text-slate-500">
                          <p className="text-xs font-semibold uppercase text-slate-500">Pedidos del viaje</p>
                          {pedidosEnViaje.map((pedido) => (
                            <div key={pedido.id}>
                              <span className="font-medium text-slate-700">{pedido.codigo}:</span>{' '}
                              {pedido.origen?.nombre ?? nombreParada(pedido.origenId)} → {pedido.destino?.nombre ?? nombreParada(pedido.destinoId)}
                            </div>
                          ))}
                        </div>
                      )}

                      {paradas.length > 0 && (
                        <ol className="space-y-1 mb-2">
                          {paradas.map((paradaId, index) => (
                            <li key={`${paradaId}-${index}`} className="flex items-center gap-2 text-sm">
                              <span className="w-5 text-slate-500">{index + 1}.</span>
                              <span className="flex-1 text-slate-800">{nombreParada(paradaId)}</span>
                              <button
                                type="button"
                                onClick={() => moverParada(index, -1)}
                                disabled={index === 0}
                                className="rounded border border-slate-300 px-2 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                onClick={() => moverParada(index, 1)}
                                disabled={index === paradas.length - 1}
                                className="rounded border border-slate-300 px-2 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                              >
                                ↓
                              </button>
                              <button
                                type="button"
                                onClick={() => quitarParada(index)}
                                className="rounded border border-red-200 px-2 text-xs text-red-600 hover:bg-red-50"
                              >
                                Quitar
                              </button>
                            </li>
                          ))}
                        </ol>
                      )}

                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-slate-600 mb-1">Agregar parada</label>
                          <select
                            value={paradaSeleccionada}
                            onChange={(e) => setParadaSeleccionada(e.target.value)}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            <option value="">Seleccione destino...</option>
                            {parametros.map((parametro) => (
                              <option key={parametro.id} value={parametro.id}>{parametro.nombre}</option>
                            ))}
                          </select>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={agregarParada}
                          disabled={paradaSeleccionada === ''}
                        >
                          Agregar parada
                        </Button>
                      </div>

                      {recorridoError && (
                        <div className="mt-2 bg-red-50 text-red-600 border border-red-200 rounded-md px-3 py-2 text-sm">
                          {recorridoError}
                        </div>
                      )}

                      <div className="mt-3">
                        <Button
                          type="button"
                          onClick={guardarRecorrido}
                          disabled={paradas.length < 2 || loadingRecorrido}
                        >
                          {loadingRecorrido ? 'Guardando recorrido...' : 'Guardar recorrido'}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
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

          <Modal
            isOpen={isEditModalOpen}
            onClose={closeEditModal}
            title="Editar Unidad"
            footer={
              <>
                <Button variant="outline" onClick={closeEditModal}>Cancelar</Button>
                <Button type="submit" disabled={loading}>Guardar cambios</Button>
              </>
            }
            funcion={handleGuardarEdicion}
          >
            {unidadEnEdicion && (
              <div className="space-y-4">
                {editError && (
                  <div className="bg-red-50 text-red-600 border border-red-200 rounded-md px-3 py-2 text-sm">
                    {editError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Placa</label>
                    <input
                      name="placa"
                      type="text"
                      defaultValue={unidadEnEdicion.placa}
                      placeholder="Ej. ABC-123"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Código interno</label>
                    <input
                      name="codigoInterno"
                      type="text"
                      defaultValue={unidadEnEdicion.codigoInterno}
                      placeholder="Ej. UNI-001"
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
                      defaultValue={unidadEnEdicion.marca}
                      placeholder="Ej. Volvo"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Año</label>
                    <input
                      name="anio"
                      type="number"
                      defaultValue={unidadEnEdicion.anio}
                      placeholder="Ej. 2023"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Capacidad (TON)</label>
                    <input
                      name="capacidadTon"
                      type="number"
                      step="any"
                      min="0"
                      defaultValue={unidadEnEdicion.capacidadTon}
                      placeholder="Ej. 30"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Factor Emisión (kg CO2/km)</label>
                    <input
                      name="factorEmision"
                      type="number"
                      step="any"
                      min="0"
                      defaultValue={unidadEnEdicion.factorEmision}
                      placeholder="Ej. 0.41"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </Modal>
    </div>
  )
}
