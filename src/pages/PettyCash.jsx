import React, { useState, useEffect } from 'react';
import { usePettyCash, usePettyCashCategories } from '../hooks/useInventory';
import { Plus, Trash2, Wallet, ArrowUpCircle, ArrowDownCircle, Search, Calendar, User, Loader2, Settings, X, ChevronDown, ChevronRight } from 'lucide-react';
import Modal from '../components/Common/Modal';

const PettyCash = () => {
  const { transactions, balance, addTransaction, deleteTransaction, loading: transLoading } = usePettyCash();
  const { categories: dbCategories, addCategory, deleteCategory, loading: catLoading } = usePettyCashCategories();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category: '',
    accountingItem: '',
    description: ''
  });

  // Category Management State
  const [newCat, setNewCat] = useState({ accountingItem: '', category: '' });
  const [expandedAccounts, setExpandedAccounts] = useState({});

  const toggleAccount = (act) => {
    setExpandedAccounts(prev => ({...prev, [act]: !prev[act]}));
  };

  const categorizedForSettings = dbCategories.reduce((acc, cat) => {
    if (!acc[cat.accounting_item]) acc[cat.accounting_item] = [];
    acc[cat.accounting_item].push(cat);
    return acc;
  }, {});

  // Transform flat database categories into ACCOUNTING_MAP structure
  const ACCOUNTING_MAP = dbCategories.reduce((acc, cat) => {
    if (!acc[cat.accounting_item]) acc[cat.accounting_item] = [];
    acc[cat.accounting_item].push(cat.category);
    return acc;
  }, {});

  const accountingItems = Object.keys(ACCOUNTING_MAP);
  
  // Initialize form with defaults once categories are loaded
  useEffect(() => {
    if (accountingItems.length > 0 && !formData.accountingItem) {
      setFormData(prev => ({
        ...prev,
        accountingItem: accountingItems[0],
        category: ACCOUNTING_MAP[accountingItems[0]][0]
      }));
    }
  }, [dbCategories]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addTransaction({
      ...formData,
      amount: Number(formData.amount)
    });
    setIsModalOpen(false);
    setFormData({ 
      type: 'expense', 
      amount: '', 
      accountingItem: accountingItems[0] || '', 
      category: (ACCOUNTING_MAP[accountingItems[0]] || [])[0] || '', 
      description: '' 
    });
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCat.accountingItem || !newCat.category) return;
    await addCategory(newCat.accountingItem, newCat.category);
    setNewCat({ accountingItem: '', category: '' });
  };

  const filtered = transactions.filter(t => 
    (t.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.accounting_item || '').toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => new Date(b.date) - new Date(a.date));

  const currentCategories = ACCOUNTING_MAP[formData.accountingItem] || [];

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

      {(transLoading || catLoading) && transactions.length === 0 ? (
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

      {/* Main Entry Modal */}
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
          {formData.type === 'expense' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="flex flex-col gap-2">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>會計科目</label>
                  <button type="button" onClick={() => setIsSettingsOpen(true)} className="btn-ghost" style={{ padding: '2px', color: 'var(--primary)' }} title="管理科目">
                    <Settings size={14} />
                  </button>
                </div>
                <select 
                  value={formData.accountingItem} 
                  required
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({ 
                      ...formData, 
                      accountingItem: val,
                      category: (ACCOUNTING_MAP[val] || [])[0] || ''
                    });
                  }}
                  style={{ padding: '0.625rem', border: '1px solid var(--border)', borderRadius: '0.375rem', backgroundColor: 'transparent', color: 'inherit' }}
                >
                  <option value="">請選擇...</option>
                  {accountingItems.map(item => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>類別</label>
                <select 
                  value={formData.category} 
                  required
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{ padding: '0.625rem', border: '1px solid var(--border)', borderRadius: '0.375rem', backgroundColor: 'transparent', color: 'inherit' }}
                >
                  <option value="">請選擇...</option>
                  {currentCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          )}
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

      {/* Category Settings Modal */}
      <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="管理會計科目與類別">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <form onSubmit={handleAddCategory} className="card" style={{ padding: '1rem', border: '1px solid var(--primary-light)', backgroundColor: 'rgba(59, 130, 246, 0.05)' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem' }}>新增科目對應</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.75rem', alignItems: 'flex-end' }}>
              <div className="flex flex-col gap-1">
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>會計科目 (大項)</label>
                <input 
                  required
                  type="text"
                  placeholder="如: 郵電費"
                  value={newCat.accountingItem}
                  onChange={(e) => setNewCat({...newCat, accountingItem: e.target.value})}
                  list="existing-items"
                  style={{ padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '0.375rem', backgroundColor: 'var(--card)', color: 'inherit' }}
                />
                <datalist id="existing-items">
                  {accountingItems.map(item => <option key={item} value={item} />)}
                </datalist>
              </div>
              <div className="flex flex-col gap-1">
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>類別 (子項)</label>
                <input 
                  required
                  type="text"
                  placeholder="如: 電話費"
                  value={newCat.category}
                  onChange={(e) => setNewCat({...newCat, category: e.target.value})}
                  style={{ padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '0.375rem', backgroundColor: 'var(--card)', color: 'inherit' }}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ height: '38px', padding: '0 1rem' }}>新增</button>
            </div>
          </form>

          <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table style={{ fontSize: '0.875rem' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'var(--card)' }}>
                <tr>
                  <th>會計科目</th>
                  <th>類別</th>
                  <th style={{ textAlign: 'center' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(categorizedForSettings).map(([accountingItem, subCats]) => (
                  <React.Fragment key={accountingItem}>
                    <tr style={{ cursor: 'pointer', backgroundColor: 'var(--card-hover)' }} onClick={() => toggleAccount(accountingItem)}>
                      <td style={{ fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {expandedAccounts[accountingItem] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          {accountingItem}
                        </div>
                      </td>
                      <td colSpan="2" style={{ color: 'var(--text-muted)' }}>
                        共 {subCats.length} 個類別
                      </td>
                    </tr>
                    {expandedAccounts[accountingItem] && subCats.map(cat => (
                      <tr key={cat.id} style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                        <td style={{ paddingLeft: '2.5rem' }}></td>
                        <td>{cat.category}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button className="btn-ghost" style={{ color: 'var(--danger)', padding: '4px' }} onClick={(e) => { e.stopPropagation(); deleteCategory(cat.id); }}>
                            <X size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
                {dbCategories.length === 0 && (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>尚未設定任何科目</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PettyCash;
