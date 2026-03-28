import React, { useState } from 'react';
import { useInventory, useSuppliers } from '../hooks/useInventory';
import { Plus, ShoppingCart, Search, Calendar, Loader2, Edit2, Trash2 } from 'lucide-react';
import Modal from '../components/Common/Modal';

const Purchases = () => {
  const { products, purchases, recordPurchase, updatePurchase, deletePurchase, loading: inventoryLoading } = useInventory();
  const { suppliers, loading: suppliersLoading } = useSuppliers();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [formData, setFormData] = useState({
    productId: '',
    quantity: 1,
    supplierId: '',
    cost: 0
  });

  const loading = inventoryLoading || suppliersLoading;

  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setEditingPurchase(null);
    setFormData({ productId: '', quantity: 1, supplierId: '', cost: 0 });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (purchase) => {
    setIsEditMode(true);
    setEditingPurchase(purchase);
    setFormData({
      productId: purchase.product_id,
      quantity: purchase.quantity,
      supplierId: purchase.supplier_id,
      cost: purchase.total_amount
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('確定要刪除這筆進貨紀錄嗎？這將會從庫存中扣除相應數量。')) {
      await deletePurchase(id);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const purchaseData = {
      productId: formData.productId,
      supplierId: formData.supplierId,
      quantity: formData.quantity,
      unitPrice: formData.cost / formData.quantity,
      totalAmount: formData.cost
    };

    if (isEditMode) {
      await updatePurchase(editingPurchase.id, purchaseData);
    } else {
      await recordPurchase(purchaseData);
    }
    
    setIsModalOpen(false);
    setFormData({ productId: '', quantity: 1, supplierId: '', cost: 0 });
  };

  return (
    <div className="purchases-page">
      <header className="flex justify-between items-center m-b-6">
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>進貨管理</h1>
          <p style={{ color: 'var(--text-muted)' }}>記錄每一筆進貨明細並自動更新庫存。</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          <Plus size={20} />
          記錄新進貨
        </button>
      </header>

      {loading && purchases.length === 0 ? (
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
                  <th>交易序號</th>
                  <th>產品名稱</th>
                  <th>供應商</th>
                  <th>數量</th>
                  <th>總成本 (NT$)</th>
                  <th>進貨日期</th>
                  <th style={{ textAlign: 'center' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map(p => {
                  return (
                    <tr key={p.id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>#{p.id.slice(0, 8)}</td>
                      <td style={{ fontWeight: 500 }}>{p.products?.name || '未知產品'}</td>
                      <td>{p.suppliers?.name || '未知廠商'}</td>
                      <td>{p.quantity}</td>
                      <td>{p.total_amount?.toLocaleString()}</td>
                      <td>{new Date(p.date).toLocaleString()}</td>
                      <td>
                        <div className="flex justify-center gap-2">
                          <button 
                            className="btn btn-ghost btn-sm" 
                            style={{ padding: '0.25rem' }} 
                            onClick={() => handleOpenEditModal(p)}
                            title="編輯"
                          >
                            <Edit2 size={16} className="text-primary" />
                          </button>
                          <button 
                            className="btn btn-ghost btn-sm" 
                            style={{ padding: '0.25rem' }} 
                            onClick={() => handleDelete(p.id)}
                            title="刪除"
                          >
                            <Trash2 size={16} style={{ color: '#ef4444' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {purchases.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>尚未有進貨紀錄</td>
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
        title={isEditMode ? "編輯進貨紀錄" : "記錄新進貨"}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="flex flex-col gap-2">
            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>選擇產品</label>
            <select
              required
              value={formData.productId}
              onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
              style={{ padding: '0.625rem', border: '1px solid var(--border)', borderRadius: '0.375rem', backgroundColor: 'transparent', color: 'inherit' }}
            >
              <option value="">請選擇產品...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} (當前庫存: {p.stock})</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>選擇廠商</label>
            <select
              required
              value={formData.supplierId}
              onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
              style={{ padding: '0.625rem', border: '1px solid var(--border)', borderRadius: '0.375rem', backgroundColor: 'transparent', color: 'inherit' }}
            >
              <option value="">請選擇廠商...</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="flex flex-col gap-2">
              <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                進貨數量 ({products.find(p => p.id === formData.productId)?.purchase_unit || '箱'})
              </label>
              <input
                required
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                style={{ padding: '0.625rem', border: '1px solid var(--border)', borderRadius: '0.375rem', backgroundColor: 'transparent', color: 'inherit' }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>總進貨成本</label>
              <input
                required
                type="number"
                min="0"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                style={{ padding: '0.625rem', border: '1px solid var(--border)', borderRadius: '0.375rem', backgroundColor: 'transparent', color: 'inherit' }}
              />
            </div>
          </div>
          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>取消</button>
            <button type="submit" className="btn btn-primary">{isEditMode ? "儲存修改" : "確認入庫"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Purchases;
