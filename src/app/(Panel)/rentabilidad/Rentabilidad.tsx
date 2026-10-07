'use client'

import { Card } from "@/components/ui/Card"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Cloud, FileText, Smartphone } from "lucide-react"
import { Pedido, Rol } from "@/types"
import { ObtenerPedido } from "@/actions/pedidos.actions"
import { CalculoRentabilidad } from "@/actions/pedidos.actions"

interface Props {
  pedidos: Pedido[]
  rol: Rol
}

export default function Rentabilidad({pedidos, rol}: Props) {
    const esSoloLectura = rol === 'GERENCIA'
    const router = useRouter()
    const [ resultadosPanel ,setResultadosPanel] = useState<number | null>()
    const [pedidoSelect, setPedidoSelect] = useState<Pedido | null>()
    const [cargando, setCargando] = useState<boolean>()
    const [resultados, setResultados] = useState<any>()
    const esViaje = Boolean(pedidoSelect && pedidoSelect.viajeId !== null)
    const calculado = Boolean(pedidoSelect && pedidoSelect.rentabilidad !== null)
    const showUpcoming = (feature: string) => {
        alert(`Próximamente: Integración con ${feature}.`)
    }
    const handleSelectChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const id = Number(e.target.value);

      // Al cambiar de Pedido se descarta el resultado del cálculo anterior.
      setResultados(undefined)
      setResultadosPanel(null)

      if (!id) {
        setPedidoSelect(null)
        return
      }
      const datosGuardados = await ObtenerPedido(id)
      if(!datosGuardados){
        return null
      }

      const data = datosGuardados.data
      setPedidoSelect(data)

      // Si el Pedido ya tiene rentabilidad, se muestran sus valores persistidos.
      if (data && data.rentabilidad !== null) {
        const esViajeData = data.viajeId !== null
        const totalCostos = (data.costoCombustible ?? 0) + (data.costoPeaje ?? 0) + (data.costoCarga ?? 0)
        const co2 = esViajeData ? data.viaje?.co2Total : data.impactoCo2
        setResultados({
          totalCostos: totalCostos.toFixed(2),
          margenNeto: (data.margenNeto ?? 0).toFixed(2),
          rentabilidad: (data.rentabilidad ?? 0).toFixed(1),
          impactoCo2: co2 != null ? co2.toFixed(1) : '---',
        })
      }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      setCargando(true)

      const formData = new FormData(e.currentTarget)
      formData.append('pedido_id', String(pedidoSelect?.id))
      const respuesta = await CalculoRentabilidad(formData)

      if (respuesta.success) {
        setResultados(respuesta.data)
        // Reflejar localmente los valores recién persistidos del Pedido.
        setPedidoSelect((prev) => prev ? {
          ...prev,
          ingresoFlete: Number(formData.get('ingresoFlete')),
          costoCombustible: Number(formData.get('costo_combustible')),
          costoPeaje: Number(formData.get('costo_peaje')),
          costoCarga: Number(formData.get('costo_cargadescarga')),
          distanciaKm: prev.viajeId === null ? Number(formData.get('distancia_km')) : prev.distanciaKm,
          impactoCo2: prev.viajeId === null ? Number(respuesta.data.impactoCo2) : prev.impactoCo2,
          margenNeto: Number(respuesta.data.margenNeto),
          rentabilidad: Number(respuesta.data.rentabilidad),
        } : prev)
        router.refresh()
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
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h3 className="text-lg font-semibold text-slate-800">Registro de Costos Operativos</h3>
            {pedidoSelect && (
              calculado ? (
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">Calculado</span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">Pendiente de cálculo</span>
              )
            )}
          </div>
          <form key={pedidoSelect?.id ?? 'empty'} className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Ruta / Pedido ID</label>
                 <select onChange={handleSelectChange} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                   <option value=''>Seleccione una opcion...</option>
                   {pedidos.map((ped)=>(
                    <option value={ped.id} key={ped.id}>{ped.codigo} — {ped.rentabilidad !== null ? 'Calculado' : 'Pendiente'}</option>
                   ))}
                 </select>
               </div>
               {esViaje ? (
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Viaje</label>
                   <div className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                     <p className="font-medium">Viaje: {pedidoSelect?.viaje?.codigo ?? '---'}</p>
                     <p className="text-xs text-slate-500 mt-1">
                       Distancia del viaje: {pedidoSelect?.viaje?.distanciaTotal != null ? `${pedidoSelect.viaje.distanciaTotal} km` : '---'}
                     </p>
                     <p className="text-xs text-slate-500">
                       CO2 del viaje: {pedidoSelect?.viaje?.co2Total != null ? `${pedidoSelect.viaje.co2Total} kg CO2` : '---'}
                     </p>
                   </div>
                 </div>
               ) : (
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Distancia Recorrida (KM)</label>
                    <input name="distancia_km" type="number" min="0.01" step="0.01" defaultValue={pedidoSelect?.distanciaKm ?? ''} disabled={esSoloLectura} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                 </div>
               )}
            </div>
            
            <div className="space-y-3 pt-4 border-t border-slate-100">
<div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ingreso por flete (S/)</label>
                  <input name="ingresoFlete" min="0.01" step='0.01' type="number" placeholder="0.00" defaultValue={pedidoSelect?.ingresoFlete ?? ''} disabled={esSoloLectura} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Costo Combustible (S/)</label>
                  <input name="costo_combustible" min="0" step='0.01' type="number" placeholder="0.00" defaultValue={pedidoSelect?.costoCombustible ?? ''} disabled={esSoloLectura} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Peajes (S/)</label>
                  <input name="costo_peaje" min="0" step='0.01' type="number" placeholder="0.00" defaultValue={pedidoSelect?.costoPeaje ?? ''} disabled={esSoloLectura} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Costo Carga/Descarga (S/)</label>
                  <input name="costo_cargadescarga" min="0" step='0.01' type="number" placeholder="0.00" defaultValue={pedidoSelect?.costoCarga ?? ''} disabled={esSoloLectura} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
               </div>
            </div>  
            
            <div className="pt-4">
              {!esSoloLectura && (
                <Button type="submit" className="w-full">{calculado ? 'Recalcular rentabilidad' : 'Calcular rentabilidad'}</Button>
              )}
            </div>
          </form>
        </Card>

        <div className="space-y-6">
           <Card className="bg-linear-to-br from-emerald-50 to-teal-100 border-none shadow-md">
             <div className="flex items-start justify-between">
               <div>
                 <p className="text-sm font-semibold text-emerald-800 uppercase tracking-wide">{esViaje ? 'CO2 del Viaje' : 'Impacto Ambiental'}</p>
                 <h3 className="text-3xl font-bold text-slate-900 mt-2">{resultados ? resultados.impactoCo2 : '---'}<span className="text-lg text-slate-600 font-medium"> kg CO2</span></h3>
                 <p className="text-xs text-slate-500 mt-1">{esViaje ? 'Emisiones del viaje (información contextual del viaje, no exclusiva de este pedido)' : 'Cálculo estimado basado en KM y factor del vehículo'}</p>
               </div>
               <div className="p-4 bg-emerald-200 rounded-full text-emerald-700">
                  <Cloud className="w-8 h-8" />
               </div>
             </div>
             
             <div className="mt-6 pt-4 border-t border-emerald-200/50 flex justify-between text-sm">
                <span className="text-emerald-800">Factor: {esViaje ? (pedidoSelect?.viaje?.factorEmisionAplicado ?? '---') : (pedidoSelect?.unidad?.factorEmision? pedidoSelect?.unidad?.factorEmision : '---')}</span>
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
