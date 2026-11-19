import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // 1. Si no está autenticado y quiere entrar al dashboard, mandar al login
  if (!user && path.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 2. Si está autenticado y entra al login, mandar al dashboard
  if (user && path === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // 3. Control estricto por Roles (RBAC) dentro del dashboard
  if (user && path.startsWith('/dashboard')) {
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol, activo')
      .eq('id', user.id)
      .single()

    // Bloquear usuarios desactivados
    if (!perfil || !perfil.activo) {
      return NextResponse.redirect(new URL('/login?error=cuenta_inactiva', request.url))
    }

    // Reglas por ruta según el rol
    if (path.startsWith('/dashboard/pagos') && !['director', 'cajero'].includes(perfil.rol)) {
      return NextResponse.redirect(new URL('/dashboard?error=sin_permiso', request.url))
    }

    if (path.startsWith('/dashboard/usuarios') && perfil.rol !== 'director') {
      return NextResponse.redirect(new URL('/dashboard?error=sin_permiso', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
}