'use server'

import { prisma } from '../lib/prisma/prisma'
import { revalidatePath } from 'next/cache'

export async function ObtenerClientes() {
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
