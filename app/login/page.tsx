'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  GraduationCap,
  Lock,
  Mail,
  AlertCircle,
  Eye,
  EyeOff,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  CreditCard,
  BellRing,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { loginSchema, type LoginInput } from '@/lib/validations/escolar'

export default function LoginPage() {
  const router = useRouter()
  const [errorAuth, setErrorAuth] = useState<string | null>(null)
  const [verPassword, setVerPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(datos: LoginInput) {
    setErrorAuth(null)
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email: datos.email,
      password: datos.password,
    })

    if (error) {
      setErrorAuth('Correo o contraseña incorrectos.')
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F1F5F9] p-4 sm:p-6">
      {/* Inyección de estilos de animación para las órbitas de los íconos */}
      <style jsx global>{`
        @keyframes orbit {
          from {
            transform: rotate(0deg) translateX(95px) rotate(0deg);
          }
          to {
            transform: rotate(360deg) translateX(95px) rotate(-360deg);
          }
        }
        .animate-orbit-1 { animation: orbit 24s linear infinite; }
        .animate-orbit-2 { animation: orbit 24s linear infinite; animation-delay: -6s; }
        .animate-orbit-3 { animation: orbit 24s linear infinite; animation-delay: -12s; }
        .animate-orbit-4 { animation: orbit 24s linear infinite; animation-delay: -18s; }
      `}</style>

      <div className="grid w-full max-w-md overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/70 lg:max-w-5xl lg:grid-cols-12">
        {/* Panel izquierdo institucional (solo escritorio) */}
        <section className="relative hidden flex-col justify-between overflow-hidden bg-[#0f172a] p-10 text-white lg:col-span-6 lg:flex">
          {/* Detalles sutiles de profundidad */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-emerald-500/15 blur-3xl" />

          {/* Marca / Nombre del sistema: KORA */}
          <div className="relative flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-600/30">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <span className="block text-2xl font-black tracking-wider text-white">
                KORA
              </span>
              <span className="text-xs text-slate-400">
                Sistema de Control Escolar Inteligente
              </span>
            </div>
          </div>

          {/* Área de la animación de las órbitas y ondas de pulso */}
          <div className="relative flex-1 flex flex-col items-center justify-center my-8">
            <div className="relative flex h-72 w-72 items-center justify-center">
              
              {/* Ondas de pulso concéntricas */}
              <div className="absolute h-48 w-48 animate-pulse rounded-full border border-blue-500/10" />
              <div className="absolute h-56 w-56 animate-pulse rounded-full border border-blue-500/20 [animation-delay:0.5s]" />
              <div className="absolute h-64 w-64 animate-pulse rounded-full border border-emerald-500/15 [animation-delay:1s]" />
              <div className="absolute h-72 w-72 animate-pulse rounded-full border border-blue-500/10 [animation-delay:1.5s]" />

              {/* Logo Central */}
              <div className="relative z-10 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 shadow-2xl ring-4 ring-blue-500/30">
                <div className="absolute inset-0.5 rounded-full bg-gradient-to-tr from-blue-600/30 to-emerald-500/20 blur-md" />
                <GraduationCap className="relative h-14 w-14 text-blue-400 filter drop-shadow-[0_0_15px_rgba(59,130,246,0.6)] animate-bounce [animation-duration:4s]" />
              </div>

              {/* Íconos orbitando alrededor del logo central */}
              {/* Órbita 1: Escáner QR */}
              <div className="animate-orbit-1 absolute flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800/90 text-blue-400 shadow-lg ring-1 ring-slate-700/80 transition-transform duration-200">
                <QrCode className="h-5 w-5" />
              </div>

              {/* Órbita 2: Asistencia registrada */}
              <div className="animate-orbit-2 absolute flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800/90 text-emerald-400 shadow-lg ring-1 ring-slate-700/80 transition-transform duration-200">
                <CheckCircle2 className="h-5 w-5" />
              </div>

              {/* Órbita 3: Pagos */}
              <div className="animate-orbit-3 absolute flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800/90 text-amber-400 shadow-lg ring-1 ring-slate-700/80 transition-transform duration-200">
                <CreditCard className="h-5 w-5" />
              </div>

              {/* Órbita 4: Alertas WhatsApp */}
              <div className="animate-orbit-4 absolute flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800/90 text-rose-400 shadow-lg ring-1 ring-slate-700/80 transition-transform duration-200">
                <BellRing className="h-5 w-5" />
              </div>

            </div>
            
            <p className="mt-2 text-xs font-medium tracking-wide text-blue-400/80 uppercase">
              Sincronización en tiempo real
            </p>
          </div>

          {/* Pie de seguridad */}
          <div className="relative flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Acceso protegido por roles y políticas de seguridad</span>
          </div>
        </section>

        {/* Panel derecho: Formulario de acceso */}
        <section className="flex flex-col justify-center p-7 sm:p-10 lg:col-span-6 lg:p-12">
          {/* Encabezado */}
          <div className="mb-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-between lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-600/25">
                <GraduationCap className="h-6 w-6" />
              </div>
              <span className="text-2xl font-black tracking-wider text-slate-900 pl-3">
                KORA
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Bienvenido de nuevo
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Ingresa con tu cuenta institucional para continuar en KORA
            </p>
          </div>

          {/* Alerta de error */}
          {errorAuth && (
            <div className="mb-6 flex items-center gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{errorAuth}</span>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="docente@colegio.edu.gt"
                  {...register('email')}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3 pl-10 pr-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type={verPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password')}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3 pl-10 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
                />
                <button
                  type="button"
                  onClick={() => setVerPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:bg-slate-200/70 hover:text-slate-700"
                  aria-label={verPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {verPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:from-blue-700 hover:to-blue-800 active:scale-[0.99] disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Ingresando...</span>
                </>
              ) : (
                <>
                  <span>Iniciar sesión en KORA</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}