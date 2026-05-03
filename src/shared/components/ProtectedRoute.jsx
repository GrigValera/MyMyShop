import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Loader } from '../ui';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, role, loading } = useSelector((state) => state.auth);

  // Ждём восстановления сессии
  if (loading) {
    return <Loader fullPage />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;