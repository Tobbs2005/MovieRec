import React, { useState } from 'react';
import './Sidebar.css';

const Sidebar = ({ route, setRoute }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
        {collapsed ? '▶' : '◀'}
      </button>
      {!collapsed && (
        <nav className="nav">
          <button onClick={() => setRoute('/')}>Home</button>
          <button onClick={() => setRoute('/mymovies')}>My Movies</button>
        </nav>
      )}
    </div>
  );
};

export default Sidebar;
