import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { UserCircleIcon, LockClosedIcon, EyeIcon, EyeSlashIcon, MoonIcon, SunIcon } from '@heroicons/react/24/outline';

export default function Login() {
  const [mode, setMode] = useState('student');
  const [regd_no, setRegdNo] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'admin') {
        const { data } = await api.post('/auth/login/admin', { email, password });
        login(data.token, data.user);
        toast.success('Welcome back!');
        navigate('/admin');
      } else {
        const { data } = await api.post('/auth/login/student', { regd_no, password });
        login(data.token, data.user);
        toast.success('Welcome back!');
        navigate('/student');
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-r from-purple-700 via-purple-600 to-pink-500 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative">
      <button
        type="button"
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 border border-white/30"
        aria-label={isDark ? 'Light mode' : 'Dark mode'}
      >
        {isDark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
      </button>
      <div className="w-full max-w-md">
        <div className="bg-white/20 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 dark:border-slate-600 p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-full bg-white/30 flex items-center justify-center border-2 border-white/50 mb-4 overflow-hidden">
              {!logoError ? (
                <img src="/logo.png" alt="Bapatla Ladies Hostel" className="w-full h-full object-cover" onError={() => setLogoError(true)} />
              ) : (
                <UserCircleIcon className="w-16 h-16 text-white" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-white text-center tracking-tight">Bapatla Ladies Hostel</h1>
            <p className="text-white/90 text-sm mt-1">Secure Dashboard Login</p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-white/90 mb-2">User Type</label>
            <div className="bg-white/20 rounded-lg px-4 py-3 text-white border border-white/30 flex items-center justify-between">
              <span>{mode === 'admin' ? 'Staff (Admin)' : 'Student'}</span>
              <button type="button" onClick={() => setMode(mode === 'student' ? 'admin' : 'student')} className="text-white/90 text-sm hover:text-white underline">Switch</button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'student' ? (
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">Registration Number</label>
                <div className="relative">
                  <UserCircleIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/80" />
                  <input
                    type="text"
                    value={regd_no}
                    onChange={(e) => setRegdNo(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 focus:border-white/50"
                    placeholder="e.g. Y22AIT402"
                    required
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">Username / Email</label>
                <div className="relative">
                  <UserCircleIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/80" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 focus:border-white/50"
                    placeholder="admin@hostel.edu"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">Password</label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/80" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 focus:border-white/50"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/80 hover:text-white"
                >
                  {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && <p className="text-red-200 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-cyan-400 text-white font-semibold rounded-lg shadow-lg hover:from-blue-700 hover:to-cyan-500 transition disabled:opacity-70"
            >
              {loading ? 'Signing in...' : 'Login to Dashboard'}
            </button>
          </form>

          <div className="text-center mt-6">
            <a href="#" className="text-white/90 text-sm hover:text-white">Forgot Password?</a>
          </div>
        </div>
      </div>
    </div>
  );
}
