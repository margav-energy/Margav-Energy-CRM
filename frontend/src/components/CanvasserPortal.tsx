import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import CanvasserLogin from './CanvasserLogin';
import CanvasserForm from './CanvasserForm';

const CanvasserPortal: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <CanvasserLogin onLoginSuccess={() => {}} />;
  }

  return <CanvasserForm />;
};

export default CanvasserPortal;
