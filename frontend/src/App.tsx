import React, { useEffect } from 'react';
import { HashRouter, useRoutes } from 'react-router-dom';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { routes } from './routes';

function AppRoutes() {
  const element = useRoutes(routes);
  return element;
}

function HashNormalizer() {
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash && hash.length > 1 && !hash.startsWith('#/')) {
        window.location.replace('#/' + hash.slice(1));
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  return null;
}

export const App: React.FC = () => {
  return (
    <HashRouter>
      <HashNormalizer />
      <WorkspaceProvider>
        <AppRoutes />
      </WorkspaceProvider>
    </HashRouter>
  );
};

export default App;
