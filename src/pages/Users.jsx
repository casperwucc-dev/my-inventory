import React, { useState } from 'react';
import { useUsers } from '../hooks/useUsers';
import { User, Mail, Shield, Calendar, Edit2, Loader2, Search } from 'lucide-react';
import Modal from '../components/Common/Modal';

const Users = () => {
  const { users, loading, updateProfile } = useUsers();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    role: 'staff'
  });

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name || '',
      role: user.role || 'staff'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateProfile(editingUser.id, formData);
    setIsModalOpen(false);
  };

  const filteredUsers = users.filter(u => 
    (u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="users-page">
      <header className="flex justify-between items-center m-b-6">
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>使用者管理</h1>
          <p style={{ color: 'var(--text-muted)' }}>管理系統存取人員及其權限設定。</p>
        </div>
      </header>

      {loading && users.length === 0 ? (
        <div className="flex items-center justify-center" style={{ minHeight: '300px' }}>
          <Loader2 className="animate-spin text-primary" size={40} />
          <span style={{ marginLeft: '1rem', color: 'var(--text-muted)' }}>載入中...</span>
        </div>
      ) : (
        <>
          <div className="card m-b-6">
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="搜尋姓名或電子郵件..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.75rem 0.625rem 2.5rem',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  backgroundColor: 'transparent',
                  color: 'inherit'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
            {filteredUsers.map(user => (
              <div key={user.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div style={{ padding: '0.75rem', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                      <User size={24} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{user.full_name || '未設定姓名'}</h3>
                      <span className={`badge ${user.role === 'admin' ? 'badge-primary' : ''}`} style={{ fontSize: '0.75rem' }}>
                        {user.role === 'admin' ? '管理員' : '一般員工'}
                      </span>
                    </div>
                  </div>
                  <button className="btn-ghost" onClick={() => handleEdit(user)}>
                    <Edit2 size={16} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.875rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                  <div className="flex items-center gap-2">
                    <Mail size={16} /> 帳號: {user.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} /> 加入日期: {new Date(user.updated_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="編輯使用者資料">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="flex flex-col gap-2">
            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>真實姓名</label>
            <input 
              required 
              type="text" 
              value={formData.full_name} 
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} 
              placeholder="請輸入姓名"
              style={{ padding: '0.625rem', border: '1px solid var(--border)', borderRadius: '0.375rem', backgroundColor: 'transparent', color: 'inherit' }} 
            />
          </div>
          <div className="flex flex-col gap-2">
            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>權限群組</label>
            <select 
              value={formData.role} 
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              style={{ padding: '0.625rem', border: '1px solid var(--border)', borderRadius: '0.375rem', backgroundColor: 'transparent', color: 'inherit' }}
            >
              <option value="staff">一般員工 (Staff)</option>
              <option value="admin">系統管理員 (Admin)</option>
            </select>
          </div>
          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>取消</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>儲存變更</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Users;
