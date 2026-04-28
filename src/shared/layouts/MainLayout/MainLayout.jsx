import { Outlet } from 'react-router-dom';
import { Header } from '../../components/Header/Header';
import { Footer } from '../../components/Footer/Footer';
import { ChatBot } from '../../components/ChatBot/ChatBot';
import styles from './MainLayout.module.css';

export const MainLayout = () => {
  return (
    <div className={styles.layout}>
      <Header />
      <main className={styles.main}>
        <div className="container">
          <Outlet />
        </div>
      </main>
      <Footer />
      <ChatBot />
    </div>
  );
};