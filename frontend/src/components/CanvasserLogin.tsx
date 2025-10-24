import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface CanvasserLoginProps {
  onLoginSuccess: () => void;
}

const CanvasserLogin: React.FC<CanvasserLoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(username, password);
      onLoginSuccess();
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3333cc] via-[#33cc66] to-[#00cc99] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black opacity-10"></div>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white rounded-full opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white rounded-full opacity-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white rounded-full opacity-5 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4 shadow-lg">
            <span className="text-3xl">🏠</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Margav Energy</h1>
          <p className="text-white/80 text-lg">Canvas Team Lead Sheet Portal</p>
        </div>

        {/* Login Form */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400">👤</span>
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3333cc] focus:border-transparent transition-all duration-200 text-black"
                  placeholder="Enter your username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400">🔒</span>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3333cc] focus:border-transparent transition-all duration-200 text-black"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center">
                <span className="mr-2">⚠️</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#3333cc] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#2a2a99] focus:ring-2 focus:ring-[#3333cc] focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing In...
                </>
              ) : (
                <>
                  <span className="mr-2">🚀</span>
                  Sign In to Canvas Portal
                </>
              )}
            </button>
          </form>

          {/* Features Preview */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            {/* <h3 className="text-sm font-semibold text-black mb-3">Canvasser Features:</h3>
            <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
              <div className="flex items-center">
                <span className="mr-2">📷</span>
                Photo Capture
              </div>
              <div className="flex items-center">
                <span className="mr-2">✍️</span>
                Digital Signature
              </div>
              <div className="flex items-center">
                <span className="mr-2">📶</span>
                Offline Mode
              </div>
              <div className="flex items-center">
                <span className="mr-2">🔄</span>
                Auto Sync
              </div>
            </div> */}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-white/70 text-sm">
            Margav Energy CRM - Canvas Team Lead Sheet Portal
          </p>
        </div>
      </div>
    </div>
  );
};

export default CanvasserLogin;
