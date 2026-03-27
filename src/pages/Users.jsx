import React, { useState } from 'react';
import { useUsers } from '../hooks/useUsers';
import { User, Mail, Shield, Calendar, Edit2, Loader2, Search, Plus, Lock } from 'lucide-react';
import Modal from '../components/Common/Modal';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';

// Secondary client for adding users without logging out the current admin
const signupClient = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
);

const Users = () => {
  const { users, loading, updateProfile, fetchUsers } = useUsers();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'staff'
  });

  const [actionLoading, setActionLoading] = useState(false);

  const handleEdit = (user) => {
    setIsAddMode(false);
    setEditingUser(user);
    setFormData({
      full_name: user.full_name || '',
      role: user.role || 'staff'
    });
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setIsAddMode(true);
    setEditingUser(null);
    setFormData({
      email: '',
      password: '',
      full_name: '',
      role: 'staff'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (isAddMode) {
        // Create auth user
        const { data: signUpData, error: signUpError } = await signupClient.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: { 
              full_name: formData.full_name,
              role: formData.role 
            }
          }
        });
        
        if (signUpError) throw signUpError;

        // If a specific role was chosen (other than default staff), update it
        if (formData.role !== 'staff' && signUpData.user) {
          await updateProfile(signUpData.user.id, { role: formData.role });
        }

        await fetchUsers();
      } else {
        await updateProfile(editingUser.id, {
          full_name: formData.full_name,
          role: formData.role
        });

        // 2. If a new password was provided, call the Edge Function
        if (formData.password) {
          const { data, error: functionError } = await supabase.functions.invoke('admin-manage-user', {
            body: { userId: editingUser.id, newPassword: formData.password }
          });
          
          if (functionError) throw functionError;
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      alert('操作失敗：' + err.message);
    } finally {
      setActionLoading(false);
    }
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
        <button className="btn btn-primary" onClick={handleAdd}>
          <Plus size={20} />
          新增人員
        </button>
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isAddMode ? '新增人員帳號' : '編輯使用者資料'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {isAddMode && (
            <>
              <div className="flex flex-col gap-2">
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>電子郵件 (登入帳號)</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    required 
                    type="email" 
                    value={formData.email} 
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                    placeholder="example@gmail.com"
                    autoComplete="off"
                    style={{ width: '100%', padding: '0.625rem 0.75rem 0.625rem 2.25rem', border: '1px solid var(--border)', borderRadius: '0.375rem', backgroundColor: 'transparent', color: 'inherit' }} 
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>設定初始密碼</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    required 
                    type="password" 
                    minLength="6"
                    value={formData.password} 
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                    placeholder="至少 6 位字元"
                    autoComplete="new-password"
                    style={{ width: '100%', padding: '0.625rem 0.75rem 0.625rem 2.25rem', border: '1px solid var(--border)', borderRadius: '0.375rem', backgroundColor: 'transparent', color: 'inherit' }} 
                  />
                </div>
              </div>
            </>
          )}
          <div className="flex flex-col gap-2">
            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>人員真實姓名</label>
            <input 
              required 
              type="text" 
              value={formData.full_name} 
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} 
              placeholder="請輸入姓名"
              style={{ padding: '0.625rem', border: '1px solid var(--border)', borderRadius: '0.375rem', backgroundColor: 'transparent', color: 'inherit' }} 
            />
          </div>
          {!isAddMode && (
            <div className="flex flex-col gap-2">
              <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                變更密碼 <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>(若不變更請留空)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="password" 
                  minLength="6"
                  value={formData.password} 
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                  placeholder="設定新密碼"
                  autoComplete="new-password"
                  style={{ width: '100%', padding: '0.625rem 0.75rem 0.625rem 2.25rem', border: '1px solid var(--border)', borderRadius: '0.375rem', backgroundColor: 'transparent', color: 'inherit' }} 
                />
              </div>
            </div>
          )}
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
            <button type="submit" className="btn btn-primary" disabled={actionLoading}>
              {actionLoading ? <Loader2 className="animate-spin" size={18} /> : (isAddMode ? '立即建立' : '儲存變更')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Users;
