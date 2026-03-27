import React, { useState } from 'react';
import { usePettyCash } from '../hooks/useInventory';
import { Plus, Trash2, Wallet, ArrowUpCircle, ArrowDownCircle, Search, Calendar, User } from 'lucide-react';
import Modal from '../components/Common/Modal';

const PettyCash = () => {
  const { transactions, balance, addTransaction, deleteTransaction } = usePettyCash();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category: '雜支',
    description: '',
    payee: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    addTransaction({
      ...formData,
      amount: Number(formData.amount)
    });
    setIsModalOpen(false);
    setFormData({ type: 'expense', amount: '', category: '雜支', description: '', payee: '' });
  };

  const filtered = transactions.filter(t => 
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.payee.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => new Date(b.date) - new Date(a.date));

  const categories = ['雜支', '交通', '餐費', '撥補', '辦公用品', '其他'];

  return (
    <div className="petty-cash-page">
      <header className="flex justify-between items-center m-b-6">
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>零用金管理</h1>
          <p style={{ color: 'var(--text-muted)' }}>紀錄日常小額雜支與現金撥補。</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="card" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px solid var(--primary-light)', backgroundColor: 'rgba(59, 130, 246, 0.05)' }}>
            <Wallet size={20} color="var(--primary)" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>當前餘額</span>
              <span style={{ fontWeight: 'bold', fontSize: '1.25rem', color: balance >= 0 ? 'var(--primary)' : 'var(--danger)' }}>
                NT$ {balance.toLocaleString()}
              </span>
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={20} />
            新增紀錄
          </button>
        </div>
      </header>

      <div className="card m-b-6">
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="搜尋摘要、對象或類別..."
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

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>日期</th>
                <th>類型</th>
                <th>摘要</th>
                <th>類別</th>
                <th>經手人/對象</th>
                <th style={{ textAlign: 'right' }}>金額 (NT$)</th>
                <th style={{ textAlign: 'center' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id}>
                  <td style={{ fontSize: '0.875rem' }}>{new Date(t.date).toLocaleDateString()}</td>
                  <td>
                    <span style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.25rem', 
                      fontSize: '0.75rem', 
                      fontWeight: 600,
                      color: t.type === 'income' ? 'var(--success)' : 'var(--danger)'
                    }}>
                      {t.type === 'income' ? <ArrowUpCircle size={14} /> : <ArrowDownCircle size={14} />}
                      {t.type === 'income' ? '撥補' : '支出'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 500 }}>{t.description}</td>
                  <td><span className="badge">{t.category}</span></td>
                  <td>{t.payee}</td>
                  <td style={{ 
                    textAlign: 'right', 
                    fontWeight: 'bold',
                    color: t.type === 'income' ? 'var(--success)' : 'inherit'
                  }}>
                    {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => deleteTransaction(t.id)}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    暫無零用金紀錄
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="新增零用金紀錄">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="flex flex-col gap-2">
              <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>紀錄類型</label>
              <select 
                value={formData.type} 
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                style={{ padding: '0.625rem', border: '1px solid var(--border)', borderRadius: '0.375rem', backgroundColor: 'transparent', color: 'inherit' }}
              >
                <option value="expense">日常支出</option>
                <option value="income">零用金撥補</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>金額 (NT$)</label>
              <input 
                required 
                type="number" 
                value={formData.amount} 
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })} 
                style={{ padding: '0.625rem', border: '1px solid var(--border)', borderRadius: '0.375rem', backgroundColor: 'transparent', color: 'inherit' }} 
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="flex flex-col gap-2">
              <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>類別</label>
              <select 
                value={formData.category} 
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                style={{ padding: '0.625rem', border: '1px solid var(--border)', borderRadius: '0.375rem', backgroundColor: 'transparent', color: 'inherit' }}
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>經手人/對象</label>
              <input 
                required 
                type="text" 
                value={formData.payee} 
                onChange={(e) => setFormData({ ...formData, payee: e.target.value })} 
                style={{ padding: '0.625rem', border: '1px solid var(--border)', borderRadius: '0.375rem', backgroundColor: 'transparent', color: 'inherit' }} 
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>摘要/備註</label>
            <textarea 
              required 
              value={formData.description} 
              onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
              rows="3"
              style={{ padding: '0.625rem', border: '1px solid var(--border)', borderRadius: '0.375rem', backgroundColor: 'transparent', color: 'inherit', resize: 'none' }} 
            />
          </div>
          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>取消</button>
            <button type="submit" className="btn btn-primary">確認新增</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PettyCash;
