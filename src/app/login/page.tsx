'use client'

import { Lock, Mail, Leaf } from "lucide-react"
import { useRouter } from 'next/navigation'
import { Button } from '../../components/ui/Button'
import { loginAction } from "@/actions/loginAction"

export default function page() {
  const router = useRouter()

  const handleLogin = async(e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    try {
        const result = await loginAction(formData)
        if(result.error){
            alert(result.error)
        }else{
            router.push("/dashboard")
        }
    } catch (error) {
        alert(error)
    }
  }

  return (
    <section>
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <div className="inline-flex items-center justify-center p-3 bg-emerald-100 rounded-xl text-emerald-600 mb-4">
                <Leaf className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                Iniciar Sesión
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                Panel de Logística y Trazabilidad de Carbono
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-slate-200">
                <form className="space-y-6" onSubmit={handleLogin}>
                    <div>
                    <label className="block text-sm font-medium text-slate-700">
                        Correo electrónico
                    </label>
                    <div className="mt-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                        name="email"
                        type="email"
                        required
                        className="appearance-none block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                        placeholder="admin@logiscarbon.com"
                        />
                    </div>
                    </div>

                    <div>
                    <label className="block text-sm font-medium text-slate-700">
                        Contraseña
                    </label>
                    <div className="mt-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                        name="password"
                        type="password"
                        required
                        className="appearance-none block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                        placeholder="••••••••"
                        />
                    </div>
                    </div>

                    <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                        />
                        <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-900">
                        Recordarme
                        </label>
                    </div>

                    <div className="text-sm">
                        <a href="#" className="font-medium text-emerald-600 hover:text-emerald-500">
                        ¿Olvidó su contraseña?
                        </a>
                    </div>
                    </div>

                    <div>
                    <Button type="submit" className="w-full">
                        Ingresar
                    </Button>
                    </div>
                </form>
                </div>
            </div>
            </div>
    </section>
  )
}