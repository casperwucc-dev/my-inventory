import React, { useState } from 'react';
import { usePettyCash } from '../hooks/useInventory';
import { Plus, Trash2, Wallet, ArrowUpCircle, ArrowDownCircle, Search, Calendar, User, Loader2 } from 'lucide-react';
import Modal from '../components/Common/Modal';

const PettyCash = () => {
  const { transactions, balance, addTransaction, deleteTransaction, loading } = usePettyCash();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category: '雜支',
    accountingItem: '雜費',
    description: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addTransaction({
      ...formData,
      amount: Number(formData.amount)
    });
    setIsModalOpen(false);
    setFormData({ type: 'expense', amount: '', category: '雜支', accountingItem: '雜費', description: '' });
  };

  const filtered = transactions.filter(t => 
    (t.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.accounting_item || '').toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => new Date(b.date) - new Date(a.date));

  const ACCOUNTING_MAP = {
    '郵電費': ['掛號', '電話', '快遞', '郵寄'],
    '差旅費': ['計程車', '油資', '大眾運輸', '住宿'],
    '修繕費': ['電腦維修', '水電維修', '冷氣保養', '其他維修'],
    '交際費': ['餐費', '禮品', '其他'],
    '水電費': ['水費', '電費', '瓦斯費'],
    '雜費': ['文具', '清潔用品', '飲品', '其他雜購'],
    '其他': ['其他']
  };

  const accountingItems = Object.keys(ACCOUNTING_MAP);
  const currentCategories = ACCOUNTING_MAP[formData.accountingItem] || ['其他'];

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

      {loading && transactions.length === 0 ? (
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
                placeholder="搜尋摘要、類別或會計科目..."
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
                    <th>摘要</th>
                    <th>會計科目</th>
                    <th>類別</th>
                    <th style={{ textAlign: 'right' }}>金額 (NT$)</th>
                    <th style={{ textAlign: 'center' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(t => (
                    <tr key={t.id}>
                      <td style={{ fontSize: '0.875rem' }}>{new Date(t.date).toLocaleDateString()}</td>
                      <td style={{ fontWeight: 500 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ color: t.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
                            {t.type === 'income' ? <ArrowUpCircle size={14} /> : <ArrowDownCircle size={14} />}
                          </span>
                          {t.description}
                        </div>
                      </td>
                      <td><span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{t.accounting_item || '-'}</span></td>
                      <td><span className="badge">{t.category}</span></td>
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
                      <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        暫無零用金紀錄
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

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
              <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>會計科目</label>
              <select 
                value={formData.accountingItem} 
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({ 
                    ...formData, 
                    accountingItem: val,
                    category: ACCOUNTING_MAP[val]?.[0] || '其他'
                  });
                }}
                style={{ padding: '0.625rem', border: '1px solid var(--border)', borderRadius: '0.375rem', backgroundColor: 'transparent', color: 'inherit' }}
              >
                {accountingItems.map(item => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>類別</label>
              <select 
                value={formData.category} 
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                style={{ padding: '0.625rem', border: '1px solid var(--border)', borderRadius: '0.375rem', backgroundColor: 'transparent', color: 'inherit' }}
              >
                {currentCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>摘要/備註</label>
            <textarea 
              required 
              value={formData.description} 
              onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
              rows="2"
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
