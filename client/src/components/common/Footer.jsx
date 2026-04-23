import React from 'react'
import { Link } from 'react-router-dom'
import { BookOpen } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-ink-100 dark:border-ink-800 bg-white dark:bg-ink-900 mt-20 mb-16 md:mb-0">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-5">
        <Link to="/" className="flex items-center gap-2 text-ink-800 dark:text-ink-200">
          <div className="w-6 h-6 rounded bg-ink-900 dark:bg-ink-100 flex items-center justify-center">
            <BookOpen size={12} className="text-ink-50 dark:text-ink-900" />
          </div>
          <span className="font-display font-semibold">Blog</span>
        </Link>
        <p className="text-xs text-ink-400 text-center">
          © {new Date().getFullYear()} Blog — Plateforme de lecture intelligente.
        </p>
        <div className="flex items-center gap-5 text-xs text-ink-400">
          <Link to="/"       className="hover:text-ink-700 dark:hover:text-ink-200 transition-colors">Accueil</Link>
          <Link to="/login"  className="hover:text-ink-700 dark:hover:text-ink-200 transition-colors">Connexion</Link>
          <Link to="/signup" className="hover:text-ink-700 dark:hover:text-ink-200 transition-colors">S'inscrire</Link>
        </div>
      </div>
    </footer>
  )
}
