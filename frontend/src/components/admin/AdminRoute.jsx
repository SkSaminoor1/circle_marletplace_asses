import { useState } from 'react';

export default function AdminRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('isAdminLoggedIn') === 'true'
  );
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin0') {
      localStorage.setItem('isAdminLoggedIn', 'true');
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Invalid username or password. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAdminLoggedIn');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl border border-gray-150 shadow-xl shadow-gray-200/50">
          <div className="text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 text-white font-bold text-xl mx-auto shadow-md shadow-brand-500/20">
              A
            </span>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 tracking-tight">Admin Portal</h2>
            <p className="mt-2 text-sm text-gray-500">
              Sign in to manage category schemas and parameters.
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold flex items-center gap-2">
                <svg className="h-4 w-4 shrink-0 text-rose-650" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4 rounded-md shadow-sm">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-sm outline-none transition-all"
                  placeholder="admin"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-sm outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="group relative flex w-full justify-center rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-brand-500/10 hover:bg-brand-500 hover:shadow-brand-500/25 active:scale-[0.98] transition-all"
              >
                Sign In
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Admin Top-bar with logout option */}
      <div className="bg-brand-900 text-brand-100 py-2.5 px-4 sm:px-6 lg:px-8 flex justify-between items-center text-xs border-b border-brand-850">
        <div className="flex items-center gap-2 font-semibold">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Logged in as System Administrator</span>
        </div>
        <button
          onClick={handleLogout}
          className="px-2.5 py-1 bg-brand-800 hover:bg-brand-700 text-white font-bold rounded transition-colors"
        >
          Logout Admin
        </button>
      </div>
      {children}
    </div>
  );
}
