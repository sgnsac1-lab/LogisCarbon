import Dashboard from "./Dashboard"
import { obtenerDatosDashboard } from "@/actions/dashboard.actions"

export default async function page() {
  const response = await obtenerDatosDashboard()
  if(!response){
    return(
      <div>Hubo un error</div>
    )
  }
  const data = response
  return <Dashboard datos={data} />
}
