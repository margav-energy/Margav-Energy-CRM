import React, { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';
import OfflineModeIndicator from './OfflineModeIndicator';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap: { [key: string]: string } = {
      'agent': 'Agent',
      'qualifier': 'Qualifier',
      'salesrep': 'Sales Rep',
      'admin': 'Admin',
      'canvasser': 'Canvasser',
      'staff4dshire': 'Staff4dshire',
    };
    return roleMap[role] || role;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      {/* Navigation */}
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Logo size="sm" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                CRM System
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block text-sm text-gray-700">
                Welcome, <span className="font-semibold text-gray-900">{user?.first_name} {user?.last_name}</span>
                <span className="ml-2 px-3 py-1 bg-gradient-to-r from-green-100 to-blue-100 text-green-800 rounded-full text-xs font-medium">
                  {getRoleDisplayName(user?.role || '')}
                </span>
              </div>
              {user?.role === 'canvasser' && (
                <button
                  onClick={() => navigate('/canvasser')}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 shadow-md"
                >
                  canvasser
                </button>
              )}
              <button
                onClick={handleLogout}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 shadow-md"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Offline Mode Indicator */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <OfflineModeIndicator showDetails={true} className="mb-4" />
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
