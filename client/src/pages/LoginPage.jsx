import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { BookOpen, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

export default function LoginPage() {
  const { login }  = useAuth()
  const navigate   = useNavigate()
  const { state }  = useLocation()
  const from       = state?.from?.pathname || '/'
  const [form, setForm]       = useState({ email: '', password: '' })
  const [show, setShow]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async e => {
    e.preventDefault(); setError(''); setLoading(true)
    try { await login(form); navigate(from, { replace: true }) }
    catch (err) { setError(err.response?.data?.message || 'Email ou mot de passe incorrect') }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-ink-50 dark:bg-ink-950">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-5">
            <div className="w-9 h-9 rounded-xl bg-ink-900 dark:bg-ink-100 flex items-center justify-center">
              <BookOpen size={18} className="text-ink-50 dark:text-ink-900" />
            </div>
            <span className="font-display text-xl font-semibold">Blog</span>
          </Link>
          <h1 className="font-display text-2xl font-bold text-ink-900 dark:text-ink-50 mb-1">Bon retour !</h1>
          <p className="text-sm text-ink-500">Connectez-vous pour continuer</p>
        </div>

        <div className="card p-6 sm:p-8 shadow-sm">
          {error && (
            <div className="flex items-center gap-2.5 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 mb-5 text-sm">
              <AlertCircle size={15} className="shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                <input name="email" type="email" required autoComplete="email"
                  value={form.email} onChange={handle} placeholder="vous@exemple.com"
                  className="input pl-10" />
              </div>
            </div>

            <div>
              <label className="label">Mot de passe</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                <input name="password" type={show ? 'text' : 'password'} required autoComplete="current-password"
                  value={form.password} onChange={handle} placeholder="••••••••"
                  className="input pl-10 pr-10" />
                <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 dark:hover:text-ink-200 transition-colors">
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-2 rounded-xl text-base">
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          <p className="text-center text-sm text-ink-500 mt-5">
            Pas de compte ?{' '}
            <Link to="/signup" className="text-amber-600 hover:text-amber-700 font-semibold">S'inscrire</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
