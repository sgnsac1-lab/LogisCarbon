import Usuarios from "./Usuarios"
import { ObtenerUsuarios } from "@/actions/usuarios.actions"

export default async function page() {
  const response = await ObtenerUsuarios()
  if(!response.success){
    return(
      <div>Hubo un error</div>
    )
  }
  const listaUsuarios = response.data || []

  return <Usuarios usuarios={listaUsuarios} />
}
