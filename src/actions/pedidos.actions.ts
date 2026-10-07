'use server'

import { prisma } from '../lib/prisma/prisma'
import { revalidatePath } from 'next/cache'
import { requireActiveUser, requireRole } from '@/lib/auth'

export interface DatosEntrega {
    destinatarioNombre: string
    destinatarioDireccion: string
    destinatarioTelefono?: string | null
    pesoKg: number
    cantidadUnidades: number
}

export interface DatosEntregaPedido extends DatosEntrega {
    pedidoId: number
}

interface DatosEntregaValidados {
    destinatarioNombre: string
    destinatarioDireccion: string
    destinatarioTelefono: string | null
    pesoKg: number
    cantidadUnidades: number
}

type ResultadoValidacionEntrega =
    | { ok: true; data: DatosEntregaValidados }
    | { ok: false; error: string }

function validarDatosEntrega(datosEntrega?: DatosEntrega | null): ResultadoValidacionEntrega | null {
    if (datosEntrega === undefined || datosEntrega === null) {
        return null
    }

    const destinatarioNombre = typeof datosEntrega.destinatarioNombre === 'string'
        ? datosEntrega.destinatarioNombre.trim()
        : ''
    if (!destinatarioNombre) {
        return { ok: false, error: 'El nombre del destinatario es obligatorio.' }
    }

    const destinatarioDireccion = typeof datosEntrega.destinatarioDireccion === 'string'
        ? datosEntrega.destinatarioDireccion.trim()
        : ''
    if (!destinatarioDireccion) {
        return { ok: false, error: 'La dirección del destinatario es obligatoria.' }
    }

    let destinatarioTelefono: string | null = null
    if (datosEntrega.destinatarioTelefono !== undefined && datosEntrega.destinatarioTelefono !== null) {
        const telefonoNormalizado = String(datosEntrega.destinatarioTelefono).trim()
        destinatarioTelefono = telefonoNormalizado === '' ? null : telefonoNormalizado
    }

    const { pesoKg } = datosEntrega
    if (typeof pesoKg !== 'number' || !Number.isFinite(pesoKg) || pesoKg <= 0) {
        return { ok: false, error: 'El peso debe ser mayor a 0.' }
    }

    const { cantidadUnidades } = datosEntrega
    if (typeof cantidadUnidades !== 'number' || !Number.isInteger(cantidadUnidades) || cantidadUnidades <= 0) {
        return { ok: false, error: 'La cantidad de unidades debe ser un entero mayor a 0.' }
    }

    return {
        ok: true,
        data: {
            destinatarioNombre,
            destinatarioDireccion,
            destinatarioTelefono,
            pesoKg,
            cantidadUnidades,
        },
    }
}

export async function ObtenerPedidos() {
    const autorizacion = await requireActiveUser()
    if (!autorizacion.ok) {
        return { success: false, error: autorizacion.error }
    }

    try {
        const pedidos = await prisma.pedido.findMany({
            orderBy: {id: 'desc'},
            include: {
                cliente: true,
                origen: true,
                destino: true,
                viaje: true,
            }
        })
        return {success: true, data: pedidos}
    } catch (error) {
        return { success: false, error:'Error al cargar el listado de pedidos'}
    }
}

export async function ObtenerPedido(id:number) {
    const autorizacion = await requireActiveUser()
    if (!autorizacion.ok) {
        return { success: false, error: autorizacion.error }
    }

    try {
        const pedido = await prisma.pedido.findUnique({
            where: {id: id},
            include: {
                cliente: true,
                origen: true,
                destino: true,
                unidad: true,
                viaje: {
                    include: {
                        unidad: true,
                        pedidos: true,
                    },
                },
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

export async function CrearPedidos(formData: FormData, datosEntrega: DatosEntrega) {
    const autorizacion = await requireRole('ADMIN', 'OPERACIONES')
    if (!autorizacion.ok) {
        return { error: autorizacion.error }
    }

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

    const validacionEntrega = validarDatosEntrega(datosEntrega)
    if (!validacionEntrega || !validacionEntrega.ok) {
        return { error: validacionEntrega ? validacionEntrega.error : 'Los datos de entrega son obligatorios.' }
    }

    try {
        const cliente = await prisma.cliente.findUnique({
            where: { id: idcliente },
        })
        if (!cliente) {
            return { error: 'El cliente seleccionado no existe.' }
        }

        const [origen, destino] = await Promise.all([
            prisma.parametro.findUnique({ where: { id: idorigen } }),
            prisma.parametro.findUnique({ where: { id: iddestino } }),
        ])
        if (!origen) {
            return { error: 'El origen seleccionado no es válido.' }
        }
        if (!destino) {
            return { error: 'El destino seleccionado no es válido.' }
        }
        if (idorigen === iddestino) {
            return { error: 'El origen y el destino deben ser diferentes.' }
        }
        if (!origen.activo || origen.tipo !== 'DESTINO') {
            return { error: 'El origen seleccionado no es válido.' }
        }
        if (!destino.activo || destino.tipo !== 'DESTINO') {
            return { error: 'El destino seleccionado no es válido.' }
        }

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
                factorPesoVol: factorPeso && factorPeso.trim() ? factorPeso : null,
                observaciones: observaciones,
                destinatarioNombre: validacionEntrega.data.destinatarioNombre,
                destinatarioDireccion: validacionEntrega.data.destinatarioDireccion,
                destinatarioTelefono: validacionEntrega.data.destinatarioTelefono,
                pesoKg: validacionEntrega.data.pesoKg,
                cantidadUnidades: validacionEntrega.data.cantidadUnidades,
            }
        })
        revalidatePath('/pedidos')
        return {success: true}
    } catch (error:any) {
         return { error: "Ocurrió un error al guardar el pedido." }
    }
    
}

export async function ActualizarDatosEntregaPedido(datosEntrega: DatosEntregaPedido) {
    const autorizacion = await requireRole('ADMIN', 'OPERACIONES')
    if (!autorizacion.ok) {
        return { error: autorizacion.error }
    }

    const validacionEntrega = validarDatosEntrega(datosEntrega)
    if (!validacionEntrega || !validacionEntrega.ok) {
        return { error: validacionEntrega ? validacionEntrega.error : 'Los datos de entrega son obligatorios.' }
    }

    const pedidoId = datosEntrega.pedidoId
    if (typeof pedidoId !== 'number' || !Number.isInteger(pedidoId)) {
        return { error: 'El pedido no existe.' }
    }

    try {
        const pedido = await prisma.pedido.findUnique({
            where: { id: pedidoId },
        })
        if (!pedido) {
            return { error: 'El pedido no existe.' }
        }
        if (pedido.estado !== 'PENDIENTE') {
            return { error: 'El pedido solo puede editarse mientras esté pendiente.' }
        }
        if (pedido.viajeId !== null) {
            return { error: 'El pedido ya pertenece a un viaje y no puede editarse.' }
        }

        await prisma.pedido.update({
            where: { id: pedidoId },
            data: validacionEntrega.data,
        })

        revalidatePath('/pedidos')
        revalidatePath(`/pedidos/trazabilidad/${pedidoId}`)
        return { success: true }
    } catch {
         return { error: "Ocurrió un error al actualizar los datos de entrega." }
    }
    
}

export async function CalculoRentabilidad(formData: FormData) {
    const autorizacion = await requireRole('ADMIN', 'OPERACIONES')
    if (!autorizacion.ok) {
        return { error: autorizacion.error }
    }

    const distanciaKmRAW = formData.get('distancia_km') as string
    const costoCombustibleRAW = formData.get('costo_combustible') as string
    const costoPeajeRAW = formData.get('costo_peaje') as string
    const costoCargaRAW = formData.get('costo_cargadescarga') as string
    const ingresoFleteRAW = formData.get('ingresoFlete') as string
    const pedidoIdRAW = formData.get('pedido_id') as string

    const pedidoId = pedidoIdRAW ? parseInt(pedidoIdRAW) : NaN
    const distanciaKm = distanciaKmRAW ? parseFloat(distanciaKmRAW) : NaN
    const ingresoFlete = ingresoFleteRAW ? parseFloat(ingresoFleteRAW) : NaN
    const costoCombustible = costoCombustibleRAW ? parseFloat(costoCombustibleRAW) : NaN
    const costoPeaje = costoPeajeRAW ? parseFloat(costoPeajeRAW) : NaN
    const costoCarga = costoCargaRAW ? parseFloat(costoCargaRAW) : NaN

    if (!Number.isInteger(pedidoId) || pedidoId <= 0) {
        return { error: 'Pedido no encontrado' }
    }
    if (!Number.isFinite(ingresoFlete) || ingresoFlete <= 0) {
        return { error: 'El ingreso del flete debe ser mayor a 0.' }
    }
    if (!Number.isFinite(costoCombustible) || costoCombustible < 0) {
        return { error: 'El costo de combustible no puede ser negativo.' }
    }
    if (!Number.isFinite(costoPeaje) || costoPeaje < 0) {
        return { error: 'El costo de peaje no puede ser negativo.' }
    }
    if (!Number.isFinite(costoCarga) || costoCarga < 0) {
        return { error: 'El costo de carga/descarga no puede ser negativo.' }
    }

    try {

        const pedidoActual = await prisma.pedido.findUnique({
            where: { id: pedidoId },
            include: { unidad: true, viaje: true }
        });

        if (!pedidoActual) {
            return { error: 'Pedido no encontrado' };
        }

        let distanciaAplicada: number | null = null;
        let impactoCo2: number | null = null;
        let co2Reportado: number;

        if (pedidoActual.viajeId === null) {
            if (!Number.isFinite(distanciaKm) || distanciaKm <= 0) {
                return { error: 'La distancia debe ser mayor a 0.' }
            }
            const factorEmision = pedidoActual.unidad?.factorEmision ?? 0;
            if (!Number.isFinite(factorEmision) || factorEmision <= 0) {
                return { error: 'La unidad no tiene un factor de emisión válido.' }
            }
            distanciaAplicada = distanciaKm;
            impactoCo2 = distanciaKm * factorEmision;
            co2Reportado = impactoCo2;
        } else {
            const viaje = pedidoActual.viaje;
            if (!viaje) {
                return { error: 'El viaje del pedido no existe.' }
            }
            if (viaje.estado !== 'CERRADO') {
                return { error: 'El viaje aún no ha finalizado.' }
            }
            if (viaje.distanciaTotal === null || !Number.isFinite(viaje.distanciaTotal) || viaje.distanciaTotal <= 0) {
                return { error: 'El viaje no tiene una distancia total válida.' }
            }
            if (viaje.factorEmisionAplicado === null || !Number.isFinite(viaje.factorEmisionAplicado) || viaje.factorEmisionAplicado <= 0) {
                return { error: 'El viaje no tiene un factor de emisión válido.' }
            }
            if (viaje.co2Total === null || !Number.isFinite(viaje.co2Total) || viaje.co2Total <= 0) {
                return { error: 'El viaje no tiene un CO2 total válido.' }
            }
            co2Reportado = viaje.co2Total;
        }

        const totalCostosOperativos = costoCombustible + costoPeaje + costoCarga;
        const margenNeto = ingresoFlete - totalCostosOperativos;
        const rentabilidad = ingresoFlete > 0 
            ? (margenNeto / ingresoFlete) * 100 
            : 0;

        const dataPedido = pedidoActual.viajeId === null
            ? {
                ingresoFlete,
                distanciaKm: distanciaAplicada,
                costoCombustible,
                costoPeaje,
                costoCarga,
                impactoCo2,
                margenNeto,
                rentabilidad,
            }
            : {
                ingresoFlete,
                costoCombustible,
                costoPeaje,
                costoCarga,
                margenNeto,
                rentabilidad,
            };

        await prisma.pedido.update({
            where: { id: pedidoId },
            data: dataPedido
        });

        revalidatePath('/rentabilidad');
        revalidatePath('/dashboard');
        
        return {
            success: true, 
            data: {
                totalCostos: totalCostosOperativos.toFixed(2),
                margenNeto: margenNeto.toFixed(2),
                rentabilidad: rentabilidad.toFixed(1),
                impactoCo2: co2Reportado.toFixed(1)
            }
        }
    } catch (error:any) {
         return { error: "Ocurrió un error al realizar el calculo." }
    }
    
}

export async function obtenerPedidosParaAsignar() {
  const autorizacion = await requireActiveUser()
  if (!autorizacion.ok) {
    return { error: autorizacion.error }
  }

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

type ResultadoEntrega =
  | { ok: true; cerrado: boolean }
  | { ok: false; error: string }

export async function completarEntrega(pedidoId: number, unidadId: number) {
  const autorizacion = await requireRole('ADMIN', 'OPERACIONES')
  if (!autorizacion.ok) {
    return { success: false, error: autorizacion.error }
  }

  if (typeof pedidoId !== 'number' || !Number.isInteger(pedidoId) || pedidoId <= 0) {
    return { success: false, error: 'El pedido no es válido.' };
  }

  try {
    const resultado = await prisma.$transaction(async (tx): Promise<ResultadoEntrega> => {
      const pedido = await tx.pedido.findUnique({
        where: { id: pedidoId },
        include: { viaje: true },
      })
      if (!pedido) {
        return { ok: false, error: 'El pedido no existe.' }
      }

      if (pedido.viajeId === null) {
        if (pedido.estado === 'ENTREGADO') {
          return { ok: false, error: 'El pedido ya fue entregado.' }
        }

        const actualizado = await tx.pedido.updateMany({
          where: { id: pedidoId, viajeId: null },
          data: { estado: 'ENTREGADO' },
        })
        if (actualizado.count !== 1) {
          throw new Error('El pedido cambió de estado durante la entrega.')
        }

        const unidadObjetivo = pedido.unidadId ?? (typeof unidadId === 'number' && Number.isInteger(unidadId) ? unidadId : null)
        if (unidadObjetivo !== null) {
          await tx.unidad.update({
            where: { id: unidadObjetivo },
            data: {
              estado: 'DISPONIBLE',
              conductorActual: null,
            },
          })
        }

        await tx.incidencia.create({
          data: {
            pedidoId: pedidoId,
            tipoEvento: 'Pedido Entregado',
            ubicacion: 'Punto de Destino',
            detalle: 'Carga entregada satisfactoriamente y unidad liberada.',
          },
        })

        return { ok: true, cerrado: false }
      }

      if (pedido.estado !== 'EN_TRANSITO') {
        return { ok: false, error: 'El pedido no está en tránsito.' }
      }
      const viaje = pedido.viaje
      if (!viaje) {
        return { ok: false, error: 'El viaje del pedido no existe.' }
      }
      if (viaje.estado !== 'EN_RUTA') {
        return { ok: false, error: 'El viaje no se encuentra en ruta.' }
      }
      if (pedido.unidadId !== viaje.unidadId) {
        return { ok: false, error: 'El pedido no está asignado a la unidad del viaje.' }
      }
      const unidad = await tx.unidad.findUnique({ where: { id: viaje.unidadId } })
      if (!unidad) {
        return { ok: false, error: 'La unidad del viaje no existe.' }
      }
      if (unidad.estado !== 'EN_RUTA') {
        return { ok: false, error: 'La unidad del viaje no se encuentra en ruta.' }
      }

      const actualizado = await tx.pedido.updateMany({
        where: { id: pedidoId, estado: 'EN_TRANSITO', viajeId: viaje.id },
        data: { estado: 'ENTREGADO' },
      })
      if (actualizado.count !== 1) {
        throw new Error('El pedido cambió de estado durante la entrega.')
      }

      const pendientes = await tx.pedido.count({
        where: { viajeId: viaje.id, estado: { not: 'ENTREGADO' } },
      })

      await tx.incidencia.create({
        data: {
          pedidoId: pedidoId,
          tipoEvento: 'Pedido Entregado',
          ubicacion: 'Punto de Destino',
          detalle: pendientes === 0
            ? 'Carga entregada satisfactoriamente y unidad liberada.'
            : 'Carga entregada satisfactoriamente.',
        },
      })

      if (pendientes === 0) {
        await tx.viaje.update({
          where: { id: viaje.id },
          data: {
            estado: 'CERRADO',
            fechaCierre: new Date(),
          },
        })
        await tx.unidad.update({
          where: { id: viaje.unidadId },
          data: {
            estado: 'DISPONIBLE',
            conductorActual: null,
          },
        })
        return { ok: true, cerrado: true }
      }

      return { ok: true, cerrado: false }
    })

    if (!resultado.ok) {
      return { success: false, error: resultado.error };
    }

    // Refrescamos las rutas afectadas
    revalidatePath(`/pedidos/trazabilidad/${pedidoId}`)
    revalidatePath('/pedidos')
    revalidatePath('/flota')
    revalidatePath('/rentabilidad')

    return { success: true, data: { cerrado: resultado.cerrado } }
  } catch (error) {
    console.error("Error al completar entrega:", error);
    return { success: false, error: "No se pudo completar la entrega" };
  }
}

