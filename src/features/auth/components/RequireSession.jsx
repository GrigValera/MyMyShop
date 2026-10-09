import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectHasSession } from '../store/authSlice';

export default function RequireSession() {
  return useSelector(selectHasSession) ? <Outlet /> : <Navigate to="/login" replace />;
}
