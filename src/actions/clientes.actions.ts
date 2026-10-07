'use server'

import { prisma } from '../lib/prisma/prisma'
import { revalidatePath } from 'next/cache'
import { requireActiveUser, requireRole } from '@/lib/auth'

export async function ObtenerClientes() {
    const autorizacion = await requireActiveUser()
    if (!autorizacion.ok) {
        return { success: false, error: autorizacion.error }
    }

    try {
        const clientes = await prisma.cliente.findMany({
            orderBy: {id: 'desc'}
        })
        return {success: true, data: clientes}
    } catch (error) {
        return { success: false, error:'Error al cargar el listado de clientes'}
    }
}

export async function CrearClientes(formData: FormData) {
    const autorizacion = await requireRole('ADMIN', 'OPERACIONES')
    if (!autorizacion.ok) {
        return { error: autorizacion.error }
    }

    const razon_social = formData.get('razon_social') as string
    const documento = formData.get('documento') as string

    if(!razon_social || !documento ){
        return {error: 'Todos los campos son obligatorios'}
    }

    try {
        await prisma.cliente.create({
            data:{
                razonSocial: razon_social ,
                documento: documento
            }
        })
        revalidatePath('/clientes')
        return {success: true}
    } catch (error:any) {
         return { error: "Ocurrió un error al crear al cliente." }
    }
    
}
