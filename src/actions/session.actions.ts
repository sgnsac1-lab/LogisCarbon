'use server'

import { createClient } from "../lib/supabase/server"
import { prisma } from '../lib/prisma/prisma'

export async function getSessionUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Buscamos en nuestra tabla personalizada
  return await prisma.usuario.findUnique({
    where: { id: user.id },
  });
}