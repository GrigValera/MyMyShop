import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

export const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, role } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};