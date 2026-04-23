import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, Mail, Lock, User, Eye, EyeOff, AlertCircle, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

const RULES = [
  { test: p => p.length >= 8,   label: '8 caractères' },
  { test: p => /[A-Z]/.test(p), label: 'Majuscule' },
  { test: p => /[a-z]/.test(p), label: 'Minuscule' },
  { test: p => /\d/.test(p),    label: 'Chiffre' },
]

export default function SignupPage() {
  const { register } = useAuth()
  const navigate     = useNavigate()
  const [form, setForm]       = useState({ username: '', email: '', full_name: '', password: '' })
  const [show, setShow]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async e => {
    e.preventDefault(); setError('')
    const fail = RULES.filter(r => !r.test(form.password))
    if (fail.length) { setError('Mot de passe invalide : ' + fail.map(r => r.label).join(', ')); return }
    setLoading(true)
    try { await register(form); navigate('/') }
    catch (err) {
      const errs = err.response?.data?.errors
      setError(errs ? errs.map(e => e.msg).join(' — ') : err.response?.data?.message || "Erreur d'inscription")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-ink-50 dark:bg-ink-950">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-5">
            <div className="w-9 h-9 rounded-xl bg-ink-900 dark:bg-ink-100 flex items-center justify-center">
              <BookOpen size={18} className="text-ink-50 dark:text-ink-900" />
            </div>
            <span className="font-display text-xl font-semibold">Blog</span>
          </Link>
          <h1 className="font-display text-2xl font-bold text-ink-900 dark:text-ink-50 mb-1">Créer un compte</h1>
          <p className="text-sm text-ink-500">Rejoignez la communauté Blog</p>
        </div>

        <div className="card p-6 sm:p-8 shadow-sm">
          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 mb-5 text-sm">
              <AlertCircle size={15} className="shrink-0 mt-0.5" /> {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Nom complet</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                <input name="full_name" value={form.full_name} onChange={handle}
                  placeholder="Marie Dupont" className="input pl-10" />
              </div>
            </div>

            <div>
              <label className="label">Nom d'utilisateur <span className="text-red-500 normal-case">*</span></label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 text-sm pointer-events-none">@</span>
                <input name="username" required value={form.username} onChange={handle}
                  placeholder="marie_dupont" className="input pl-8" minLength={3} maxLength={50} />
              </div>
            </div>

            <div>
              <label className="label">Email <span className="text-red-500 normal-case">*</span></label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                <input name="email" type="email" required value={form.email} onChange={handle}
                  placeholder="vous@exemple.com" className="input pl-10" />
              </div>
            </div>

            <div>
              <label className="label">Mot de passe <span className="text-red-500 normal-case">*</span></label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                <input name="password" type={show ? 'text' : 'password'} required value={form.password} onChange={handle}
                  placeholder="••••••••" className="input pl-10 pr-10" />
                <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 dark:hover:text-ink-200 transition-colors">
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {form.password && (
                <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                  {RULES.map((r, i) => (
                    <div key={i} className={`flex items-center gap-1.5 text-xs transition-colors ${r.test(form.password) ? 'text-green-600 dark:text-green-400' : 'text-ink-400'}`}>
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${r.test(form.password) ? 'bg-green-100 dark:bg-green-900/40' : 'bg-ink-100 dark:bg-ink-800'}`}>
                        {r.test(form.password) && <Check size={9} strokeWidth={3} />}
                      </div>
                      {r.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-2 rounded-xl text-base">
              {loading ? 'Création…' : 'Créer mon compte'}
            </button>
          </form>

          <p className="text-center text-sm text-ink-500 mt-5">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-amber-600 hover:text-amber-700 font-semibold">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
