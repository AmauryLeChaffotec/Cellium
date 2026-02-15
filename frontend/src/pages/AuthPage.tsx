import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const { login, register, isLoading, error, clearError } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      await login(email, password);
    } else {
      await register(email, password, name);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    clearError();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-violet-100 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-200/20 rounded-full blur-3xl" />
      </div>

      <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-indigo-100/50 border border-white/60 w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl shadow-lg shadow-indigo-200/50 mb-4">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18M10 3v18M14 3v18M3 6a3 3 0 013-3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Cellium</h1>
          <p className="text-sm text-gray-500 mt-1.5">
            {isLogin ? 'Connectez-vous a votre compte' : 'Creez votre compte'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-600 mb-1.5">
                Nom
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
                className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 outline-none placeholder:text-gray-400"
                placeholder="Votre nom"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 outline-none placeholder:text-gray-400"
              placeholder="vous@exemple.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-600 mb-1.5">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 outline-none placeholder:text-gray-400"
              placeholder={isLogin ? 'Votre mot de passe' : '6 caracteres minimum'}
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-2.5 rounded-xl border border-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-200/50 hover:shadow-lg hover:shadow-indigo-300/50 active:scale-[0.98]"
          >
            {isLoading
              ? 'Chargement...'
              : isLogin
                ? 'Se connecter'
                : "S'inscrire"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={toggleMode}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            {isLogin
              ? "Pas encore de compte ? S'inscrire"
              : 'Deja un compte ? Se connecter'}
          </button>
        </div>
      </div>
    </div>
  );
}
