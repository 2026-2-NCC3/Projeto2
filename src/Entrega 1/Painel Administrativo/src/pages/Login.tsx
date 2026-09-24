import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { fazerLogin, salvarSessao, type UsuarioAutenticado } from '../services/api';

interface LoginProps {
  onLogin: (usuario: UsuarioAutenticado) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { email?: string; password?: string } = {};
    if (!email.trim()) newErrors.email = 'Informe o e-mail';
    if (!password.trim()) newErrors.password = 'Informe a senha';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const resposta = await fazerLogin(email, password);

      if (resposta.usuario.papel === 'aluno') {
        setErrors({ form: 'Este acesso é exclusivo para administradores.' });
        return;
      }

      salvarSessao(resposta.token, resposta.usuario, remember);
      onLogin(resposta.usuario);
    } catch (erro) {
      setErrors({
        form: erro instanceof Error ? erro.message : 'Não foi possível entrar.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mb-3 shadow-lg">
          <span className="text-white font-bold text-lg">PE</span>
        </div>
        <h1 className="text-xl font-semibold text-gray-900">Próxima Etapa</h1>
        <p className="text-sm text-gray-500 mt-0.5">Painel Administrativo</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm w-full max-w-sm p-8">
        <h2 className="text-base font-semibold text-gray-900 mb-6">Entrar na sua conta</h2>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: undefined })); }}
              placeholder="admin@proxima-etapa.com"
              className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
              Senha
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={e => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: undefined })); }}
                placeholder="••••••••"
                className={`w-full px-3 py-2.5 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password}</p>
            )}
          </div>

          {/* Remember */}
          <div className="flex items-center gap-2">
            <input
              id="remember"
              type="checkbox"
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer select-none">
              Manter conectado
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Entrando…
              </>
            ) : 'Entrar'}
          </button>
          {errors.form && (
            <p className="text-sm text-red-600 text-center" role="alert">{errors.form}</p>
          )}
        </form>

        <div className="mt-4 text-center">
          <button className="text-sm text-blue-600 hover:underline">
            Esqueci minha senha
          </button>
        </div>
      </div>

      <p className="mt-6 text-xs text-gray-400">
        Próxima Etapa © {new Date().getFullYear()} — Uso restrito a administradores
      </p>
    </div>
  );
}
