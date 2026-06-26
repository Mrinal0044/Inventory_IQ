import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => (
  <header className="navbar-header glass-panel">
    <div className="navbar-container">
      <Link to="/" className="navbar-logo">
        <svg className="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
          <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
        <span className="logo-text">Inventory<span className="logo-text-highlight">IQ</span></span>
      </Link>
      <nav className="navbar-nav">
        <ul className="nav-list">
          <li><NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>Dashboard</NavLink></li>
          <li><NavLink to="/upload" className={({ isActive }) => isActive ? 'active' : ''}>Upload</NavLink></li>
          <li><NavLink to="/forecast" className={({ isActive }) => isActive ? 'active' : ''}>Forecast</NavLink></li>
          <li><NavLink to="/inventory" className={({ isActive }) => isActive ? 'active' : ''}>Inventory</NavLink></li>
          <li><NavLink to="/analytics" className={({ isActive }) => isActive ? 'active' : ''}>Analytics</NavLink></li>
        </ul>
      </nav>
    </div>
  </header>
);

export default Navbar;
