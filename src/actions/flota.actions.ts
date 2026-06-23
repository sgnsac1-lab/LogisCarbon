'use server'

import { prisma } from '../lib/prisma/prisma'
import { revalidatePath } from 'next/cache'

export async function ObtenerFlotilla() {
    try {
        const flotilla = await prisma.unidad.findMany({
            orderBy: {id: 'desc'}
        })
        return {success: true, data: flotilla}
    } catch (error) {
        return { success: false, error:'Error al cargar la flotilla'}
    }
}

export async function CrearUnidad(formData: FormData) {
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

export async function asignarUnidadAPedido(formData: FormData) {
  const unidadID_RAW = formData.get('unidad_id') as string
  const pedidoId_RAW = formData.get('pedido_id') as string
  const conductor = formData.get('conductor') as string

  const unidadID = parseInt(unidadID_RAW)
  const pedidoId = parseInt(pedidoId_RAW) 

  try {
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