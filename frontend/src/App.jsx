import React, { useState, useEffect } from 'react';
import { DriverProvider } from './context/DriverContext';
import MobileAppLayout from './layouts/MobileAppLayout';
import AdminLayout from './layouts/AdminLayout';

const checkIsAdmin = () => {
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  return path.startsWith('/admin') || hash.startsWith('#/admin') || hash === '#admin';
};

export default function App() {
  const [isAdmin, setIsAdmin] = useState(checkIsAdmin);

  useEffect(() => {
    const handleRouteChange = () => {
      setIsAdmin(checkIsAdmin());
    };

    window.addEventListener('popstate', handleRouteChange);
    window.addEventListener('hashchange', handleRouteChange);
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('hashchange', handleRouteChange);
    };
  }, []);

  const openAdmin = (subpath = '') => {
    const target = subpath ? `/admin/${subpath}` : '/admin';
    window.history.pushState(null, '', target);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const openDriverApp = (screen = 'jobs') => {
    const target = screen === 'jobs' ? '/' : `/${screen}`;
    window.history.pushState(null, '', target);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <DriverProvider>
      <div className="laixeho24h-root">
        {isAdmin ? (
          <AdminLayout onSwitchToDriverApp={() => openDriverApp('jobs')} />
        ) : (
          <MobileAppLayout onSwitchToAdmin={() => openAdmin()} />
        )}
      </div>
    </DriverProvider>
  );
}
