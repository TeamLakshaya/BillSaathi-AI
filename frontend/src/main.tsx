import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Import existing CSS design system tokens and stylesheets
import './styles/variables.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/stepper.css';
import './styles/tables.css';
import './styles/views.css';
import './styles/landing.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
