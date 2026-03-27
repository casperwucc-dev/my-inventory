import React from 'react';

const StatCard = ({ title, value, icon, color, trend }) => {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>{title}</span>
        <div style={{ padding: '0.5rem', borderRadius: '0.5rem', backgroundColor: `${color}15`, color: color }}>
          {icon}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem' }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{value}</h3>
        {trend && (
          <span style={{ fontSize: '0.75rem', color: trend.startsWith('+') ? 'var(--secondary)' : 'var(--danger)', marginBottom: '0.25rem' }}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatCard;
