import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setErrorMessage(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setErrorMessage('Email o contraseña incorrectos.')
      setSubmitting(false)
      return
    }

    navigate('/', { replace: true })
  }

  return (
    <main className="flex min-h-screen min-h-dvh items-center justify-center bg-background px-6 py-10 text-foreground">
      <div className="w-full max-w-[440px]">
        <p className="text-center text-lg font-semibold tracking-wide text-navy">
          DaiFlow
        </p>

        <section className="mt-6 rounded-card border border-border bg-surface p-6 shadow-card">
          <h1 className="text-2xl font-semibold tracking-tight text-navy">
            Iniciar sesión
          </h1>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="text-sm font-semibold text-foreground"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 min-h-12 w-full rounded-control border border-border bg-background px-4 text-base text-foreground outline-none transition-shadow placeholder:text-muted-foreground focus-visible:border-mint focus-visible:ring-2 focus-visible:ring-mint/30"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="text-sm font-semibold text-foreground"
              >
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 min-h-12 w-full rounded-control border border-border bg-background px-4 text-base text-foreground outline-none transition-shadow placeholder:text-muted-foreground focus-visible:border-mint focus-visible:ring-2 focus-visible:ring-mint/30"
              />
            </div>

            {errorMessage ? (
              <p
                role="alert"
                className="rounded-control border border-coral/25 bg-coral/10 px-4 py-3 text-sm font-medium text-navy"
              >
                {errorMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="min-h-12 w-full rounded-button bg-mint px-5 py-3 font-semibold text-navy transition-colors hover:bg-mint/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:cursor-not-allowed disabled:opacity-60"
            >
              Entrar
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}

export default LoginPage
