'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter()
  const [cargando, setCargando] = useState(false)

  async function cerrarSesion() {
    setCargando(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={cerrarSesion}
      disabled={cargando}
      title="Cerrar sesión"
      className={
        compact
          ? 'flex items-center justify-center rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50'
          : 'mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-50'
      }
    >
      <LogOut className="h-4 w-4" />
      {!compact && <span>{cargando ? 'Saliendo...' : 'Cerrar sesión'}</span>}
    </button>
  )
}