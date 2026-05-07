'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../lib/supabase/client'

// Force dynamic rendering to avoid Supabase client errors during build
export const dynamic = 'force-dynamic'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="bg-card p-8 rounded-lg shadow-lg border border-border">
      <h1 className="text-h2 mb-6 text-center">Connexion à Vigens</h1>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 bg-background border border-border rounded-sm focus-ring"
            placeholder="vous@exemple.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-2">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full px-4 py-2 bg-background border border-border rounded-sm focus-ring"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <div className="text-error text-sm p-3 bg-error/10 rounded-sm border border-error/20">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-accent-blue text-white rounded-sm font-medium hover:bg-accent-blue/90 focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        Pas encore de compte ?{' '}
        <Link href="/signup" className="text-accent-blue hover:underline">
          Créer un compte
        </Link>
      </p>
    </div>
  )
}
