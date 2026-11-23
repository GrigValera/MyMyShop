import { Outlet } from 'react-router-dom';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import ChatBot from '../../components/ChatBot/ChatBot';
import MobileNavigation from '../../components/MobileNavigation/MobileNavigation';
import styles from './MainLayout.module.css';

const MainLayout = () => {
  return (
    <div className={styles.layout}>
      <Header />
      {import.meta.env.MODE === 'portfolio' && <p style={{ margin: 0, padding: '0.65rem 1rem', background: '#262240', color: 'white', textAlign: 'center' }}>Демонстрационный магазин. Оплата и отправка заказов отключены.</p>}
      <main className={styles.main}>
        <div className="container">
          <Outlet />
        </div>
      </main>
      <Footer />
      {import.meta.env.MODE !== 'portfolio' && <ChatBot />}
      <MobileNavigation />
    </div>
  );
};

export default MainLayout;