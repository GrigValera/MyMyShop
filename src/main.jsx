import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { createBrowserRouter, createHashRouter, RouterProvider } from 'react-router-dom';
import { isPortfolioDemo } from './shared/portfolioDemo.js';
import { store } from './app/store';
import App from './app/App';
import './shared/styles/global.css';
import './shared/styles/variables.css';
import './shared/lib/locales/i18n';

const createRouter = isPortfolioDemo ? createHashRouter : createBrowserRouter;
const router = createRouter([{ path: '*', element: <App /> }]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </React.StrictMode>
);
