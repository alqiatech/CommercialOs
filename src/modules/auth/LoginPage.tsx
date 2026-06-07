import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ActionButton } from '@/components/ui/ActionButton'
import { logEvent } from '@/lib/utils'
import { Eye, EyeOff } from 'lucide-react'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email) { setError('El correo es requerido.'); return }
    if (!password) { setError('La contraseña es requerida.'); return }
    if (!email.includes('@')) { setError('Ingresa un correo válido.'); return }

    setLoading(true)
    logEvent('auth.login_attempted', { email })

    await new Promise(r => setTimeout(r, 1200))

    // Mock: cualquier credencial entra
    logEvent('auth.login_success', { email })
    navigate('/app')
  }

  return (
    <div className="min-h-screen bg-gradient-alqia flex items-center justify-center p-4">
      {/* Gradiente de fondo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-alqia-copper/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-alqia-info/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img
            src="/Logoalqiacomosblanco.png"
            alt="Alqia Commercial OS"
            className="h-40 w-auto object-contain mb-4"
          />
          <p className="text-sm text-alqia-secondary mt-1">Sistema operativo comercial inteligente</p>
        </div>

        {/* Card */}
        <div className="bg-white/[0.06] border border-white/10 rounded-xl2 p-7 backdrop-blur-sm shadow-glass">
          <h2 className="text-base font-medium text-white mb-1">Ingresar al sistema</h2>
          <p className="text-xs text-alqia-muted mb-6">Sistema operativo comercial inteligente para convertir datos, leads y seguimiento en ingresos accionables.</p>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-alqia-secondary">Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@grupodemo.mx"
                className="bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-alqia-muted focus:outline-none focus:border-alqia-copper/50 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-alqia-secondary">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2.5 pr-10 text-sm text-white placeholder:text-alqia-muted focus:outline-none focus:border-alqia-copper/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-alqia-muted hover:text-alqia-secondary transition-colors"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-alqia-risk/10 border border-alqia-risk/20 rounded-lg px-3 py-2">
                <p className="text-xs text-alqia-risk">{error}</p>
              </div>
            )}

            <ActionButton
              type="submit"
              variant="copper"
              size="md"
              loading={loading}
              className="w-full justify-center mt-1"
            >
              Ingresar
            </ActionButton>
          </form>

          <div className="mt-4 text-center">
            <button className="text-xs text-alqia-muted hover:text-alqia-secondary transition-colors">
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] text-alqia-muted mt-6">
          Alqia Commercial OS · Alqia Tech © 2026 · Marca registrada en trámite
        </p>
      </div>
    </div>
  )
}
