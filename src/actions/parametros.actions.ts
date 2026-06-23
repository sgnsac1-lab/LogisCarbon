'use server'

import { prisma } from '../lib/prisma/prisma'
import { revalidatePath } from 'next/cache'
import { TipoCatalogo } from '@/types'

export async function ObtenerParametros() {
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