'use server'

import { prisma } from '../lib/prisma/prisma'
import { revalidatePath } from "next/cache"
import { createClient } from '@supabase/supabase-js'
import { Rol } from '@/types'


// 🔑 Cliente Admin (Para crear usuarios sin botarte de tu sesión)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
)

export async function registrarUsuarioAdmin(formData: FormData) {
  const nombre_completo = formData.get('nombre_completo') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const rol = formData.get('rol') as Rol

  try {
    // A) Creamos el usuario en la bóveda de Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirmado para que puedan entrar de frente
    })

    if (authError) throw new Error(authError.message)
    if (!authData.user) throw new Error("No se pudo crear el usuario en Auth.")

    // B) Creamos el perfil público en TU tabla de Prisma
    const nuevoUsuario = await prisma.usuario.create({
      data: {
        id: authData.user.id, // 👈 ¡Match perfecto con auth.users.id!
        nombre: nombre_completo, // 👈 Tu campo corregido
        email: email,
        rol: rol,       // Pasamos el Enum limpio
      }
    })

    // Refrescamos la vista donde tengas la tabla de usuarios
    revalidatePath('/users') 
    
    return { success: true, data: nuevoUsuario }

  } catch (error: any) {
    console.error("Error al registrar usuario:", error)
    return { error: error.message || "Fallo al crear el usuario en el sistema." }
  }
}

export async function ObtenerUsuarios() {
  try {
    const usuarios = await prisma.usuario.findMany({
      orderBy: {createdAt:'desc'}
    })
    return { success: true, data: usuarios }
  } catch (error:any) {
    console.error("Error al Obtenes usuraios:", error)
    return { error: error.message || "Fallo al traer a todos los usuarios." }
  }
  
}