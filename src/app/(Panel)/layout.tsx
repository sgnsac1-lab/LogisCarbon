
import Sidebar from "@/components/layout/Sidebar"
import Topbar from "@/components/layout/Topbar"
import { getSessionUser } from "@/actions/session.actions";
import { cerrarSesion } from "@/actions/logOut.actions";

export default async function layout({children,}: Readonly<{children: React.ReactNode;}>) {
  const usuario = await getSessionUser()

  if (!usuario) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 font-sans text-slate-900">
        <div className="max-w-md text-center space-y-4 p-6">
          <h1 className="text-lg font-semibold text-slate-800">Sesión sin perfil de usuario</h1>
          <p className="text-sm text-slate-500">
            Tu cuenta no tiene un perfil asociado en el sistema. Contacta al administrador.
          </p>
          <form action={cerrarSesion}>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (usuario.activo === false) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 font-sans text-slate-900">
        <div className="max-w-md text-center space-y-4 p-6">
          <h1 className="text-lg font-semibold text-slate-800">Usuario inactivo</h1>
          <p className="text-sm text-slate-500">
            Tu cuenta está inactiva. Contacta al administrador para habilitar el acceso.
          </p>
          <form action={cerrarSesion}>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      <Sidebar rol={usuario.rol} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar usuario={usuario} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
