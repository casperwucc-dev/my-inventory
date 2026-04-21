import React, { useState, useEffect } from 'react';
import { usePettyCash, usePettyCashCategories } from '../hooks/useInventory';
import { Plus, Trash2, Wallet, ArrowUpCircle, ArrowDownCircle, Search, Calendar, User, Loader2, Settings, X, ChevronDown, ChevronRight, Printer, CheckSquare, Square, FileText, Pencil } from 'lucide-react';
import Modal from '../components/Common/Modal';

const PettyCash = () => {
  const { transactions, balance, addTransaction, deleteTransaction, updateTransactionStatus, updateTransaction, createReplenishment, loading: transLoading } = usePettyCash();
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
  const [selectedIds, setSelectedIds] = useState([]);
  const [isVoucherOpen, setIsVoucherOpen] = useState(false);
  const [currentVoucher, setCurrentVoucher] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [expandedReplenishmentIds, setExpandedReplenishmentIds] = useState([]);

  const toggleAccount = (act) => {
    setExpandedAccounts(prev => ({...prev, [act]: !prev[act]}));
  };

  const toggleReplenishment = (id) => {
    setExpandedReplenishmentIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
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
    if (editingTransaction) {
      await updateTransaction(editingTransaction.id, {
        ...formData,
        amount: Number(formData.amount)
      });
    } else {
      await addTransaction({
        ...formData,
        amount: Number(formData.amount)
      });
    }
    closeModal();
  };

  const handleEdit = (t) => {
    setEditingTransaction(t);
    setFormData({
      type: t.type,
      amount: t.amount,
      accountingItem: t.accounting_item || '',
      category: t.category || '',
      description: t.description || ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
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

  const selectable = filtered.filter(t => t.type === 'expense' && t.status !== 'applied');
  
  const handleSelectAll = () => {
    const selectable = filtered.filter(t => t.type === 'expense' && t.status !== 'applied');
    if (selectedIds.length === selectable.length && selectable.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(selectable.map(t => t.id));
    }
  };

  const handleSelectRow = (t) => {
    if (t.type !== 'expense' || t.status === 'applied') return;
    const id = t.id;
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedTotal = transactions
    .filter(t => selectedIds.includes(t.id))
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const selectedItems = transactions.filter(t => selectedIds.includes(t.id));

  const handleApply = (transaction = null) => {
    if (transaction) {
      setCurrentVoucher(transaction);
    } else if (selectedIds.length > 0) {
      setCurrentVoucher(null);
    } else {
      setCurrentVoucher(null);
    }
    setIsVoucherOpen(true);
  };

  const handleConfirmApplication = async () => {
    try {
      if (selectedIds.length === 0 && !currentVoucher) return;
      
      const idsToUpdate = currentVoucher ? [currentVoucher.id] : selectedIds;
      const totalAmount = currentVoucher ? Number(currentVoucher.amount) : selectedTotal;
      const desc = currentVoucher ? `零用金撥補: ${currentVoucher.description}` : `零用金報銷撥補 (共 ${selectedIds.length} 筆)`;

      await createReplenishment(idsToUpdate, totalAmount, desc);
      
      setIsVoucherOpen(false);
      setSelectedIds([]);
      setCurrentVoucher(null);
    } catch (error) {
      console.error('Failed to confirm application:', error);
    }
  };

  const currentCategories = ACCOUNTING_MAP[formData.accountingItem] || [];

  return (
    <div className={`petty-cash-page ${isVoucherOpen ? 'is-voucher-open' : ''}`}>
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
          <button className="btn btn-ghost no-print" onClick={handlePrint} title="列印報表">
            <Printer size={20} />
            列印
          </button>
          <button className="btn btn-ghost no-print" onClick={() => handleApply()} title="申請零用金">
            <FileText size={20} />
            申請
          </button>
          <button className="btn btn-primary no-print" onClick={() => { setEditingTransaction(null); setIsModalOpen(true); }}>
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
          <div className="card no-print m-b-6 hide-during-voucher">
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

          {selectedIds.length > 0 && (
            <div className="card no-print m-b-6" style={{ 
              backgroundColor: 'var(--primary)', 
              color: 'white', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '1rem 1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <CheckSquare size={24} />
                <span style={{ fontWeight: 600 }}>
                  已選取 {selectedIds.length} 筆資料
                </span>
                <span style={{ opacity: 0.8 }}>|</span>
                <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                  合計金額：NT$ {selectedTotal.toLocaleString()}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn" style={{ backgroundColor: 'white', color: 'var(--primary)' }} onClick={() => handleApply()}>
                  批次申請傳票
                </button>
                <button className="btn-ghost" style={{ color: 'white' }} onClick={() => setSelectedIds([])}>
                  取消選取
                </button>
              </div>
            </div>
          )}

          <div className="card no-print hide-during-voucher">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th className="no-print" style={{ width: '40px', textAlign: 'center' }}>
                      <button className="btn-ghost" onClick={handleSelectAll} style={{ padding: 0 }} disabled={selectable.length === 0}>
                        {selectedIds.length === selectable.length && selectable.length > 0 ? 
                          <CheckSquare size={18} color="var(--primary)" /> : 
                          <Square size={18} />
                        }
                      </button>
                    </th>
                    <th>日期</th>
                    <th>摘要</th>
                    <th>會計科目</th>
                    <th>類別</th>
                    <th style={{ textAlign: 'right' }}>金額 (NT$)</th>
                    <th style={{ textAlign: 'right' }}>餘額 (NT$)</th>
                    <th style={{ textAlign: 'center' }} className="no-print">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(t => {
                    const isExpanded = expandedReplenishmentIds.includes(t.id);
                    const linkedExpenses = transactions.filter(e => e.replenishment_id === t.id);
                    const hasDetails = t.type === 'income' && t.category === '零用金撥補' && linkedExpenses.length > 0;

                    return (
                      <React.Fragment key={t.id}>
                        <tr style={{ 
                          backgroundColor: t.status === 'applied' ? 'rgba(0, 0, 0, 0.04)' : (selectedIds.includes(t.id) ? 'rgba(99, 102, 241, 0.05)' : 'transparent'),
                          opacity: t.status === 'applied' ? 0.7 : 1,
                          borderLeft: hasDetails ? '4px solid var(--primary)' : 'none'
                        }}>
                          <td className="no-print" style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                              {hasDetails && (
                                <button className="btn-ghost" onClick={() => toggleReplenishment(t.id)} style={{ padding: 0 }}>
                                  {isExpanded ? <ChevronDown size={18} color="var(--primary)" /> : <ChevronRight size={18} />}
                                </button>
                              )}
                              {t.type === 'expense' && t.status !== 'applied' ? (
                                <button className="btn-ghost" onClick={() => handleSelectRow(t)} style={{ padding: 0 }}>
                                  {selectedIds.includes(t.id) ? 
                                    <CheckSquare size={18} color="var(--primary)" /> : 
                                    <Square size={18} />
                                  }
                                </button>
                              ) : (
                                !hasDetails && <div style={{ width: '18px', height: '18px' }}></div>
                              )}
                            </div>
                          </td>
                          <td style={{ fontSize: '0.875rem' }}>{new Date(t.date).toLocaleDateString()}</td>
                          <td style={{ fontWeight: 500, cursor: 'pointer' }} onClick={() => hasDetails ? toggleReplenishment(t.id) : handleApply(t)}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ color: t.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
                                {t.type === 'income' ? <ArrowUpCircle size={14} /> : <ArrowDownCircle size={14} />}
                              </span>
                              {t.description}
                              {hasDetails && <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 'normal' }}> (查看明細)</span>}
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
                          <td style={{ textAlign: 'right', fontWeight: 600, color: (t.running_balance || 0) >= 0 ? 'inherit' : 'var(--danger)' }}>
                            {t.running_balance?.toLocaleString()}
                          </td>
                          <td style={{ textAlign: 'center' }} className="no-print">
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.25rem' }}>
                              <button className="btn-ghost" style={{ color: 'var(--primary)', padding: '4px' }} onClick={() => handleApply(t)} title="查看傳票">
                                <FileText size={16} />
                              </button>
                              <button className="btn-ghost" style={{ color: 'var(--primary)', padding: '4px' }} onClick={() => handleEdit(t)} title="修改紀錄">
                                <Pencil size={16} />
                              </button>
                              <button className="btn-ghost" style={{ color: 'var(--danger)', padding: '4px' }} onClick={() => deleteTransaction(t.id)}>
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && hasDetails && (
                          <tr className="no-print" style={{ backgroundColor: 'rgba(59, 130, 246, 0.03)' }}>
                            <td colSpan="8" style={{ padding: '0 0 1rem 3rem' }}>
                              <div style={{ borderLeft: '2px solid var(--primary-light)', paddingLeft: '1rem' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.5rem' }}>撥補花費明細：</div>
                                <table style={{ width: '100%', fontSize: '0.8rem' }}>
                                  <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                      <th style={{ textAlign: 'left', padding: '0.25rem' }}>日期</th>
                                      <th style={{ textAlign: 'left', padding: '0.25rem' }}>摘要</th>
                                      <th style={{ textAlign: 'left', padding: '0.25rem' }}>類別</th>
                                      <th style={{ textAlign: 'right', padding: '0.25rem' }}>金額</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {linkedExpenses.map(item => (
                                      <tr key={item.id}>
                                        <td style={{ padding: '0.25rem' }}>{new Date(item.date).toLocaleDateString()}</td>
                                        <td style={{ padding: '0.25rem' }}>{item.description}</td>
                                        <td style={{ padding: '0.25rem' }}>{item.category}</td>
                                        <td style={{ textAlign: 'right', padding: '0.25rem' }}>{Number(item.amount).toLocaleString()}</td>
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
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingTransaction ? "修改零用金紀錄" : "新增零用金紀錄"}>
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
            <button type="button" className="btn btn-ghost" onClick={closeModal}>取消</button>
            <button type="submit" className="btn btn-primary">{editingTransaction ? "確認修改" : "確認新增"}</button>
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

      {/* Petty Cash Voucher (Application) Modal */}
      <Modal isOpen={isVoucherOpen} onClose={() => setIsVoucherOpen(false)} title={currentVoucher || selectedIds.length > 0 ? (selectedIds.length > 1 ? "零用金撥報(彙總)" : "零用金支出傳票") : "零用金申請單"}>
        <div id="voucher-to-print" style={{ padding: '0.5rem', backgroundColor: 'white', color: 'black' }}>
          
          {/* Section 1: The Voucher (Application Form) */}
          <section className="print-section" style={{ marginBottom: '4rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem', borderBottom: '2px solid black', paddingBottom: '0.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>長和事業有限公司</h2>
              <h3 style={{ fontSize: '1.25rem', letterSpacing: '0.5rem' }}>
                {selectedIds.length > 1 ? '零用金支用彙總傳票' : (currentVoucher ? '零用金支出傳票' : '零用金申請單')}
              </h3>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>日期：{currentVoucher ? new Date(currentVoucher.date).toLocaleDateString() : new Date().toLocaleDateString()}</div>
              <div style={{ textAlign: 'right' }}>傳票號碼：{currentVoucher ? currentVoucher.id.slice(0, 8).toUpperCase() : (selectedIds.length > 1 ? 'BULK-' + new Date().getTime().toString().slice(-6) : 'NEW')}</div>
            </div>

            <table className="voucher-table" style={{ border: '1px solid black', width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid black', padding: '12px', width: '100px', fontWeight: 'bold' }}>摘要</td>
                  <td style={{ border: '1px solid black', padding: '12px' }} colSpan="3">
                    {selectedIds.length > 1 ? `零用金報銷清單 (共 ${selectedIds.length} 筆資料)` : (currentVoucher?.description || '___________________')}
                  </td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid black', padding: '12px', fontWeight: 'bold' }}>會計科目</td>
                  <td style={{ border: '1px solid black', padding: '12px' }}>
                    {selectedIds.length > 1 ? '雜費/各項支出' : (currentVoucher?.accounting_item || '___________________')}
                  </td>
                  <td style={{ border: '1px solid black', padding: '12px', fontWeight: 'bold' }}>類別</td>
                  <td style={{ border: '1px solid black', padding: '12px' }}>
                    {selectedIds.length > 1 ? '彙總報銷' : (currentVoucher?.category || '___________________')}
                  </td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid black', padding: '12px', fontWeight: 'bold' }}>總計金額</td>
                  <td style={{ border: '1px solid black', padding: '12px' }} colSpan="3">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                        NT$ {(selectedIds.length > 1 ? selectedTotal : (currentVoucher?.amount || 0)).toLocaleString()}
                      </span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid black', padding: '12px', fontWeight: 'bold' }}>受款人</td>
                  <td style={{ border: '1px solid black', padding: '12px' }} colSpan="3">
                    {currentVoucher?.payee || '___________________'}
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', marginTop: '2.5rem', textAlign: 'center' }}>
              <div style={{ borderTop: '1px solid black', paddingTop: '0.5rem' }}>核准人</div>
              <div style={{ borderTop: '1px solid black', paddingTop: '0.5rem' }}>複核人</div>
              <div style={{ borderTop: '1px solid black', paddingTop: '0.5rem' }}>經辦人</div>
              <div style={{ borderTop: '1px solid black', paddingTop: '0.5rem' }}>領款人簽章</div>
            </div>
          </section>

          {/* Section 2: Detailed List (Only shown for multiple items) */}
          {selectedIds.length > 1 && (
            <section className="print-section page-break" style={{ marginTop: '2rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>費用明細清單</h3>
                <div style={{ fontSize: '0.875rem' }}>列印日期：{new Date().toLocaleString()}</div>
              </div>
              
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6' }}>
                    <th style={{ border: '1px solid #000', padding: '8px' }}>日期</th>
                    <th style={{ border: '1px solid #000', padding: '8px' }}>摘要</th>
                    <th style={{ border: '1px solid #000', padding: '8px' }}>會計科目</th>
                    <th style={{ border: '1px solid #000', padding: '8px' }}>類別</th>
                    <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>金額</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedItems.map(item => (
                    <tr key={item.id}>
                      <td style={{ border: '1px solid #000', padding: '8px' }}>{new Date(item.date).toLocaleDateString()}</td>
                      <td style={{ border: '1px solid #000', padding: '8px' }}>{item.description}</td>
                      <td style={{ border: '1px solid #000', padding: '8px' }}>{item.accounting_item}</td>
                      <td style={{ border: '1px solid #000', padding: '8px' }}>{item.category}</td>
                      <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>
                        {Number(item.amount).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ fontWeight: 'bold', backgroundColor: '#f3f4f6' }}>
                    <td colSpan="4" style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>本頁合計 (共 {selectedIds.length} 筆)</td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>
                      NT$ {selectedTotal.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </section>
          )}
          
          <div className="no-print" style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
            <button className="btn btn-ghost" onClick={() => setIsVoucherOpen(false)}>關閉視窗</button>
            {(currentVoucher?.status !== 'applied' && (currentVoucher || selectedIds.length > 0)) && (
              <button className="btn" style={{ backgroundColor: 'var(--success)', color: 'white' }} onClick={handleConfirmApplication}>
                <CheckSquare size={18} />
                確認並標記為已申請
              </button>
            )}
            <button className="btn btn-primary" onClick={() => window.print()}>
              <Printer size={18} />
              立即列印
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PettyCash;
