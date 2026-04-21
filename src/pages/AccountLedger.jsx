import React, { useState, useEffect } from 'react';
import { useMainLedger, usePettyCash } from '../hooks/useInventory';
import { Plus, Trash2, Wallet, ArrowUpCircle, ArrowDownCircle, Search, Calendar, User, Loader2, Settings, X, ChevronDown, ChevronRight, Printer, CheckSquare, Square, FileText, Pencil, ShoppingBag, TrendingUp } from 'lucide-react';
import Modal from '../components/Common/Modal';

const AccountLedger = () => {
  const { entries, balance, loading, addEntry, deleteEntry, updateEntry, refresh } = useMainLedger();
  const { transactions: pettyTransactions } = usePettyCash();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    type: 'income',
    amount: '',
    category: '其他收入',
    description: ''
  });

  const [editingEntry, setEditingEntry] = useState(null);
  const [expandedIds, setExpandedIds] = useState([]);

  const toggleExpand = (id) => {
    setExpandedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingEntry) {
      await updateEntry(editingEntry.id, {
        ...formData,
        amount: Number(formData.amount)
      });
    } else {
      await addEntry({
        ...formData,
        amount: Number(formData.amount)
      });
    }
    closeModal();
  };

  const handleEdit = (entry) => {
    if (entry.source_type !== 'manual') {
      alert('系統自動生成的紀錄無法直接修改，請至對應管理頁面操作。');
      return;
    }
    setEditingEntry(entry);
    setFormData({
      type: entry.type,
      amount: entry.amount,
      category: entry.category || '',
      description: entry.description || ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEntry(null);
    setFormData({ type: 'income', amount: '', category: '其他收入', description: '' });
  };

  const filtered = entries.filter(e => 
    (e.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSourceIcon = (sourceType, type) => {
    if (sourceType === 'sale') return <TrendingUp size={14} color="var(--success)" />;
    if (sourceType === 'purchase') return <ShoppingBag size={14} color="var(--danger)" />;
    if (sourceType === 'petty_cash') return <Wallet size={14} color="var(--primary)" />;
    return type === 'income' ? <ArrowUpCircle size={14} color="var(--success)" /> : <ArrowDownCircle size={14} color="var(--danger)" />;
  };

  return (
    <div className="account-ledger-page">
      <header className="flex justify-between items-center m-b-6">
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>帳戶流水帳</h1>
          <p style={{ color: 'var(--text-muted)' }}>公司主帳戶資金變動紀錄，整合銷售、採購與零用金撥補。</p>
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
          <button className="btn btn-primary no-print" onClick={() => setIsModalOpen(true)}>
            <Plus size={20} />
            新增手動紀錄
          </button>
        </div>
      </header>

      {loading && entries.length === 0 ? (
        <div className="flex items-center justify-center" style={{ minHeight: '300px' }}>
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : (
        <>
          <div className="card no-print m-b-6">
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="搜尋摘要或類別..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '0.625rem 0.75rem 0.625rem 2.5rem', border: '1px solid var(--border)', borderRadius: '0.5rem', backgroundColor: 'transparent', color: 'inherit' }}
              />
            </div>
          </div>

          <div className="card no-print">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}></th>
                    <th>日期</th>
                    <th>摘要</th>
                    <th>類別</th>
                    <th>來源</th>
                    <th style={{ textAlign: 'right' }}>金額 (NT$)</th>
                    <th style={{ textAlign: 'right' }}>餘額 (NT$)</th>
                    <th style={{ textAlign: 'center' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(e => {
                    const isExpanded = expandedIds.includes(e.id);
                    const isPettyCash = e.source_type === 'petty_cash';
                    const linkedPettyItems = isPettyCash ? pettyTransactions.filter(pt => pt.replenishment_id === e.source_id) : [];

                    return (
                      <React.Fragment key={e.id}>
                        <tr style={{ backgroundColor: isExpanded ? 'rgba(59, 130, 246, 0.02)' : 'transparent' }}>
                          <td style={{ textAlign: 'center' }}>
                            {isPettyCash && linkedPettyItems.length > 0 && (
                              <button className="btn-ghost" onClick={() => toggleExpand(e.id)} style={{ padding: 0 }}>
                                {isExpanded ? <ChevronDown size={18} color="var(--primary)" /> : <ChevronRight size={18} />}
                              </button>
                            )}
                          </td>
                          <td style={{ fontSize: '0.875rem' }}>{new Date(e.date).toLocaleDateString()}</td>
                          <td style={{ fontWeight: 500 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              {getSourceIcon(e.source_type, e.type)}
                              {e.description}
                              {isPettyCash && <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 'normal' }}> (點擊展開明細)</span>}
                            </div>
                          </td>
                          <td><span className="badge">{e.category || '一般'}</span></td>
                          <td>
                            <span style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.05)', color: 'var(--text-muted)' }}>
                              {e.source_type === 'sale' ? '銷售系統' : e.source_type === 'purchase' ? '進貨系統' : e.source_type === 'petty_cash' ? '零用金' : '手動'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold', color: e.type === 'income' ? 'var(--success)' : 'inherit' }}>
                            {e.type === 'income' ? '+' : '-'}{Number(e.amount).toLocaleString()}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>
                            {e.running_balance?.toLocaleString()}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {e.source_type === 'manual' ? (
                              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.25rem' }}>
                                <button className="btn-ghost" style={{ color: 'var(--primary)', padding: '4px' }} onClick={() => handleEdit(e)}>
                                  <Pencil size={16} />
                                </button>
                                <button className="btn-ghost" style={{ color: 'var(--danger)', padding: '4px' }} onClick={() => deleteEntry(e.id)}>
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>系統自動</span>
                            )}
                          </td>
                        </tr>
                        {isExpanded && isPettyCash && (
                          <tr style={{ backgroundColor: 'rgba(59, 130, 246, 0.03)' }}>
                            <td colSpan="8" style={{ padding: '1rem 1rem 1.5rem 4rem' }}>
                              <div style={{ borderLeft: '2px solid var(--primary-light)', paddingLeft: '1.5rem' }}>
                                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.75rem' }}>關聯零用金報銷明細：</h4>
                                <table style={{ width: '100%', fontSize: '0.8rem' }}>
                                  <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                      <th style={{ textAlign: 'left', padding: '0.5rem' }}>日期</th>
                                      <th style={{ textAlign: 'left', padding: '0.5rem' }}>摘要</th>
                                      <th style={{ textAlign: 'left', padding: '0.5rem' }}>會計科目</th>
                                      <th style={{ textAlign: 'right', padding: '0.5rem' }}>金額</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {linkedPettyItems.map(pi => (
                                      <tr key={pi.id}>
                                        <td style={{ padding: '0.5rem' }}>{new Date(pi.date).toLocaleDateString()}</td>
                                        <td style={{ padding: '0.5rem' }}>{pi.description}</td>
                                        <td style={{ padding: '0.5rem' }}>{pi.accounting_item}</td>
                                        <td style={{ textAlign: 'right', padding: '0.5rem' }}>{Number(pi.amount).toLocaleString()}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingEntry ? "修改帳戶紀錄" : "新增帳戶紀錄"}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="flex flex-col gap-2">
              <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>紀錄類型</label>
              <select 
                value={formData.type} 
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                style={{ padding: '0.625rem', border: '1px solid var(--border)', borderRadius: '0.375rem', backgroundColor: 'transparent', color: 'inherit' }}
              >
                <option value="income">收入</option>
                <option value="expense">支出</option>
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
          <div className="flex flex-col gap-2">
            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>類別</label>
            <input 
              required
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="如: 利息收入、房租支出"
              style={{ padding: '0.625rem', border: '1px solid var(--border)', borderRadius: '0.375rem', backgroundColor: 'transparent', color: 'inherit' }}
            />
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
            <button type="button" className="btn btn-ghost" onClick={closeModal}>取消</button>
            <button type="submit" className="btn btn-primary">{editingEntry ? "確認修改" : "確認新增"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AccountLedger;
