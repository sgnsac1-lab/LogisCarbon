'use server';

import { prisma } from '../lib/prisma/prisma'

export async function obtenerDatosDashboard() {
  try {
    const totalPedidos = await prisma.pedido.count();

    const sumatoriaCo2 = await prisma.pedido.aggregate({
      _sum: { impactoCo2: true },
      where: { estado: 'ENTREGADO' } 
    });

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

    const ultimosViajesCo2 = await prisma.pedido.findMany({
      where: { 
        estado: 'ENTREGADO',
        impactoCo2: { not: null } 
      },
      orderBy: { updatedAt: 'desc' },
      take: 7,
      select: { 
        codigo: true, 
        impactoCo2: true,
        updatedAt: true 
      }
    });

    return {
      kpis: {
        totalPedidos,
        emisionesMes: sumatoriaCo2._sum.impactoCo2?.toFixed(1) || '0.0',
        unidadesEnRuta,
        rentabilidadGlobal: rentabilidadGlobal.toFixed(1)
      },
      graficos: {
        estadoPedidos: dataEstadoPedidos, 
        tendenciaCo2: ultimosViajesCo2.reverse() 
      }
    };

  } catch (error) {
    console.error("Error al cargar el dashboard:", error);
    return null;
  }
}