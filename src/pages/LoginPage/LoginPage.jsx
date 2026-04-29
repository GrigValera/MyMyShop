import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoginForm from '../../features/auth/components/LoginForm';

const LoginPage = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'var(--bg-secondary)'
    }}>
      <LoginForm />
    </div>
  );
};

export default LoginPage;