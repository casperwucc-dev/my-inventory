import React, { useState } from 'react';
import { useInventory, useCustomers } from '../hooks/useInventory';
import { Plus, TrendingUp, Search, User, Loader2, Edit2, Trash2 } from 'lucide-react';
import Modal from '../components/Common/Modal';

const Sales = () => {
  const { products, sales, recordSale, updateSale, deleteSale, loading: inventoryLoading } = useInventory();
  const { customers, loading: customersLoading } = useCustomers();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [formData, setFormData] = useState({
    productId: '',
    quantity: 1,
    customerId: '',
    total: 0
  });

  const loading = inventoryLoading || customersLoading;

  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setEditingSale(null);
    setFormData({ productId: '', quantity: 1, customerId: '', total: 0 });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (sale) => {
    setIsEditMode(true);
    setEditingSale(sale);
    setFormData({
      productId: sale.product_id,
      quantity: sale.quantity,
      customerId: sale.customer_id,
      total: sale.total_amount
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('確定要刪除這筆銷售紀錄嗎？這將會自動回填庫存。')) {
      await deleteSale(id);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const product = products.find(p => p.id === formData.productId);
    
    // For validation, we need to consider the current stock + original quantity if editing
    const effectiveStock = product ? (isEditMode ? product.stock + editingSale.quantity : product.stock) : 0;

    if (effectiveStock < formData.quantity) {
      alert('庫存不足，無法完成銷售！');
      return;
    }
    
    const saleData = {
      productId: formData.productId,
      customerId: formData.customerId,
      quantity: formData.quantity,
      unitPrice: product?.price || 0,
      totalAmount: formData.total
    };

    if (isEditMode) {
      await updateSale(editingSale.id, saleData);
    } else {
      await recordSale(saleData);
    }
    
    setIsModalOpen(false);
    setFormData({ productId: '', quantity: 1, customerId: '', total: 0 });
  };

  const calculateTotal = (productId, quantity) => {
    const product = products.find(p => p.id === productId);
    return product ? product.price * quantity : 0;
  };

  return (
    <div className="sales-page">
      <header className="flex justify-between items-center m-b-6">
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>銷售管理</h1>
          <p style={{ color: 'var(--text-muted)' }}>記錄銷貨單、管理客戶並即時追蹤營收。</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          <Plus size={20} />
          記錄新銷售
        </button>
      </header>

      {loading && sales.length === 0 ? (
        <div className="flex items-center justify-center" style={{ minHeight: '300px' }}>
          <Loader2 className="animate-spin text-primary" size={40} />
          <span style={{ marginLeft: '1rem', color: 'var(--text-muted)' }}>載入中...</span>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>訂單編號</th>
                  <th>產品名稱</th>
                  <th>客戶</th>
                  <th>數量</th>
                  <th>總金額 (NT$)</th>
                  <th>銷售日期</th>
                  <th style={{ textAlign: 'center' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {sales.map(s => {
                  return (
                    <tr key={s.id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>#{s.id.slice(0, 8)}</td>
                      <td style={{ fontWeight: 500 }}>{s.products?.name || '未知產品'}</td>
                      <td>{s.customers?.name || '未知客戶'}</td>
                      <td>{s.quantity}</td>
                      <td>{s.total_amount?.toLocaleString()}</td>
                      <td>{new Date(s.date).toLocaleString()}</td>
                      <td>
                        <div className="flex justify-center gap-2">
                          <button 
                            className="btn btn-ghost btn-sm" 
                            style={{ padding: '0.25rem' }} 
                            onClick={() => handleOpenEditModal(s)}
                            title="編輯"
                          >
                            <Edit2 size={16} className="text-primary" />
                          </button>
                          <button 
                            className="btn btn-ghost btn-sm" 
                            style={{ padding: '0.25rem' }} 
                            onClick={() => handleDelete(s.id)}
                            title="刪除"
                          >
                            <Trash2 size={16} style={{ color: '#ef4444' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {sales.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>尚未有銷售紀錄</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? "編輯銷售紀錄" : "記錄新銷售"}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="flex flex-col gap-2">
            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>選擇產品</label>
            <select
              required
              value={formData.productId}
              onChange={(e) => {
                const pid = e.target.value;
                setFormData({ 
                  ...formData, 
                  productId: pid,
                  total: calculateTotal(pid, formData.quantity)
                });
              }}
              style={{ padding: '0.625rem', border: '1px solid var(--border)', borderRadius: '0.375rem', backgroundColor: 'transparent', color: 'inherit' }}
            >
              <option value="">請選擇產品...</option>
              {products.map(p => {
                const effectiveStock = isEditMode && p.id === editingSale.product_id ? p.stock + editingSale.quantity : p.stock;
                return (
                  <option key={p.id} value={p.id} disabled={effectiveStock <= 0}>
                    {p.name} (庫存: {effectiveStock})
                  </option>
                );
              })}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>選擇客戶</label>
            <select
              required
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              style={{ padding: '0.625rem', border: '1px solid var(--border)', borderRadius: '0.375rem', backgroundColor: 'transparent', color: 'inherit' }}
            >
              <option value="">請選擇客戶...</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="flex flex-col gap-2">
              <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                銷售數量 ({products.find(p => p.id === formData.productId)?.base_unit || '包'})
              </label>
              <input
                required
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => {
                  const qty = Number(e.target.value);
                  setFormData({ 
                    ...formData, 
                    quantity: qty,
                    total: calculateTotal(formData.productId, qty)
                  });
                }}
                style={{ padding: '0.625rem', border: '1px solid var(--border)', borderRadius: '0.375rem', backgroundColor: 'transparent', color: 'inherit' }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>總金額 (自動計算)</label>
              <input
                readOnly
                type="number"
                value={formData.total}
                style={{ padding: '0.625rem', border: '1px solid var(--border)', borderRadius: '0.375rem', backgroundColor: 'var(--bg-main)', color: 'var(--text-muted)' }}
              />
            </div>
          </div>
          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>取消</button>
            <button type="submit" className="btn btn-primary">{isEditMode ? "儲存修改" : "確認出庫"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Sales;
