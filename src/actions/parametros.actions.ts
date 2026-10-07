'use server'

import { prisma } from '../lib/prisma/prisma'
import { revalidatePath } from 'next/cache'
import { TipoCatalogo } from '@/types'
import { requireActiveUser, requireRole } from '@/lib/auth'

export async function ObtenerParametros() {
    const autorizacion = await requireActiveUser()
    if (!autorizacion.ok) {
        return { success: false, error: autorizacion.error }
    }

    try {
        const parametros = await prisma.parametro.findMany({
            orderBy: {id: 'desc'}
        })
        return {success: true, data: parametros}
    } catch (error) {
        return { success: false, error:'Error al cargar el listado de parametros'}
    }
    
}

export async function CrearParametros(formData: FormData) {
    const autorizacion = await requireRole('ADMIN')
    if (!autorizacion.ok) {
        return { error: autorizacion.error }
    }

    const nombre = formData.get('nombre') as string
    const tipo = formData.get('tipo') as TipoCatalogo
    const activo = formData.get('activo') === 'on'

    if(!nombre || !tipo){
        return {error: 'Todos los campos son obligatorios'}
    }

    try {
        await prisma.parametro.create({
            data:{
                nombre: nombre,
                tipo: tipo,
                activo: activo
            }
        })
        revalidatePath('/admin')
        return {success: true}
    } catch (error:any) {
         return { error: "Ocurrió un error al guardar el material." }
    }
    
}

export interface DatosRuta {
    origenId: number
    destinoId: number
    distanciaKm: number
}

export interface DatosActualizarRuta {
    id: number
    distanciaKm?: number
    activo?: boolean
}

export async function ObtenerRutas() {
    const autorizacion = await requireActiveUser()
    if (!autorizacion.ok) {
        return { success: false, error: autorizacion.error }
    }

    try {
        const rutas = await prisma.ruta.findMany({
            orderBy: [
                { origen: { nombre: 'asc' } },
                { destino: { nombre: 'asc' } },
            ],
            include: {
                origen: { select: { id: true, nombre: true, tipo: true, activo: true } },
                destino: { select: { id: true, nombre: true, tipo: true, activo: true } },
            }
        })
        return {success: true, data: rutas}
    } catch {
        return { success: false, error:'Error al cargar el listado de rutas'}
    }
    
}

export async function CrearRuta(datosRuta: DatosRuta) {
    const autorizacion = await requireRole('ADMIN')
    if (!autorizacion.ok) {
        return { error: autorizacion.error }
    }

    const origenId = datosRuta?.origenId
    const destinoId = datosRuta?.destinoId
    const distanciaKm = datosRuta?.distanciaKm

    if (typeof origenId !== 'number' || !Number.isInteger(origenId)) {
        return { error: 'El origen seleccionado no es válido.' }
    }
    if (typeof destinoId !== 'number' || !Number.isInteger(destinoId)) {
        return { error: 'El destino seleccionado no es válido.' }
    }
    if (origenId === destinoId) {
        return { error: 'El origen y el destino deben ser diferentes.' }
    }
    if (typeof distanciaKm !== 'number' || !Number.isFinite(distanciaKm) || distanciaKm <= 0) {
        return { error: 'La distancia debe ser mayor a 0.' }
    }

    try {
        const [origen, destino] = await Promise.all([
            prisma.parametro.findUnique({ where: { id: origenId } }),
            prisma.parametro.findUnique({ where: { id: destinoId } }),
        ])
        if (!origen || !origen.activo || origen.tipo !== 'DESTINO') {
            return { error: 'El origen seleccionado no es válido.' }
        }
        if (!destino || !destino.activo || destino.tipo !== 'DESTINO') {
            return { error: 'El destino seleccionado no es válido.' }
        }

        const rutaExistente = await prisma.ruta.findUnique({
            where: { origenId_destinoId: { origenId, destinoId } },
        })
        if (rutaExistente) {
            return { error: 'Ya existe una ruta registrada entre este origen y destino.' }
        }

        await prisma.ruta.create({
            data: {
                origenId: origenId,
                destinoId: destinoId,
                distanciaKm: distanciaKm,
                activo: true,
            }
        })
        revalidatePath('/admin')
        return {success: true}
    } catch {
         return { error: "Ocurrió un error al guardar la ruta." }
    }
    
}

export async function ActualizarRuta(datosRuta: DatosActualizarRuta) {
    const autorizacion = await requireRole('ADMIN')
    if (!autorizacion.ok) {
        return { error: autorizacion.error }
    }

    const id = datosRuta?.id
    if (typeof id !== 'number' || !Number.isInteger(id)) {
        return { error: 'La ruta no existe.' }
    }

    const data: { distanciaKm?: number; activo?: boolean } = {}

    const distanciaKm = datosRuta.distanciaKm
    if (distanciaKm !== undefined) {
        if (typeof distanciaKm !== 'number' || !Number.isFinite(distanciaKm) || distanciaKm <= 0) {
            return { error: 'La distancia debe ser mayor a 0.' }
        }
        data.distanciaKm = distanciaKm
    }

    const activo = datosRuta.activo
    if (activo !== undefined) {
        if (typeof activo !== 'boolean') {
            return { error: 'El estado activo debe ser verdadero o falso.' }
        }
        data.activo = activo
    }

    if (data.distanciaKm === undefined && data.activo === undefined) {
        return { error: 'No hay cambios para actualizar.' }
    }

    try {
        const ruta = await prisma.ruta.findUnique({ where: { id } })
        if (!ruta) {
            return { error: 'La ruta no existe.' }
        }

        await prisma.ruta.update({
            where: { id },
            data: data,
        })
        revalidatePath('/admin')
        return {success: true}
    } catch {
         return { error: "Ocurrió un error al actualizar la ruta." }
    }
    
}

export async function ObtenerRutaPorOrigenDestino(origenId: number, destinoId: number) {
    const autorizacion = await requireActiveUser()
    if (!autorizacion.ok) {
        return null
    }

    try {
        const ruta = await prisma.ruta.findFirst({
            where: {
                origenId: origenId,
                destinoId: destinoId,
                activo: true,
            }
        })
        return ruta
    } catch {
        return null
    }
    
}

export interface DatosActualizarParametroDestino {
    parametroId: number
    nombre: string
}

export async function ActualizarParametroDestino(datos: DatosActualizarParametroDestino) {
    const autorizacion = await requireRole('ADMIN')
    if (!autorizacion.ok) {
        return { error: autorizacion.error }
    }

    const parametroId = datos?.parametroId
    if (typeof parametroId !== 'number' || !Number.isInteger(parametroId) || parametroId <= 0) {
        return { error: 'El destino seleccionado no es válido.' }
    }

    const nombre = typeof datos?.nombre === 'string' ? datos.nombre.trim() : ''
    if (!nombre) {
        return { error: 'El nombre del destino es obligatorio.' }
    }

    try {
        const resultado = await prisma.$transaction(async (tx) => {
            const parametro = await tx.parametro.findUnique({ where: { id: parametroId } })
            if (!parametro) {
                return { ok: false as const, error: 'El destino no existe.' }
            }
            if (parametro.tipo !== 'DESTINO') {
                return { ok: false as const, error: 'Solo se pueden editar parámetros de tipo DESTINO.' }
            }

            const pedidoPendiente = await tx.pedido.findFirst({
                where: {
                    estado: 'PENDIENTE',
                    OR: [{ origenId: parametroId }, { destinoId: parametroId }],
                },
                select: { id: true },
            })
            if (pedidoPendiente) {
                return { ok: false as const, error: 'El destino participa en pedidos pendientes. No se puede editar mientras esté en uso.' }
            }

            const tramoActivo = await tx.viajeTramo.findFirst({
                where: {
                    OR: [{ origenId: parametroId }, { destinoId: parametroId }],
                    viaje: { estado: { in: ['PLANIFICADO', 'EN_RUTA'] } },
                },
                select: { id: true },
            })
            if (tramoActivo) {
                return { ok: false as const, error: 'El destino participa en un viaje activo. No se puede editar mientras esté en uso.' }
            }

            await tx.parametro.update({
                where: { id: parametroId },
                data: { nombre },
            })

            return { ok: true as const, parametroId }
        })

        if (!resultado.ok) {
            return { error: resultado.error }
        }

        revalidatePath('/admin')
        return { success: true, data: { parametroId: resultado.parametroId } }
    } catch {
        return { error: 'Ocurrió un error al actualizar el destino.' }
    }
}

export interface DatosCambiarEstadoParametroDestino {
    parametroId: number
    activo: boolean
}

export async function CambiarEstadoParametroDestino(datos: DatosCambiarEstadoParametroDestino) {
    const autorizacion = await requireRole('ADMIN')
    if (!autorizacion.ok) {
        return { error: autorizacion.error }
    }

    const parametroId = datos?.parametroId
    if (typeof parametroId !== 'number' || !Number.isInteger(parametroId) || parametroId <= 0) {
        return { error: 'El destino seleccionado no es válido.' }
    }

    const activo = datos?.activo
    if (typeof activo !== 'boolean') {
        return { error: 'El estado del destino no es válido.' }
    }

    try {
        const resultado = await prisma.$transaction(async (tx) => {
            const parametro = await tx.parametro.findUnique({ where: { id: parametroId } })
            if (!parametro) {
                return { ok: false as const, error: 'El destino no existe.' }
            }
            if (parametro.tipo !== 'DESTINO') {
                return { ok: false as const, error: 'Solo se puede cambiar el estado de parámetros de tipo DESTINO.' }
            }

            if (!activo) {
                if (!parametro.activo) {
                    return { ok: false as const, error: 'El destino ya está inactivo.' }
                }

                const rutaActiva = await tx.ruta.findFirst({
                    where: {
                        activo: true,
                        OR: [{ origenId: parametroId }, { destinoId: parametroId }],
                    },
                    select: { id: true },
                })
                if (rutaActiva) {
                    return { ok: false as const, error: 'El destino tiene rutas activas. Desactive primero las rutas asociadas.' }
                }

                const pedidoPendiente = await tx.pedido.findFirst({
                    where: {
                        estado: 'PENDIENTE',
                        OR: [{ origenId: parametroId }, { destinoId: parametroId }],
                    },
                    select: { id: true },
                })
                if (pedidoPendiente) {
                    return { ok: false as const, error: 'El destino participa en pedidos pendientes. No se puede desactivar mientras esté en uso.' }
                }

                const tramoActivo = await tx.viajeTramo.findFirst({
                    where: {
                        OR: [{ origenId: parametroId }, { destinoId: parametroId }],
                        viaje: { estado: { in: ['PLANIFICADO', 'EN_RUTA'] } },
                    },
                    select: { id: true },
                })
                if (tramoActivo) {
                    return { ok: false as const, error: 'El destino participa en un viaje activo. No se puede desactivar mientras esté en uso.' }
                }
            }

            await tx.parametro.update({
                where: { id: parametroId },
                data: { activo },
            })

            return { ok: true as const, parametroId, activo }
        })

        if (!resultado.ok) {
            return { error: resultado.error }
        }

        revalidatePath('/admin')
        return { success: true, data: { parametroId: resultado.parametroId, activo: resultado.activo } }
    } catch {
        return { error: 'Ocurrió un error al cambiar el estado del destino.' }
    }
}