import './index.css';
// Sonner (toasts) default styles
// The package exposes the built CSS as `dist/styles.css`.
import 'sonner/dist/styles.css';

import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
