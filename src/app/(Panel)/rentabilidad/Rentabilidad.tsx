'use client'

import { Card } from "@/components/ui/Card"
import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Cloud, FileText, Smartphone } from "lucide-react"
import { Pedido } from "@/types"
import { ObtenerPedido } from "@/actions/pedidos.actions"
import { CalculoRentabilidad } from "@/actions/pedidos.actions"

interface Props {
  pedidos: Pedido[]
}

export default function Rentabilidad({pedidos}: Props) {
    const [ resultadosPanel ,setResultadosPanel] = useState<number | null>()
    const [pedidoSelect, setPedidoSelect] = useState<Pedido | null>()
    const [cargando, setCargando] = useState<boolean>()
    const [resultados, setResultados] = useState<any>()
    const showUpcoming = (feature: string) => {
        alert(`Próximamente: Integración con ${feature}.`)
    }
    const handleSelectChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const id = Number(e.target.value);
      if (!id) {
        setResultadosPanel(null)
        return
      }
      const datosGuardados = await ObtenerPedido(id)
      if(!datosGuardados){
        return null
      }
      setPedidoSelect(datosGuardados.data)
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      setCargando(true)

      const formData = new FormData(e.currentTarget)
      formData.append('pedido_id', String(pedidoSelect?.id))
      const respuesta = await CalculoRentabilidad(formData)

      if (respuesta.success) {
        setResultados(respuesta.data)
      } else {
        alert(respuesta.error)
      }
      setCargando(false)
    }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Costos y Huella de Carbono</h2>
          <p className="text-slate-500 text-sm mt-1">Cálculo de rentabilidad por viaje y emisiones generadas</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" title="Próximamente" onClick={() => showUpcoming("Facturación Electrónica")} className="opacity-70">
             <FileText className="w-4 h-4 mr-2" /> Facturación
          </Button>
          <Button variant="outline" title="Próximamente" onClick={() => showUpcoming("WhatsApp")} className="opacity-70 text-emerald-600 border-emerald-200 hover:bg-emerald-50">
             <Smartphone className="w-4 h-4 mr-2" /> Notificar WhatsApp
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-3">Registro de Costos Operativos</h3>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Ruta / Pedido ID</label>
                 <select onChange={handleSelectChange} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                   <option value=''>Seleccione una opcion...</option>
                   {pedidos.map((ped)=>(
                    <option value={ped.id} key={ped.id}>{ped.codigo}</option>
                   ))}
                 </select>
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Distancia Recorrida (KM)</label>
                  <input name="distancia_km" type="number" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
               </div>
            </div>
            
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ingreso por flete (S/)</label>
                  <input name="ingresoFlete" step='0.01' type="number" placeholder="0.00" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Costo Combustible (S/)</label>
                  <input name="costo_combustible" step='0.01' type="number" placeholder="0.00" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Peajes (S/)</label>
                  <input name="costo_peaje" step='0.01' type="number" placeholder="0.00" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Costo Carga/Descarga (S/)</label>
                  <input name="costo_cargadescarga" step='0.01' type="number" placeholder="0.00" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
               </div>
            </div>  
            
            <div className="pt-4">
              <Button type="submit" className="w-full">Calcular y Guardar</Button>
            </div>
          </form>
        </Card>

        <div className="space-y-6">
           <Card className="bg-linear-to-br from-emerald-50 to-teal-100 border-none shadow-md">
             <div className="flex items-start justify-between">
               <div>
                 <p className="text-sm font-semibold text-emerald-800 uppercase tracking-wide">Impacto Ambiental</p>
                 <h3 className="text-3xl font-bold text-slate-900 mt-2">{resultados ? resultados.impactoCo2 : '---'}<span className="text-lg text-slate-600 font-medium"> kg CO2</span></h3>
                 <p className="text-xs text-slate-500 mt-1">Cálculo estimado basado en KM y factor del vehículo</p>
               </div>
               <div className="p-4 bg-emerald-200 rounded-full text-emerald-700">
                  <Cloud className="w-8 h-8" />
               </div>
             </div>
             
             <div className="mt-6 pt-4 border-t border-emerald-200/50 flex justify-between text-sm">
                <span className="text-emerald-800">Factor: {pedidoSelect?.unidad?.factorEmision? pedidoSelect?.unidad?.factorEmision : '---'}</span>
                <span className="text-emerald-800">Estatus: Normal</span>
             </div>
           </Card>

           <Card>
             <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-3">Resumen de Rentabilidad (Simulado)</h3>
             <div className="space-y-3 text-sm">
               <div className="flex justify-between">
                 <span className="text-slate-500">Ingreso por Flete:</span>
                 <span className="font-medium text-slate-900">S/ {pedidoSelect?.ingresoFlete? pedidoSelect?.ingresoFlete : '0.00'}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-slate-500">Total Costos Operativos:</span>
                 <span className="font-medium text-red-600">- S/ {resultados ? resultados.totalCostos : '0.00'}</span>
               </div>
               <div className="flex justify-between border-t border-slate-100 pt-3 mt-3">
                 <span className="text-base font-bold text-slate-800">Margen Neto:</span>
                 <span className="text-base font-bold text-emerald-600">S/ {resultados ? resultados.margenNeto : '0.00'}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-slate-500">Rentabilidad (%):</span>
                 <span className="font-medium text-slate-900">{resultados ? resultados.rentabilidad : '0.00'}%</span>
               </div>
             </div>
           </Card>
        </div>
      </div>
    </div>
  )
}
