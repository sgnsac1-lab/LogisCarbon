'use client'
import { useState } from "react"
import { Package, Truck, Cloud, TrendingUp } from "lucide-react"
import { BarChart, Bar, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, PieChart, Pie, Cell } from 'recharts'
import { Card } from "@/components/ui/Card"
import { mockStats } from "@/lib/temp/mockData"

interface Props{
    datos: any
}


export default function Dashboard({datos}: Props) {
   
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Dashboard General</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Pedidos</p>
              <h4 className="text-2xl font-bold text-slate-900">{datos.kpis.totalPedidos}</h4>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Emisiones (Mes)</p>
              <h4 className="text-2xl font-bold text-slate-900">{`${datos.kpis.emisionesMes} kg CO2`}</h4>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-lg">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Unidades en Ruta</p>
              <h4 className="text-2xl font-bold text-slate-900">{datos.kpis.unidadesEnRuta}</h4>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Rentabilidad Global</p>
              <h4 className="text-2xl font-bold text-slate-900">{`${datos.kpis.rentabilidadGlobal}%`}</h4>
            </div>
          </div>
        </Card>
      </div>

      {/* Simulated Charts using Tailwind Divs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* GRÁFICO 1: BARRAS (CO2) */}
        <Card className="h-80 flex flex-col p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Tendencia de Emisiones CO2</h3>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datos.graficos.tendenciaCo2}> {/* Pasas la data de Prisma aquí */}
                <RechartsTooltip 
                  cursor={{ fill: '#d1fae5' }} // Hover color (emerald-100)
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <XAxis dataKey="codigo" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                {/* El radio le da el borde redondeado arriba, igual que tu diseño */}
                <Bar dataKey="impactoCo2" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* GRÁFICO 2: DONA (ESTADOS) */}
        <Card className="h-80 flex flex-col p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Estado de Pedidos</h3>
          <div className="flex-1 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={datos.graficos.estadoPedidos} // Pasas la data de Prisma aquí
                  innerRadius={60} // Esto hace el hueco del medio (Donut)
                  outerRadius={80}
                  paddingAngle={2} // Una pequeña separación entre colores
                  dataKey="value"
                  stroke="none"
                >
                  {/* Iteramos para darle a cada estado su color exacto de Tailwind */}
                  {datos.graficos.estadoPedidos.map((entry: { name: string; value: number }, index: number) => {
                    // Asignamos colores según el estado
                    const colores: Record<string, string> = {
                        'ENTREGADO': '#3b82f6',
                        'EN_TRANSITO': '#f59e0b',
                        'PENDIENTE': '#10b981',
                        'OBSERVADO': '#ef4444'
                    };
                    return <Cell key={`cell-${index}`} fill={colores[entry.name] || '#cbd5e1'} />;
                  })}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>

            {/* El texto del centro (Total) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-slate-800">{datos.kpis.totalPedidos}</span>
              <span className="text-xs text-slate-500">Total</span>
            </div>
          </div>
          
          {/* La Leyenda inferior */}
          <div className="flex justify-center space-x-6 mt-4">
            <div className="flex items-center text-xs"><span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span> Entregados</div>
            <div className="flex items-center text-xs"><span className="w-3 h-3 rounded-full bg-amber-500 mr-2"></span> En Tránsito</div>
            <div className="flex items-center text-xs"><span className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></span> Pendientes</div>
          </div>
        </Card>

      </div>
    </div>
  )
}
