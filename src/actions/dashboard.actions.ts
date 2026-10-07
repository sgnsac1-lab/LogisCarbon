'use server';

import { prisma } from '../lib/prisma/prisma'
import { requireActiveUser } from '@/lib/auth'

export async function obtenerDatosDashboard() {
  const autorizacion = await requireActiveUser()
  if (!autorizacion.ok) {
    return null
  }

  try {
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 1);

    const totalPedidos = await prisma.pedido.count();

    // Emisiones legacy: Pedido.impactoCo2 (solo pedidos sin viaje)
    const sumatoriaCo2Legacy = await prisma.pedido.aggregate({
      _sum: { impactoCo2: true },
      where: {
        estado: 'ENTREGADO',
        viajeId: null,
        impactoCo2: { not: null },
      }
    });

    // Emisiones nuevas: Viaje.co2Total (cada viaje cuenta exactamente una vez)
    const sumatoriaCo2Viajes = await prisma.viaje.aggregate({
      _sum: { co2Total: true },
      where: {
        estado: 'CERRADO',
        co2Total: { not: null },
      }
    });

    const emisionesLegacy = sumatoriaCo2Legacy._sum.impactoCo2 || 0;
    const emisionesViajes = sumatoriaCo2Viajes._sum.co2Total || 0;
    const emisionesTotales = emisionesLegacy + emisionesViajes;

    // Emisiones del mes actual
    const sumatoriaCo2LegacyMes = await prisma.pedido.aggregate({
      _sum: { impactoCo2: true },
      where: {
        estado: 'ENTREGADO',
        viajeId: null,
        impactoCo2: { not: null },
        updatedAt: { gte: inicioMes, lt: finMes },
      }
    });

    const sumatoriaCo2ViajesMes = await prisma.viaje.aggregate({
      _sum: { co2Total: true },
      where: {
        estado: 'CERRADO',
        co2Total: { not: null },
        fechaCierre: { gte: inicioMes, lt: finMes },
      }
    });

    const emisionesMes =
      (sumatoriaCo2LegacyMes._sum.impactoCo2 || 0) +
      (sumatoriaCo2ViajesMes._sum.co2Total || 0);

    const unidadesEnRuta = await prisma.unidad.count({
      where: { estado: 'EN_RUTA' }
    });

    const sumatoriasFinancieras = await prisma.pedido.aggregate({
      _sum: {
        margenNeto: true,
        ingresoFlete: true
      },
      where: { estado: 'ENTREGADO' }
    });

    const margenTotal = sumatoriasFinancieras._sum.margenNeto || 0;
    const fleteTotal = sumatoriasFinancieras._sum.ingresoFlete || 0;
    const rentabilidadGlobal = fleteTotal > 0 ? (margenTotal / fleteTotal) * 100 : 0;

    const pedidosPorEstado = await prisma.pedido.groupBy({
      by: ['estado'],
      _count: { estado: true }
    });

    const dataEstadoPedidos = pedidosPorEstado.map(item => ({
      name: item.estado,
      value: item._count.estado
    }));

    // Tendencia CO2: combina emisiones legacy (Pedido.impactoCo2) y emisiones
    // de viajes (Viaje.co2Total), manteniendo el contrato y la granularidad
    // temporal actual (hasta 7 puntos ordenados ascendentemente por fecha).
    // Cada Viaje se cuenta exactamente una vez usando Viaje.co2Total; nunca se
    // recorre sus pedidos para sumar co2Total.

    // Legacy: solo pedidos sin viaje (viajeId = null), estado ENTREGADO.
    const ultimosPedidosLegacy = await prisma.pedido.findMany({
      where: {
        estado: 'ENTREGADO',
        viajeId: null,
        impactoCo2: { not: null },
      },
      orderBy: { updatedAt: 'desc' },
      take: 7,
      select: {
        codigo: true,
        impactoCo2: true,
        updatedAt: true,
      },
    });

    // Viajes nuevos: cada viaje CERRADO con CO2 válido, una sola vez.
    const ultimosViajes = await prisma.viaje.findMany({
      where: {
        estado: 'CERRADO',
        co2Total: { not: null },
        fechaCierre: { not: null },
      },
      orderBy: { fechaCierre: 'desc' },
      take: 7,
      select: {
        codigo: true,
        co2Total: true,
        fechaCierre: true,
      },
    });

    // Se normalizan ambas fuentes al mismo contrato { codigo, impactoCo2, updatedAt }
    // para volcarlas en una única serie temporal.
    const serieCo2Legacy = ultimosPedidosLegacy.map((pedido) => ({
      codigo: pedido.codigo,
      impactoCo2: pedido.impactoCo2 as number,
      updatedAt: pedido.updatedAt,
    }));

    const serieCo2Viajes = ultimosViajes.map((viaje) => ({
      codigo: viaje.codigo,
      impactoCo2: viaje.co2Total as number,
      // fechaCierre es la fecha de pertenencia del viaje al periodo.
      updatedAt: viaje.fechaCierre as Date,
    }));

    // Se combinan ambas fuentes en un mismo bucket temporal (una sola serie),
    // ordenadas ascendentemente y recortadas a los 7 puntos más recientes.
    const tendenciaCo2 = [...serieCo2Legacy, ...serieCo2Viajes]
      .sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime())
      .slice(-7);

    return {
      kpis: {
        totalPedidos,
        emisionesMes: emisionesMes.toFixed(1),
        emisionesTotales: emisionesTotales.toFixed(1),
        unidadesEnRuta,
        rentabilidadGlobal: rentabilidadGlobal.toFixed(1)
      },
      graficos: {
        estadoPedidos: dataEstadoPedidos, 
        tendenciaCo2: tendenciaCo2 
      }
    };

  } catch (error) {
    console.error("Error al cargar el dashboard:", error);
    return null;
  }
}