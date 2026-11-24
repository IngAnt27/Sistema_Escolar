import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SidebarNav, type Rol } from '@/components/SidebarNav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await connection()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('nombres, apellidos, rol')
    .eq('id', user.id)
    .single()

  const rol = (perfil?.rol ?? 'docente') as Rol
  const nombreUsuario =
    `${perfil?.nombres || 'Usuario'} ${perfil?.apellidos || ''}`.trim()

  return (
    <div className="flex min-h-screen flex-col bg-[#F1F5F9] md:flex-row print:block print:bg-white">
      <SidebarNav nombreUsuario={nombreUsuario} rol={rol} />

      <div className="flex flex-1 flex-col pb-20 md:pb-0">
        <main className="flex-1 p-4 sm:p-8 print:m-0 print:w-full print:p-0">
          {children}
        </main>
      </div>
    </div>
  )
}