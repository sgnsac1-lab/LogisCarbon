'use server'

import { prisma } from '../lib/prisma/prisma'
import { revalidatePath } from 'next/cache'
import { requireActiveUser, requireRole } from '@/lib/auth'

export async function ObtenerFlotilla() {
    const autorizacion = await requireActiveUser()
    if (!autorizacion.ok) {
        return { success: false, error: autorizacion.error }
    }

    try {
        const flotilla = await prisma.unidad.findMany({
            orderBy: {id: 'desc'},
            include: {
                viajes: {
                    where: { estado: { in: ['PLANIFICADO', 'EN_RUTA'] } },
                    orderBy: { id: 'desc' },
                    select: { id: true, codigo: true, estado: true },
                },
            },
        })
        const data = flotilla.map(({ viajes, ...unidad }) => ({
            ...unidad,
            viajeActivo: viajes[0] ?? null,
        }))
        return {success: true, data}
    } catch (error) {
        return { success: false, error:'Error al cargar la flotilla'}
    }
}

export async function ObtenerPedidosDisponiblesParaCarga() {
    const autorizacion = await requireActiveUser()
    if (!autorizacion.ok) {
        return { success: false, error: autorizacion.error }
    }

    try {
        const pedidos = await prisma.pedido.findMany({
            where: {
                estado: 'PENDIENTE',
                unidadId: null,
            },
            orderBy: { id: 'desc' },
            include: {
                cliente: true,
                origen: true,
                destino: true,
            }
        })
        return { success: true, data: pedidos }
    } catch {
        return { success: false, error: 'Error al cargar los pedidos disponibles.' }
    }
}

export async function CrearUnidad(formData: FormData) {
    const autorizacion = await requireRole('ADMIN', 'OPERACIONES')
    if (!autorizacion.ok) {
        return { error: autorizacion.error }
    }

    const placa = formData.get('placa') as string
    const marca = formData.get('marca') as string
    const anioRAW = formData.get('anio') as string
    const capacidadRAW = formData.get('capacidad') as string
    const factor_emisionRAW = formData.get('factor_emision') as string

    const anio = anioRAW ? parseInt(anioRAW) : null
    const capacidad = capacidadRAW ? parseFloat(capacidadRAW) : null
    const factor_emision = factor_emisionRAW ? parseFloat(factor_emisionRAW) : null

    if(!anio || !marca || !placa || !capacidad || !factor_emision){
        return {error: 'Todos los campos son obligatorios'}
    }

    try {
        const ultimaUnidad = await prisma.unidad.findFirst({
        orderBy: {
            id: 'desc',
        },
        select: {
            codigoInterno: true, 
        },
        })
        let siguienteNumero = 1
        if (ultimaUnidad && ultimaUnidad.codigoInterno) {
        const numeroActual = parseInt(ultimaUnidad.codigoInterno.split('-')[1])
        siguienteNumero = numeroActual + 1
        }
        const codigoGenerado = `TRK-${siguienteNumero.toString().padStart(3, '0')}`

        await prisma.unidad.create({
            data:{
               placa: placa,
               codigoInterno: codigoGenerado,
               marca: marca,
               anio: anio,
               capacidadTon: capacidad,
               factorEmision: factor_emision,
            }
        })
        revalidatePath('/flota')
        return {success: true}
    } catch (error:any) {
         return { error: "Ocurrió un error al guardar la unidad." }
    }
    
}

export interface ActualizarUnidadDatos {
  unidadId: number
  placa: string
  codigoInterno: string
  marca: string
  anio: number
  capacidadTon: number
  factorEmision: number
}

type ResultadoActualizarUnidad =
  | { ok: true; unidadId: number }
  | { ok: false; error: string }

export async function ActualizarUnidad(datos: ActualizarUnidadDatos) {
  const autorizacion = await requireRole('ADMIN', 'OPERACIONES')
  if (!autorizacion.ok) {
    return { success: false, error: autorizacion.error }
  }

  const unidadId = datos?.unidadId
  if (typeof unidadId !== 'number' || !Number.isInteger(unidadId) || unidadId <= 0) {
    return { success: false, error: 'La unidad seleccionada no es válida.' }
  }

  const placa = typeof datos?.placa === 'string' ? datos.placa.trim() : ''
  if (!placa) {
    return { success: false, error: 'La placa es obligatoria.' }
  }
  const codigoInterno = typeof datos?.codigoInterno === 'string' ? datos.codigoInterno.trim() : ''
  if (!codigoInterno) {
    return { success: false, error: 'El código interno es obligatorio.' }
  }
  const marca = typeof datos?.marca === 'string' ? datos.marca.trim() : ''
  if (!marca) {
    return { success: false, error: 'La marca es obligatoria.' }
  }
  const anio = datos?.anio
  if (typeof anio !== 'number' || !Number.isInteger(anio) || anio <= 0) {
    return { success: false, error: 'El año debe ser un entero válido.' }
  }
  const capacidadTon = datos?.capacidadTon
  if (typeof capacidadTon !== 'number' || !Number.isFinite(capacidadTon) || capacidadTon <= 0) {
    return { success: false, error: 'La capacidad debe ser mayor a 0.' }
  }
  const factorEmision = datos?.factorEmision
  if (typeof factorEmision !== 'number' || !Number.isFinite(factorEmision) || factorEmision <= 0) {
    return { success: false, error: 'El factor de emisión debe ser mayor a 0.' }
  }

  try {
    const resultado = await prisma.$transaction(async (tx): Promise<ResultadoActualizarUnidad> => {
      const unidad = await tx.unidad.findUnique({ where: { id: unidadId } })
      if (!unidad) {
        return { ok: false, error: 'La unidad no existe.' }
      }

      const viajeActivo = await tx.viaje.findFirst({
        where: { unidadId: unidadId, estado: { in: ['PLANIFICADO', 'EN_RUTA'] } },
        orderBy: { id: 'desc' },
        select: { estado: true, codigo: true },
      })
      if (viajeActivo?.estado === 'EN_RUTA') {
        return { ok: false, error: 'La unidad está en ruta y no puede editarse.' }
      }
      if (viajeActivo?.estado === 'PLANIFICADO') {
        return { ok: false, error: 'La unidad tiene un viaje planificado. Descarte el viaje antes de editarla.' }
      }

      if (unidad.estado === 'EN_RUTA') {
        return { ok: false, error: 'La unidad está en ruta y no puede editarse.' }
      }
      if (unidad.estado === 'MANTENIMIENTO') {
        return { ok: false, error: 'La unidad está en mantenimiento y no puede editarse en esta fase.' }
      }
      if (unidad.estado !== 'DISPONIBLE') {
        return { ok: false, error: 'Solo se puede editar una unidad disponible.' }
      }

      const conflicto = await tx.unidad.findFirst({
        where: {
          id: { not: unidadId },
          OR: [{ placa }, { codigoInterno }],
        },
        select: { placa: true, codigoInterno: true },
      })
      if (conflicto) {
        if (conflicto.placa === placa) {
          return { ok: false, error: 'Ya existe otra unidad con esa placa.' }
        }
        return { ok: false, error: 'Ya existe otra unidad con ese código interno.' }
      }

      const actualizado = await tx.unidad.updateMany({
        where: { id: unidadId, estado: 'DISPONIBLE' },
        data: {
          placa,
          codigoInterno,
          marca,
          anio,
          capacidadTon,
          factorEmision,
        },
      })
      if (actualizado.count !== 1) {
        throw new Error('La unidad cambió de estado durante la edición.')
      }

      return { ok: true, unidadId }
    })

    if (!resultado.ok) {
      return { success: false, error: resultado.error }
    }

    revalidatePath('/flota')

    return { success: true, data: { unidadId: resultado.unidadId } }
  } catch {
    return { success: false, error: 'Ocurrió un error al actualizar la unidad.' }
  }
}

export interface CambiarEstadoMantenimientoUnidadDatos {
  unidadId: number
  enMantenimiento: boolean
}

type ResultadoMantenimientoUnidad =
  | { ok: true; unidadId: number; estado: 'DISPONIBLE' | 'MANTENIMIENTO' }
  | { ok: false; error: string }

export async function CambiarEstadoMantenimientoUnidad(datos: CambiarEstadoMantenimientoUnidadDatos) {
  const autorizacion = await requireRole('ADMIN', 'OPERACIONES')
  if (!autorizacion.ok) {
    return { success: false, error: autorizacion.error }
  }

  const unidadId = datos?.unidadId
  if (typeof unidadId !== 'number' || !Number.isInteger(unidadId) || unidadId <= 0) {
    return { success: false, error: 'La unidad seleccionada no es válida.' }
  }
  const enMantenimiento = datos?.enMantenimiento
  if (typeof enMantenimiento !== 'boolean') {
    return { success: false, error: 'El estado de mantenimiento no es válido.' }
  }

  try {
    const resultado = await prisma.$transaction(async (tx): Promise<ResultadoMantenimientoUnidad> => {
      const unidad = await tx.unidad.findUnique({ where: { id: unidadId } })
      if (!unidad) {
        return { ok: false, error: 'La unidad no existe.' }
      }

      const viajeActivo = await tx.viaje.findFirst({
        where: { unidadId: unidadId, estado: { in: ['PLANIFICADO', 'EN_RUTA'] } },
        orderBy: { id: 'desc' },
        select: { estado: true, codigo: true },
      })

      if (enMantenimiento) {
        if (viajeActivo?.estado === 'EN_RUTA') {
          return { ok: false, error: 'La unidad está en ruta y no puede pasar a mantenimiento.' }
        }
        if (viajeActivo?.estado === 'PLANIFICADO') {
          return { ok: false, error: 'La unidad tiene un viaje planificado. Descarte el viaje antes de ponerla en mantenimiento.' }
        }
        if (unidad.estado !== 'DISPONIBLE') {
          return { ok: false, error: 'Solo una unidad disponible puede pasar a mantenimiento.' }
        }

        const actualizado = await tx.unidad.updateMany({
          where: { id: unidadId, estado: 'DISPONIBLE' },
          data: { estado: 'MANTENIMIENTO' },
        })
        if (actualizado.count !== 1) {
          throw new Error('La unidad cambió de estado durante la actualización.')
        }

        return { ok: true, unidadId, estado: 'MANTENIMIENTO' }
      }

      if (viajeActivo) {
        return { ok: false, error: 'La unidad tiene un viaje activo y no puede volver a disponible.' }
      }
      if (unidad.estado !== 'MANTENIMIENTO') {
        return { ok: false, error: 'Solo una unidad en mantenimiento puede volver a disponible.' }
      }

      const actualizado = await tx.unidad.updateMany({
        where: { id: unidadId, estado: 'MANTENIMIENTO' },
        data: { estado: 'DISPONIBLE' },
      })
      if (actualizado.count !== 1) {
        throw new Error('La unidad cambió de estado durante la actualización.')
      }

      return { ok: true, unidadId, estado: 'DISPONIBLE' }
    })

    if (!resultado.ok) {
      return { success: false, error: resultado.error }
    }

    revalidatePath('/flota')

    return { success: true, data: { unidadId: resultado.unidadId, estado: resultado.estado } }
  } catch {
    return { success: false, error: 'Ocurrió un error al cambiar el estado de la unidad.' }
  }
}

export async function asignarUnidadAPedido(formData: FormData) {
  const autorizacion = await requireRole('ADMIN', 'OPERACIONES')
  if (!autorizacion.ok) {
    return { success: false, error: autorizacion.error }
  }

  const unidadID_RAW = formData.get('unidad_id') as string
  const pedidoId_RAW = formData.get('pedido_id') as string
  const conductor = formData.get('conductor') as string

  const unidadID = parseInt(unidadID_RAW)
  const pedidoId = parseInt(pedidoId_RAW) 

  try {
    const viajeActivo = await prisma.viaje.findFirst({
      where: {
        unidadId: unidadID,
        estado: { in: ['PLANIFICADO', 'EN_RUTA'] },
      },
    })
    if (viajeActivo) {
      return { success: false, error: 'La unidad ya tiene un viaje planificado o en curso.' }
    }

    const resultado = await prisma.$transaction([
      
      prisma.pedido.update({
        where: { id: pedidoId },
        data: {
          unidadId: unidadID,
          estado: 'EN_TRANSITO',
        },
      }),

      // B. Actualizamos la Unidad
      prisma.unidad.update({
        where: { id: unidadID },
        data: {
          conductorActual: conductor,
          estado: 'EN_RUTA',
        },
      }),

    ]);
    revalidatePath('/flota');
    revalidatePath('/pedidos');

    return { success: true, data: resultado };

  } catch (error) {
    console.error("Error al asignar la unidad:", error);
    return { success: false, error: "Ocurrió un error al procesar la asignación." };
  }
}

export interface AsignarPedidosAViajeDatos {
  unidadId: number
  pedidoIds: number[]
  conductor: string
}

type ResultadoAsignacionViaje =
  | {
      ok: true
      viajeId: number
      codigoViaje: string
      cantidadPedidosAgregados: number
      pesoOcupadoKg: number
      capacidadKg: number
      pesoDisponibleKg: number
    }
  | {
      ok: false
      error: string
      capacidadKg?: number
      pesoOcupadoKg?: number
      pesoNuevoKg?: number
    }

export async function AsignarPedidosAViaje(datos: AsignarPedidosAViajeDatos) {
  const autorizacion = await requireRole('ADMIN', 'OPERACIONES')
  if (!autorizacion.ok) {
    return { success: false, error: autorizacion.error }
  }

  const unidadId = datos?.unidadId
  const pedidoIds = datos?.pedidoIds
  const conductorRaw = datos?.conductor

  if (typeof unidadId !== 'number' || !Number.isInteger(unidadId) || unidadId <= 0) {
    return { success: false, error: 'La unidad seleccionada no es válida.' }
  }
  if (!Array.isArray(pedidoIds) || pedidoIds.length === 0) {
    return { success: false, error: 'Selecciona al menos un pedido.' }
  }
  for (const pedidoId of pedidoIds) {
    if (typeof pedidoId !== 'number' || !Number.isInteger(pedidoId) || pedidoId <= 0) {
      return { success: false, error: 'Los pedidos seleccionados no son válidos.' }
    }
  }
  if (new Set(pedidoIds).size !== pedidoIds.length) {
    return { success: false, error: 'No se permiten pedidos duplicados en la asignación.' }
  }

  const conductor = typeof conductorRaw === 'string' ? conductorRaw.trim() : ''

  try {
    const resultado = await prisma.$transaction(async (tx): Promise<ResultadoAsignacionViaje> => {
      const unidad = await tx.unidad.findUnique({ where: { id: unidadId } })
      if (!unidad) {
        return { ok: false, error: 'La unidad seleccionada no existe.' }
      }
      if (unidad.estado === 'MANTENIMIENTO') {
        return { ok: false, error: 'La unidad se encuentra en mantenimiento.' }
      }
      if (unidad.estado === 'EN_RUTA') {
        return { ok: false, error: 'La unidad ya se encuentra en ruta.' }
      }
      if (!Number.isFinite(unidad.capacidadTon) || unidad.capacidadTon <= 0) {
        return { ok: false, error: 'La unidad no tiene una capacidad válida.' }
      }
      const capacidadKg = unidad.capacidadTon * 1000

      const viajesActivos = await tx.viaje.findMany({
        where: {
          unidadId: unidadId,
          estado: { in: ['PLANIFICADO', 'EN_RUTA'] },
        },
        include: {
          pedidos: { select: { pesoKg: true } },
          tramos: { select: { id: true } },
        },
      })

      if (viajesActivos.some((viaje) => viaje.estado === 'EN_RUTA')) {
        return { ok: false, error: 'La unidad ya tiene un viaje en curso.' }
      }

      const planificados = viajesActivos.filter((viaje) => viaje.estado === 'PLANIFICADO')
      if (planificados.length > 1) {
        return { ok: false, error: 'Existe más de un viaje planificado para esta unidad. Corrija la inconsistencia antes de continuar.' }
      }

      const viajePlanificado = planificados.length === 1 ? planificados[0] : null

      const pedidos = await tx.pedido.findMany({
        where: { id: { in: pedidoIds } },
      })
      if (pedidos.length !== pedidoIds.length) {
        return { ok: false, error: 'Uno o más pedidos seleccionados no existen.' }
      }

      for (const pedido of pedidos) {
        if (pedido.estado !== 'PENDIENTE' || pedido.viajeId !== null || pedido.unidadId !== null) {
          return { ok: false, error: `El pedido ${pedido.codigo} no está disponible para asignar.` }
        }
        const pesoKg = pedido.pesoKg
        const cantidadUnidades = pedido.cantidadUnidades
        if (
          pesoKg === null ||
          !Number.isFinite(pesoKg) ||
          pesoKg <= 0 ||
          cantidadUnidades === null ||
          !Number.isInteger(cantidadUnidades) ||
          cantidadUnidades <= 0 ||
          !pedido.destinatarioNombre ||
          !pedido.destinatarioNombre.trim() ||
          !pedido.destinatarioDireccion ||
          !pedido.destinatarioDireccion.trim()
        ) {
          return { ok: false, error: `Completar peso y datos de entrega del pedido ${pedido.codigo} antes de asignarlo.` }
        }
      }

      const pesoOcupadoKg = viajePlanificado
        ? viajePlanificado.pedidos.reduce((acc, pedido) => acc + (pedido.pesoKg ?? 0), 0)
        : 0
      const pesoNuevoKg = pedidos.reduce((acc, pedido) => acc + (pedido.pesoKg ?? 0), 0)

      if (pesoOcupadoKg + pesoNuevoKg > capacidadKg) {
        return {
          ok: false,
          error: 'La carga supera la capacidad de la unidad.',
          capacidadKg: capacidadKg,
          pesoOcupadoKg: pesoOcupadoKg,
          pesoNuevoKg: pesoNuevoKg,
        }
      }

      let viajeId: number
      let codigoViaje: string

      if (viajePlanificado) {
        if (viajePlanificado.conductor && conductor && viajePlanificado.conductor !== conductor) {
          return { ok: false, error: 'La unidad ya tiene un viaje planificado con otro conductor asignado.' }
        }
        viajeId = viajePlanificado.id
        codigoViaje = viajePlanificado.codigo
        if (!viajePlanificado.conductor && conductor) {
          await tx.viaje.update({
            where: { id: viajeId },
            data: { conductor: conductor },
          })
        }
        if (viajePlanificado.tramos.length > 0) {
          await tx.viajeTramo.deleteMany({ where: { viajeId: viajeId } })
          await tx.viaje.update({
            where: { id: viajeId },
            data: { distanciaTotal: null },
          })
        }
      } else {
        if (!conductor) {
          return { ok: false, error: 'El conductor es obligatorio para crear un viaje.' }
        }
        const ultimoViaje = await tx.viaje.findFirst({
          orderBy: { id: 'desc' },
          select: { codigo: true },
        })
        let siguienteNumero = 1
        if (ultimoViaje && ultimoViaje.codigo) {
          const numeroActual = parseInt(ultimoViaje.codigo.split('-')[1])
          if (Number.isInteger(numeroActual)) {
            siguienteNumero = numeroActual + 1
          }
        }
        const codigoGenerado = `VIA-${siguienteNumero.toString().padStart(3, '0')}`

        const nuevoViaje = await tx.viaje.create({
          data: {
            codigo: codigoGenerado,
            unidadId: unidadId,
            conductor: conductor,
            estado: 'PLANIFICADO',
            fechaInicio: null,
            fechaCierre: null,
            distanciaTotal: null,
            factorEmisionAplicado: null,
            co2Total: null,
          },
        })
        viajeId = nuevoViaje.id
        codigoViaje = nuevoViaje.codigo
      }

      const actualizacion = await tx.pedido.updateMany({
        where: {
          id: { in: pedidoIds },
          estado: 'PENDIENTE',
          viajeId: null,
          unidadId: null,
        },
        data: {
          viajeId: viajeId,
          unidadId: unidadId,
        },
      })
      if (actualizacion.count !== pedidoIds.length) {
        throw new Error('Uno o más pedidos cambiaron de estado durante la asignación.')
      }

      return {
        ok: true,
        viajeId: viajeId,
        codigoViaje: codigoViaje,
        cantidadPedidosAgregados: pedidos.length,
        pesoOcupadoKg: pesoOcupadoKg + pesoNuevoKg,
        capacidadKg: capacidadKg,
        pesoDisponibleKg: capacidadKg - (pesoOcupadoKg + pesoNuevoKg),
      }
    })

    if (!resultado.ok) {
      if (resultado.capacidadKg !== undefined) {
        return {
          success: false,
          error: resultado.error,
          data: {
            capacidadKg: resultado.capacidadKg,
            pesoOcupadoKg: resultado.pesoOcupadoKg,
            pesoNuevoKg: resultado.pesoNuevoKg,
          },
        }
      }
      return { success: false, error: resultado.error }
    }

    revalidatePath('/flota')
    revalidatePath('/pedidos')

    return {
      success: true,
      data: {
        viajeId: resultado.viajeId,
        codigoViaje: resultado.codigoViaje,
        cantidadPedidosAgregados: resultado.cantidadPedidosAgregados,
        pesoOcupadoKg: resultado.pesoOcupadoKg,
        capacidadKg: resultado.capacidadKg,
        pesoDisponibleKg: resultado.pesoDisponibleKg,
      },
    }
  } catch {
    return { success: false, error: 'Ocurrió un error al asignar los pedidos al viaje.' }
  }
}

export async function ObtenerViajePlanificadoPorUnidad(unidadId: number) {
  const autorizacion = await requireActiveUser()
  if (!autorizacion.ok) {
    return { success: false, error: autorizacion.error }
  }

  try {
    if (typeof unidadId !== 'number' || !Number.isInteger(unidadId) || unidadId <= 0) {
      return { success: false, error: 'La unidad seleccionada no es válida.' }
    }

    const viaje = await prisma.viaje.findFirst({
      where: {
        unidadId: unidadId,
        estado: 'PLANIFICADO',
      },
      orderBy: { id: 'desc' },
      include: {
        unidad: true,
        pedidos: {
          include: {
            cliente: true,
            origen: true,
            destino: true,
          },
        },
        tramos: {
          orderBy: { orden: 'asc' },
          include: {
            origen: true,
            destino: true,
          },
        },
      },
    })

    if (!viaje) {
      return { success: true, data: null }
    }

    const capacidadKg = viaje.unidad.capacidadTon * 1000
    const pesoOcupadoKg = viaje.pedidos.reduce((acc, pedido) => acc + (pedido.pesoKg ?? 0), 0)

    return {
      success: true,
      data: {
        viaje: viaje,
        capacidadKg: capacidadKg,
        pesoOcupadoKg: pesoOcupadoKg,
        pesoDisponibleKg: capacidadKg - pesoOcupadoKg,
        distanciaTotal: viaje.distanciaTotal,
      },
    }
  } catch {
    return { success: false, error: 'Error al obtener el viaje planificado de la unidad.' }
  }
}

export interface ConfigurarRecorridoViajeDatos {
  viajeId: number
  paradaIds: number[]
}

interface TramoCalculado {
  orden: number
  origenId: number
  destinoId: number
  distanciaKm: number
}

type ResultadoConfigurarRecorrido =
  | {
      ok: true
      distanciaTotal: number
      cantidadTramos: number
    }
  | {
      ok: false
      error: string
    }

export async function ConfigurarRecorridoViaje(datos: ConfigurarRecorridoViajeDatos) {
  const autorizacion = await requireRole('ADMIN', 'OPERACIONES')
  if (!autorizacion.ok) {
    return { success: false, error: autorizacion.error }
  }

  const viajeId = datos?.viajeId
  const paradaIds = datos?.paradaIds

  if (typeof viajeId !== 'number' || !Number.isInteger(viajeId) || viajeId <= 0) {
    return { success: false, error: 'El viaje seleccionado no es válido.' }
  }
  if (!Array.isArray(paradaIds)) {
    return { success: false, error: 'Las paradas del recorrido no son válidas.' }
  }
  if (paradaIds.length < 2) {
    return { success: false, error: 'El recorrido debe tener al menos dos paradas.' }
  }
  for (const paradaId of paradaIds) {
    if (typeof paradaId !== 'number' || !Number.isInteger(paradaId) || paradaId <= 0) {
      return { success: false, error: 'Las paradas del recorrido no son válidas.' }
    }
  }
  for (let i = 1; i < paradaIds.length; i++) {
    if (paradaIds[i] === paradaIds[i - 1]) {
      return { success: false, error: 'El recorrido no puede tener paradas consecutivas iguales.' }
    }
  }

  const paradaIdsUnicas = Array.from(new Set(paradaIds))

  try {
    const resultado = await prisma.$transaction(async (tx): Promise<ResultadoConfigurarRecorrido> => {
      const viaje = await tx.viaje.findUnique({
        where: { id: viajeId },
        include: {
          unidad: { select: { id: true } },
          pedidos: true,
        },
      })
      if (!viaje) {
        return { ok: false, error: 'El viaje no existe.' }
      }
      if (viaje.estado !== 'PLANIFICADO') {
        return { ok: false, error: 'Solo se puede configurar el recorrido de un viaje planificado.' }
      }
      if (!viaje.unidad || typeof viaje.unidadId !== 'number' || viaje.unidadId <= 0) {
        return { ok: false, error: 'El viaje no tiene una unidad asociada.' }
      }
      if (viaje.pedidos.length === 0) {
        return { ok: false, error: 'El viaje debe tener al menos un pedido asignado.' }
      }

      const paradas = await tx.parametro.findMany({
        where: { id: { in: paradaIdsUnicas } },
      })
      if (paradas.length !== paradaIdsUnicas.length) {
        return { ok: false, error: 'Una o más paradas no existen.' }
      }
      const paradasMap = new Map(paradas.map((parada) => [parada.id, parada]))
      for (const paradaId of paradaIdsUnicas) {
        const parada = paradasMap.get(paradaId)
        if (!parada || !parada.activo || parada.tipo !== 'DESTINO') {
          return { ok: false, error: 'Una o más paradas no son destinos activos válidos.' }
        }
      }

      for (const pedido of viaje.pedidos) {
        const origenIndex = paradaIds.indexOf(pedido.origenId)
        if (origenIndex === -1) {
          return { ok: false, error: `El recorrido no cubre correctamente el pedido ${pedido.codigo}.` }
        }
        let cubierto = false
        for (let i = origenIndex + 1; i < paradaIds.length; i++) {
          if (paradaIds[i] === pedido.destinoId) {
            cubierto = true
            break
          }
        }
        if (!cubierto) {
          return { ok: false, error: `El recorrido no cubre correctamente el pedido ${pedido.codigo}.` }
        }
      }

      const tramos: TramoCalculado[] = []
      for (let i = 0; i < paradaIds.length - 1; i++) {
        const origenId = paradaIds[i]
        const destinoId = paradaIds[i + 1]
        const ruta = await tx.ruta.findFirst({
          where: { origenId, destinoId, activo: true },
        })
        const origenNombre = paradasMap.get(origenId)?.nombre ?? String(origenId)
        const destinoNombre = paradasMap.get(destinoId)?.nombre ?? String(destinoId)
        if (!ruta) {
          return { ok: false, error: `No existe una ruta activa entre ${origenNombre} y ${destinoNombre}.` }
        }
        if (!Number.isFinite(ruta.distanciaKm) || ruta.distanciaKm <= 0) {
          return { ok: false, error: `La ruta entre ${origenNombre} y ${destinoNombre} no tiene una distancia válida.` }
        }
        tramos.push({
          orden: i + 1,
          origenId: origenId,
          destinoId: destinoId,
          distanciaKm: ruta.distanciaKm,
        })
      }

      const distanciaTotal = tramos.reduce((acc, tramo) => acc + tramo.distanciaKm, 0)
      if (!Number.isFinite(distanciaTotal) || distanciaTotal <= 0) {
        return { ok: false, error: 'No se pudo calcular una distancia total válida para el recorrido.' }
      }

      await tx.viajeTramo.deleteMany({ where: { viajeId: viajeId } })
      await tx.viajeTramo.createMany({
        data: tramos.map((tramo) => ({
          viajeId: viajeId,
          orden: tramo.orden,
          origenId: tramo.origenId,
          destinoId: tramo.destinoId,
          distanciaKm: tramo.distanciaKm,
        })),
      })
      await tx.viaje.update({
        where: { id: viajeId },
        data: { distanciaTotal: distanciaTotal },
      })

      return {
        ok: true,
        distanciaTotal: distanciaTotal,
        cantidadTramos: tramos.length,
      }
    })

    if (!resultado.ok) {
      return { success: false, error: resultado.error }
    }

    revalidatePath('/flota')

    return {
      success: true,
      data: {
        distanciaTotal: resultado.distanciaTotal,
        cantidadTramos: resultado.cantidadTramos,
      },
    }
  } catch {
    return { success: false, error: 'Ocurrió un error al configurar el recorrido del viaje.' }
  }
}

export interface IniciarViajeDatos {
  viajeId: number
}

type ResultadoIniciarViaje =
  | {
      ok: true
      viajeId: number
      codigoViaje: string
      conductor: string
      cantidadPedidos: number
      distanciaTotal: number
      factorEmisionAplicado: number
      co2Total: number
    }
  | {
      ok: false
      error: string
    }

export async function IniciarViaje(datos: IniciarViajeDatos) {
  const autorizacion = await requireRole('ADMIN', 'OPERACIONES')
  if (!autorizacion.ok) {
    return { success: false, error: autorizacion.error }
  }

  const viajeId = datos?.viajeId

  if (typeof viajeId !== 'number' || !Number.isInteger(viajeId) || viajeId <= 0) {
    return { success: false, error: 'El viaje seleccionado no es válido.' }
  }

  try {
    const resultado = await prisma.$transaction(async (tx): Promise<ResultadoIniciarViaje> => {
      const viaje = await tx.viaje.findUnique({
        where: { id: viajeId },
        include: {
          unidad: true,
          pedidos: true,
          tramos: { select: { id: true } },
        },
      })
      if (!viaje) {
        return { ok: false, error: 'El viaje no existe.' }
      }
      if (viaje.estado !== 'PLANIFICADO') {
        return { ok: false, error: 'Solo se puede iniciar un viaje planificado.' }
      }
      if (!viaje.unidad) {
        return { ok: false, error: 'El viaje no tiene una unidad asociada.' }
      }
      const unidad = viaje.unidad
      if (unidad.estado !== 'DISPONIBLE') {
        return { ok: false, error: 'La unidad no está disponible para iniciar el viaje.' }
      }
      const conductor = typeof viaje.conductor === 'string' ? viaje.conductor.trim() : ''
      if (!conductor) {
        return { ok: false, error: 'El viaje no tiene un conductor asignado.' }
      }
      if (viaje.pedidos.length === 0) {
        return { ok: false, error: 'El viaje debe tener al menos un pedido.' }
      }
      if (viaje.tramos.length === 0) {
        return { ok: false, error: 'El viaje debe tener un recorrido configurado.' }
      }
      const distanciaTotal = viaje.distanciaTotal
      if (distanciaTotal === null || !Number.isFinite(distanciaTotal) || distanciaTotal <= 0) {
        return { ok: false, error: 'El viaje no tiene una distancia total válida.' }
      }
      if (!Number.isFinite(unidad.factorEmision) || unidad.factorEmision <= 0) {
        return { ok: false, error: 'La unidad no tiene un factor de emisión válido.' }
      }

      const co2Total = distanciaTotal * unidad.factorEmision
      if (!Number.isFinite(co2Total) || co2Total <= 0) {
        return { ok: false, error: 'No se pudo calcular un CO2 total válido para el viaje.' }
      }

      for (const pedido of viaje.pedidos) {
        if (pedido.viajeId !== viaje.id) {
          return { ok: false, error: `El pedido ${pedido.codigo} no pertenece a este viaje.` }
        }
        if (pedido.unidadId !== unidad.id) {
          return { ok: false, error: `El pedido ${pedido.codigo} no está asignado a la unidad del viaje.` }
        }
        if (pedido.estado !== 'PENDIENTE') {
          return { ok: false, error: `El pedido ${pedido.codigo} no está pendiente.` }
        }
      }

      const ahora = new Date()

      const viajeActualizado = await tx.viaje.updateMany({
        where: { id: viaje.id, estado: 'PLANIFICADO' },
        data: {
          estado: 'EN_RUTA',
          fechaInicio: ahora,
          factorEmisionAplicado: unidad.factorEmision,
          co2Total: co2Total,
        },
      })
      if (viajeActualizado.count !== 1) {
        throw new Error('El viaje cambió de estado durante el inicio.')
      }

      const unidadActualizada = await tx.unidad.updateMany({
        where: { id: unidad.id, estado: 'DISPONIBLE' },
        data: {
          estado: 'EN_RUTA',
          conductorActual: conductor,
        },
      })
      if (unidadActualizada.count !== 1) {
        throw new Error('La unidad cambió de estado durante el inicio.')
      }

      const pedidosActualizados = await tx.pedido.updateMany({
        where: { viajeId: viaje.id, estado: 'PENDIENTE' },
        data: { estado: 'EN_TRANSITO' },
      })
      if (pedidosActualizados.count !== viaje.pedidos.length) {
        throw new Error('No se pudieron actualizar todos los pedidos del viaje.')
      }

      return {
        ok: true,
        viajeId: viaje.id,
        codigoViaje: viaje.codigo,
        conductor: conductor,
        cantidadPedidos: viaje.pedidos.length,
        distanciaTotal: distanciaTotal,
        factorEmisionAplicado: unidad.factorEmision,
        co2Total: co2Total,
      }
    })

    if (!resultado.ok) {
      return { success: false, error: resultado.error }
    }

    revalidatePath('/flota')
    revalidatePath('/pedidos')

    return {
      success: true,
      data: {
        viajeId: resultado.viajeId,
        codigoViaje: resultado.codigoViaje,
        conductor: resultado.conductor,
        cantidadPedidos: resultado.cantidadPedidos,
        distanciaTotal: resultado.distanciaTotal,
        factorEmisionAplicado: resultado.factorEmisionAplicado,
        co2Total: resultado.co2Total,
      },
    }
  } catch {
    return { success: false, error: 'Ocurrió un error al iniciar el viaje.' }
  }
}

export interface DesasignarPedidoDeViajeDatos {
  viajeId: number
  pedidoId: number
}

type ResultadoDesasignarPedido =
  | {
      ok: true
      pedidoId: number
      viajeId: number
      pedidosRestantes: number
      viajeEliminado: boolean
    }
  | {
      ok: false
      error: string
    }

export async function DesasignarPedidoDeViaje(datos: DesasignarPedidoDeViajeDatos) {
  const autorizacion = await requireRole('ADMIN', 'OPERACIONES')
  if (!autorizacion.ok) {
    return { success: false, error: autorizacion.error }
  }

  const viajeId = datos?.viajeId
  const pedidoId = datos?.pedidoId

  if (typeof viajeId !== 'number' || !Number.isInteger(viajeId) || viajeId <= 0) {
    return { success: false, error: 'El viaje seleccionado no es válido.' }
  }
  if (typeof pedidoId !== 'number' || !Number.isInteger(pedidoId) || pedidoId <= 0) {
    return { success: false, error: 'El pedido seleccionado no es válido.' }
  }

  try {
    const resultado = await prisma.$transaction(async (tx): Promise<ResultadoDesasignarPedido> => {
      const viaje = await tx.viaje.findUnique({ where: { id: viajeId } })
      if (!viaje) {
        return { ok: false, error: 'El viaje no existe.' }
      }
      if (viaje.estado === 'EN_RUTA') {
        return { ok: false, error: 'No se pueden quitar pedidos de un viaje en ruta.' }
      }
      if (viaje.estado === 'CERRADO') {
        return { ok: false, error: 'No se pueden quitar pedidos de un viaje cerrado.' }
      }
      if (viaje.estado !== 'PLANIFICADO') {
        return { ok: false, error: 'Solo se pueden quitar pedidos de un viaje planificado.' }
      }

      const pedido = await tx.pedido.findUnique({ where: { id: pedidoId } })
      if (!pedido) {
        return { ok: false, error: 'El pedido no existe.' }
      }
      if (pedido.viajeId !== viaje.id) {
        return { ok: false, error: 'El pedido no pertenece a este viaje.' }
      }
      if (pedido.unidadId !== viaje.unidadId) {
        return { ok: false, error: 'El pedido no está asignado a la unidad del viaje.' }
      }
      if (pedido.estado !== 'PENDIENTE') {
        return { ok: false, error: `El pedido ${pedido.codigo} no está pendiente y no puede desasignarse.` }
      }

      const actualizado = await tx.pedido.updateMany({
        where: {
          id: pedido.id,
          viajeId: viaje.id,
          unidadId: viaje.unidadId,
          estado: 'PENDIENTE',
        },
        data: {
          viajeId: null,
          unidadId: null,
        },
      })
      if (actualizado.count !== 1) {
        throw new Error('El pedido cambió de estado durante la desasignación.')
      }

      const pedidosRestantes = await tx.pedido.count({ where: { viajeId: viaje.id } })

      let viajeEliminado = false
      if (pedidosRestantes === 0) {
        // Si era el último pedido, se elimina el viaje planificado vacío.
        // ViajeTramo se elimina por onDelete: Cascade. La Unidad no se toca.
        await tx.viaje.delete({ where: { id: viaje.id } })
        viajeEliminado = true
      } else {
        // El recorrido debe volver a confirmarse tras cualquier cambio de carga.
        await tx.viajeTramo.deleteMany({ where: { viajeId: viaje.id } })
        await tx.viaje.update({
          where: { id: viaje.id },
          data: { distanciaTotal: null },
        })
      }

      return {
        ok: true,
        pedidoId: pedido.id,
        viajeId: viaje.id,
        pedidosRestantes,
        viajeEliminado,
      }
    })

    if (!resultado.ok) {
      return { success: false, error: resultado.error }
    }

    revalidatePath('/flota')
    revalidatePath('/pedidos')

    return {
      success: true,
      data: {
        pedidoId: resultado.pedidoId,
        viajeId: resultado.viajeId,
        pedidosRestantes: resultado.pedidosRestantes,
        viajeEliminado: resultado.viajeEliminado,
      },
    }
  } catch {
    return { success: false, error: 'Ocurrió un error al quitar el pedido del viaje.' }
  }
}

export interface DescartarViajePlanificadoDatos {
  viajeId: number
}

type ResultadoDescartarViaje =
  | {
      ok: true
      viajeId: number
      cantidadPedidosLiberados: number
    }
  | {
      ok: false
      error: string
    }

export async function DescartarViajePlanificado(datos: DescartarViajePlanificadoDatos) {
  const autorizacion = await requireRole('ADMIN', 'OPERACIONES')
  if (!autorizacion.ok) {
    return { success: false, error: autorizacion.error }
  }

  const viajeId = datos?.viajeId

  if (typeof viajeId !== 'number' || !Number.isInteger(viajeId) || viajeId <= 0) {
    return { success: false, error: 'El viaje seleccionado no es válido.' }
  }

  try {
    const resultado = await prisma.$transaction(async (tx): Promise<ResultadoDescartarViaje> => {
      const viaje = await tx.viaje.findUnique({
        where: { id: viajeId },
        include: {
          unidad: true,
          pedidos: true,
        },
      })
      if (!viaje) {
        return { ok: false, error: 'El viaje no existe.' }
      }
      if (viaje.estado === 'EN_RUTA') {
        return { ok: false, error: 'No se puede descartar un viaje en ruta.' }
      }
      if (viaje.estado === 'CERRADO') {
        return { ok: false, error: 'No se puede descartar un viaje cerrado.' }
      }
      if (viaje.estado !== 'PLANIFICADO') {
        return { ok: false, error: 'Solo se puede descartar un viaje planificado.' }
      }
      if (!viaje.unidad) {
        return { ok: false, error: 'El viaje no tiene una unidad asociada.' }
      }
      if (viaje.unidad.estado !== 'DISPONIBLE') {
        return { ok: false, error: 'La unidad del viaje no está disponible. Corrija la inconsistencia antes de descartar.' }
      }

      // Validar TODOS los pedidos antes de liberar; sin desasignación parcial.
      for (const pedido of viaje.pedidos) {
        if (pedido.viajeId !== viaje.id) {
          return { ok: false, error: `El pedido ${pedido.codigo} no pertenece a este viaje.` }
        }
        if (pedido.unidadId !== viaje.unidadId) {
          return { ok: false, error: `El pedido ${pedido.codigo} no está asignado a la unidad del viaje.` }
        }
        if (pedido.estado !== 'PENDIENTE') {
          return { ok: false, error: `El pedido ${pedido.codigo} no está pendiente. No se puede descartar el viaje.` }
        }
      }

      const liberados = await tx.pedido.updateMany({
        where: {
          viajeId: viaje.id,
          unidadId: viaje.unidadId,
          estado: 'PENDIENTE',
        },
        data: {
          viajeId: null,
          unidadId: null,
        },
      })
      if (liberados.count !== viaje.pedidos.length) {
        throw new Error('No se pudieron liberar todos los pedidos del viaje.')
      }

      // ViajeTramo se elimina por onDelete: Cascade. La Unidad no se toca.
      await tx.viaje.delete({ where: { id: viaje.id } })

      return {
        ok: true,
        viajeId: viaje.id,
        cantidadPedidosLiberados: liberados.count,
      }
    })

    if (!resultado.ok) {
      return { success: false, error: resultado.error }
    }

    revalidatePath('/flota')
    revalidatePath('/pedidos')

    return {
      success: true,
      data: {
        viajeId: resultado.viajeId,
        cantidadPedidosLiberados: resultado.cantidadPedidosLiberados,
      },
    }
  } catch {
    return { success: false, error: 'Ocurrió un error al descartar el viaje planificado.' }
  }
}