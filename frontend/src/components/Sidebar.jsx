import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
        {collapsed ? '▶' : '◀'}
      </button>
      {!collapsed && (
        <nav className="nav">
          <Link to="/">
            <button className={location.pathname.startsWith('/') ? 'active' : ''}>Swipe</button>
          </Link>
          <Link to="/mymovies">
            <button className={location.pathname === '/mymovies' ? 'active' : ''}>My Movies</button>
          </Link>
        </nav>
      )}
    </div>
  );
};

export default Sidebar;