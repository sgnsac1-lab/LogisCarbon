'use server'

import { prisma } from '../lib/prisma/prisma'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth'

export async function ObtenerIncidencias(id:number){
    try {
        const Incidencias = await prisma.incidencia.findMany({
            where: {pedidoId: id},
            orderBy: {fechaHora: 'asc'}
        })
        return {success: true, data: Incidencias}
    } catch (error) {
        return { success: false, error:'Error al cargar las incidencias'}
    }
}

export async function CrearIncidencias(formData: FormData) {
    const autorizacion = await requireRole('ADMIN', 'OPERACIONES')
    if (!autorizacion.ok) {
        return { error: autorizacion.error }
    }

    const pedido_idRAW = formData.get('pedido_id') as string
    const tipo_evento = formData.get('tipo_evento') as string
    const ubicacion = formData.get('ubicacion') as string
    const detalle = formData.get('detalle') as string

    const pedido_id = pedido_idRAW ? parseInt(pedido_idRAW) : null

    if(!pedido_id || !tipo_evento || !detalle){
        return {error: 'Todos los campos son obligatorios'}
    }

    try {
        await prisma.incidencia.create({
            data:{
               pedido: { connect: {id: pedido_id}},
               tipoEvento: tipo_evento,
               ubicacion: ubicacion,
               detalle: detalle
            }
        })
        revalidatePath(`/pedidos/trazabilidad/${pedido_id}`)
        return {success: true}
    } catch (error:any) {
         return { error: "Ocurrió un error al guardar la incidencia." }
    }
    
}