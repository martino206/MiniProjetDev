import React from 'react'

export function Spinner({ size = 'md', className = '' }) {
  const s = { sm: 'w-4 h-4 border-[2px]', md: 'w-6 h-6 border-2', lg: 'w-10 h-10 border-[3px]' }
  return <div className={`${s[size]} border-ink-200 dark:border-ink-700 border-t-amber-500 rounded-full animate-spin ${className}`} />
}

export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
      <Spinner size="lg" />
      <p className="text-sm text-ink-400 font-body animate-pulse">Chargement…</p>
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-ink-100 dark:bg-ink-800 flex items-center justify-center mb-5">
          <Icon size={28} className="text-ink-400" />
        </div>
      )}
      <h3 className="font-display text-xl font-semibold text-ink-800 dark:text-ink-200 mb-2">{title}</h3>
      {description && <p className="text-sm text-ink-500 mb-6 max-w-xs leading-relaxed">{description}</p>}
      {action}
    </div>
  )
}

export function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-xl text-sm font-medium anim-fade-up ${type === 'success' ? 'bg-ink-900 dark:bg-ink-100 text-white dark:text-ink-900' : 'bg-red-600 text-white'}`}>
      {message}
    </div>
  )
}
