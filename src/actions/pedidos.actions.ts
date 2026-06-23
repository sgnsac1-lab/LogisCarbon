'use server'

import { prisma } from '../lib/prisma/prisma'
import { revalidatePath } from 'next/cache'

export async function ObtenerPedidos() {
    try {
        const pedidos = await prisma.pedido.findMany({
            orderBy: {id: 'desc'},
            include: {
                cliente: true,
                origen: true,
                destino: true,
            }
        })
        return {success: true, data: pedidos}
    } catch (error) {
        return { success: false, error:'Error al cargar el listado de pedidos'}
    }
}

export async function ObtenerPedido(id:number) {
    try {
        const pedido = await prisma.pedido.findUnique({
            where: {id: id},
            include: {
                cliente: true,
                origen: true,
                destino: true,
                unidad: true
            }
        })
        return {success: true, data: pedido}
    } catch (error) {
        return { success: false, error:'Error al cargar el pedido'}
    }
}

export async function ObtenerPedidoCodigo(codigo:string) {
    try {
        const pedido = await prisma.pedido.findUnique({
            where: {codigo: codigo},
            include: {
                cliente: true,
                origen: true,
                destino: true,
                unidad: true
            }
        })
        return {success: true, data: pedido}
    } catch (error) {
        return { success: false, error:'Error al cargar el pedido'}
    }
}

export async function CrearPedidos(formData: FormData) {
    const idclienteRAW = formData.get('idCliente') as string
    const idorigenRAW = formData.get('idOrigen') as string
    const iddestinoRAW = formData.get('idDestino') as string
    const factorPeso = formData.get('factorPeso') as string
    const observaciones = formData.get('observaciones') as string

    const idcliente = idclienteRAW ? parseInt(idclienteRAW) : null
    const idorigen = idorigenRAW ? parseInt(idorigenRAW) : null
    const iddestino = iddestinoRAW ? parseInt(iddestinoRAW) : null

    if(!idcliente || !idorigen || !iddestino){
        return {error: 'Todos los campos son obligatorios'}
    }

    try {
        const ultimoPedido = await prisma.pedido.findFirst({
        orderBy: {
            id: 'desc',
        },
        select: {
            codigo: true, 
        },
        })
        let siguienteNumero = 1
        if (ultimoPedido && ultimoPedido.codigo) {
        const numeroActual = parseInt(ultimoPedido.codigo.split('-')[1])
        siguienteNumero = numeroActual + 1
        }
        const codigoGenerado = `PED-${siguienteNumero.toString().padStart(3, '0')}`

        await prisma.pedido.create({
            data:{
                codigo: codigoGenerado ,
                clienteId: idcliente,
                origenId: idorigen,
                destinoId: iddestino,
                factorPesoVol: factorPeso,
                observaciones: observaciones
            }
        })
        revalidatePath('/pedidos')
        return {success: true}
    } catch (error:any) {
         return { error: "Ocurrió un error al guardar el pedido." }
    }
    
}

export async function CalculoRentabilidad(formData: FormData) {
    const distanciaKmRAW = formData.get('distancia_km') as string
    const costoCombustibleRAW = formData.get('costo_combustible') as string
    const costoPeajeRAW = formData.get('costo_peaje') as string
    const costoCargaRAW = formData.get('costo_cargadescarga') as string
    const ingresoFleteRAW = formData.get('ingresoFlete') as string
    const pedidoIdRAW = formData.get('pedido_id') as string

    const pedidoId = parseInt(pedidoIdRAW) 
    const distanciaKm = distanciaKmRAW ? parseFloat(distanciaKmRAW) : null
    const ingresoFlete = ingresoFleteRAW ? parseFloat(ingresoFleteRAW) : null
    const costoCombustible = costoCombustibleRAW ? parseFloat(costoCombustibleRAW) : null
    const costoPeaje = costoPeajeRAW ? parseFloat(costoPeajeRAW) : null
    const costoCarga = costoCargaRAW ? parseFloat(costoCargaRAW) : null

    if(!distanciaKm || !costoCombustible || !costoPeaje || !costoCarga || !ingresoFlete){
        return {error: 'Todos los campos son obligatorios'}
    }

    try {

        const pedidoActual = await prisma.pedido.findUnique({
            where: { id: pedidoId },
            include: { unidad: true }
        });

        if (!pedidoActual) {
            return { error: 'Pedido no encontrado' };
        }

        const totalCostosOperativos = costoCombustible + costoPeaje + costoCarga;
        const margenNeto = ingresoFlete - totalCostosOperativos;
        const rentabilidad = ingresoFlete > 0 
            ? (margenNeto / ingresoFlete) * 100 
            : 0;

        const factorEmision = pedidoActual.unidad?.factorEmision || 0;
        const impactoCo2 = distanciaKm * factorEmision;

        await prisma.pedido.update({
            where: { id: pedidoId },
            data: {
                ingresoFlete,
                distanciaKm,
                costoCombustible,
                costoPeaje,
                costoCarga,
                impactoCo2,
                margenNeto,
                rentabilidad, 
            }
        });

        revalidatePath('/panel/rentabilidad');
        
        return {
            success: true, 
            data: {
                totalCostos: totalCostosOperativos.toFixed(2),
                margenNeto: margenNeto.toFixed(2),
                rentabilidad: rentabilidad.toFixed(1),
                impactoCo2: impactoCo2.toFixed(1)
            }
        }
    } catch (error:any) {
         return { error: "Ocurrió un error al realizar el calculo." }
    }
    
}

export async function obtenerPedidosParaAsignar() {
  try {
     const pedidos = await prisma.pedido.findMany({
      where: { 
        estado: 'PENDIENTE',
        unidadId: null       
      },
      include: {
        origen: true,
        destino: true
      }
    });
     return {success: true, data: pedidos}
  } catch (error) {
    return {error: "Ocurrió un error al obtener los pedidos."};
  }
}

export async function completarEntrega(pedidoId: number, unidadId: number) {
  try {
    await prisma.$transaction([
      prisma.pedido.update({
        where: { id: pedidoId },
        data: { estado: 'ENTREGADO' }
      }),

      prisma.unidad.update({
        where: { id: unidadId },
        data: { 
          estado: 'DISPONIBLE',
          conductorActual: null
        }
      }),

      prisma.incidencia.create({
        data: {
          pedidoId: pedidoId,
          tipoEvento: 'Pedido Entregado',
          ubicacion: 'Punto de Destino',
          detalle: 'Carga entregada satisfactoriamente y unidad liberada.',
        }
      })
    ]);

    // Refrescamos las rutas afectadas
    revalidatePath(`/pedidos/trazabilidad/${pedidoId}`)
    revalidatePath('/flota')
    revalidatePath('/rentabilidad')

    return { success: true }
  } catch (error) {
    console.error("Error al completar entrega:", error);
    return { success: false, error: "No se pudo completar la entrega" };
  }
}

