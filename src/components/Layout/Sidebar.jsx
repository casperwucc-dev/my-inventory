import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Box, ShoppingCart, TrendingUp, Settings, LogOut, User, Banknote } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err.message);
    }
  };

  const navItems = [
    { name: '儀表板', icon: <LayoutDashboard size={20} />, path: '/' },
    { name: '庫存管理', icon: <Box size={20} />, path: '/inventory' },
    { name: '進貨管理', icon: <ShoppingCart size={20} />, path: '/purchases' },
    { name: '銷售管理', icon: <TrendingUp size={20} />, path: '/sales' },
    { name: '帳戶流水帳', icon: <Banknote size={20} />, path: '/account-ledger' },
    { name: '零用金管理', icon: <Banknote size={20} />, path: '/petty-cash' },
    { name: '廠商管理', icon: <Settings size={20} />, path: '/suppliers' },
    { name: '客戶管理', icon: <User size={20} />, path: '/customers' },
    { name: '使用者管理', icon: <User size={20} />, path: '/users' },
  ];

  return (
    <aside className="sidebar" style={{
      width: '260px',
      backgroundColor: 'var(--bg-sidebar)',
      color: 'var(--text-on-dark)',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.5rem 1rem'
    }}>
      <div className="sidebar-header" style={{ marginBottom: '2.5rem', padding: '0 0.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Box size={24} color="var(--primary)" />
          長和事業有限公司
        </h2>
      </div>

      <nav style={{ flex: 1 }}>
        <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  color: isActive ? 'white' : 'var(--text-muted)',
                  backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                  transition: 'all 0.2s'
                })}
              >
                {item.icon}
                <span style={{ fontWeight: 500 }}>{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer" style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid #334155' }}>
        <div style={{ marginBottom: '1rem', padding: '0 0.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>
          <div style={{ fontWeight: 600, color: 'white', marginBottom: '0.25rem' }}>目前登入:</div>
          <div style={{ wordBreak: 'break-all' }}>{user?.email}</div>
        </div>
        <button 
          onClick={handleLogout}
          className="btn-ghost" 
          style={{ width: '100%', justifyContent: 'flex-start', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem' }}
        >
          <LogOut size={20} />
          <span>登出系統</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
