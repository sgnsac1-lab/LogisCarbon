'use client'

import { Bell, User, LogOut } from "lucide-react"
import { cerrarSesion } from "@/actions/logOut.actions"
import { Usuario } from "@/types"

interface Props{
  usuario: Usuario
}

export default function Topbar({usuario}: Props) {

  return (
     <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-slate-200 shrink-0">
      <div className="flex items-center flex-1">
        <h1 className="text-xl font-semibold text-slate-800 hidden sm:block">
          Sistema de Optimización Logística
        </h1>
      </div>
      <div className="flex items-center space-x-4">
        <button className="relative p-2 text-slate-400 hover:text-slate-500 transition-colors">
          <span className="absolute top-1.5 right-1.5 block w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
          <Bell className="w-6 h-6" />
        </button>
        <div className="flex items-center space-x-3 pl-4 border-l border-slate-200">
          <div className="flex flex-col text-right sm:flex">
            <span className="text-sm font-medium text-slate-700">{usuario.nombre}</span>
            <span className="text-xs text-slate-500">{usuario.rol}</span>
          </div>
          <div className="flex items-center justify-center w-9 h-9 bg-emerald-100 rounded-full text-emerald-600">
            <User className="w-5 h-5" />
          </div>
          <button 
            onClick={cerrarSesion}
            className="ml-2 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors rounded-lg"
            title="Cerrar Sessión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  )
}
