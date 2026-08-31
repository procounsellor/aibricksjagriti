import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './i18n';
import AppRouter from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>
);

