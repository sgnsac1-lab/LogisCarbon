'use client'

import Link from "next/link"
import { 
  LayoutDashboard, 
  Settings, 
  Package, 
  Truck, 
  Map, 
  CircleDollarSign,
  Users,
  IdCard
} from "lucide-react"
import { usePathname } from "next/navigation"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Clientes", href: "/clientes", icon: IdCard },
  { name: "Pedidos", href: "/pedidos", icon: Package },
  { name: "Asignación Flota", href: "/flota", icon: Truck },
  { name: "Rentabilidad & CO2", href: "/rentabilidad", icon: CircleDollarSign },
  { name: "Parámetros", href: "/admin", icon: Settings },
  { name: "Usuarios", href: "/usuarios", icon: Users },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
     <div className="flex flex-col w-64 bg-slate-900 border-r border-slate-800">
      <div className="flex items-center justify-center h-16 px-4 bg-slate-950">
        <span className="text-lg font-bold text-emerald-400 tracking-tight">Logis<span className="text-white">Carbon</span></span>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                isActive 
                  ? "bg-emerald-500/10 text-emerald-400" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5 mr-3 shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <div className="text-xs text-slate-500 text-center">MVP Version 1.0</div>
      </div>
    </div>
  )
}
