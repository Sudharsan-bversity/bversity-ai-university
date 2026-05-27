import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ToolsPage from './ToolsPage';

const isTools = window.location.pathname === '/tools';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {isTools ? <ToolsPage /> : <App />}
  </React.StrictMode>
);