'use client'

import { useState } from "react"
import { Search, MapPin, CheckCircle2, Clock, Truck, Leaf, ShieldCheck, ArrowRight } from "lucide-react"
import { Button } from "../components/ui/Button"
import { Card } from "../components/ui/Card"
import { mockTrazabilidad } from "../lib/temp/mockData"
import Link from "next/link"
import { ObtenerPedidoCodigo } from "@/actions/pedidos.actions"
import { ObtenerIncidencias } from "@/actions/incidencias.actions"
import { Pedido, Incidencia } from "@/types"

export default function Home() {
  const [searchCode, setSearchCode] = useState("");
  const [pedido, setPedido] = useState<Pedido | null>(null)
  const [incidencias, setIncidencias] = useState<Incidencia[] | []>([])

  const handleSearch = async(e: React.FormEvent) => {
    e.preventDefault();
    const response = await ObtenerPedidoCodigo(searchCode)
    if(!response.data){
      alert('No se encontro el pedido con el codigo')
    }
    setPedido(response.data!)
    const response2 = await ObtenerIncidencias(response.data?.id!)
    setIncidencias(response2.data!)
  };

  const formatearFecha = (fecha: Date | string) => {
      return new Date(fecha).toLocaleString('es-PE', {
        timeZone: 'America/Lima',
        hour12: true,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    };

  return (
    <section>
       <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
        <header className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-xl font-bold text-slate-900 tracking-tight">
                Logis<span className="text-emerald-500">Carbon</span>
              </span>
            </div>
            <div className="flex items-center gap-2 w-100">
              <Link href="/login">
                <Button variant="outline" className="text-slate-700">
                  Iniciar Sesión
                </Button>
              </Link>
              <a
                href='https://docs.google.com/document/d/19aXqUyRA6frVAOuTinjJUlPQdjON-0q5qwgxrngsNII/edit?usp=sharing'
                target='_blank'
                className="bg-green-600 hover:bg-green-700 text-white font-medium p-2 rounded-lg shadow-md flex items-center justify-center transition-all bg-linear-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Manual de usuario
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </div>
          </div>
        </header>

        <main className="flex-1">
          {/* Hero Section */}
          <div className="bg-slate-900 text-white py-16 md:py-24 relative overflow-hidden">
            <div className="absolute inset-0 bg-emerald-500/10" />
            <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-white">
                Logística Inteligente y Sostenible
              </h1>
              <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
                Optimice sus rutas, reduzca su huella de carbono y mantenga la trazabilidad total de sus operaciones en tiempo real.
              </p>
              
              <div className="max-w-xl mx-auto bg-white p-2 rounded-lg shadow-lg flex">
                <form onSubmit={handleSearch} className="flex-1 flex">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-10 pr-3 py-3 border-transparent rounded-l-md focus:ring-0 focus:border-transparent text-slate-900 placeholder-slate-400"
                      placeholder="Ingrese su código de pedido (Ej. PED-001)"
                      value={searchCode}
                      onChange={(e) => setSearchCode(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="rounded-l-none rounded-r-md px-6 py-3 h-auto">
                      Rastrear
                  </Button>
                </form>
              </div>
              <p className="text-sm mt-3 text-slate-400">Rastree su envío sin necesidad de iniciar sesión.</p>
            </div>
          </div>

          {/* Tracking Results */}
          {pedido && (
            <div className="max-w-3xl mx-auto px-4 py-12">
              <Card className="border-t-4 border-emerald-500 shadow-lg">
                <h3 className="text-xl font-bold text-slate-800 mb-2">Estado del Pedido: {pedido.codigo}</h3>
                <p className="text-slate-500 text-sm mb-6 pb-6 border-b border-slate-100">Mostrando detalles en tiempo real del progreso de envío.</p>
                

                    <div className="relative border-l-2 border-slate-200 ml-4 space-y-6">
                      <div className="relative">
                      <div className="flex flex-col">
                        <h4 className={`text-sm font-semibold`}>
                          Pedido registrado
                        </h4>
                        <time className="mb-1 text-xs font-normal text-slate-400">{formatearFecha(pedido.createdAt)}</time>
                      </div>
                    </div>
                    {incidencias.map((hito, idx) => (
                      <div key={hito.id} className="relative">
                      
                        <div className="flex flex-col">
                          <h4 className={`text-sm font-semibold`}>
                            {hito.tipoEvento}
                          </h4>
                          <time className="mb-1 text-xs font-normal text-slate-400">{formatearFecha(hito.fechaHora)}</time>
                        </div>
                      </div>
                    ))}
                </div>
              </Card>
            </div>
          )}

          {/* Services Section */}
          <div className="py-16 bg-slate-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-slate-900">Nuestros Servicios</h2>
                <p className="mt-4 text-lg text-slate-600">Herramientas diseñadas para maximizar la rentabilidad de su flota cuidando el medio ambiente.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="flex flex-col items-center text-center hover:border-emerald-200 transition-colors">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Trazabilidad Total</h3>
                    <p className="text-slate-600 text-sm">Controle sus despachos, asigne unidades y reciba notificaciones en tiempo real sobre el estado de cada pedido.</p>
                </Card>
                <Card className="flex flex-col items-center text-center hover:border-emerald-200 transition-colors">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
                      <Leaf className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Medición de Carbono</h3>
                    <p className="text-slate-600 text-sm">Cuantifique la huella de carbono por ruta y vehículo para tomar decisiones más sostenibles y responsables.</p>
                </Card>
                <Card className="flex flex-col items-center text-center hover:border-emerald-200 transition-colors">
                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Optimización y Rentabilidad</h3>
                    <p className="text-slate-600 text-sm">Registre los costos operativos por viaje y evalúe la rentabilidad exacta de todas sus operaciones logísticas.</p>
                </Card>
              </div>
            </div>
          </div>
        </main>

        <footer className="bg-slate-900 py-8 border-t border-slate-800 text-center">
          <p className="text-slate-400 text-sm">© 2026 LogisCarbon MVP. Todos los derechos reservados.</p>
        </footer>
      </div>
    </section>
  )
}
