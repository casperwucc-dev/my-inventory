import { useInventory, usePettyCash } from '../hooks/useInventory';
import StatCard from '../components/Dashboard/StatCard';
import { Box, ShoppingCart, TrendingUp, AlertTriangle, Wallet, Loader2 } from 'lucide-react';

const Dashboard = () => {
  const { products, purchases, sales, loading } = useInventory();
  const { balance: pettyCashBalance } = usePettyCash();

  const totalStock = products.reduce((acc, p) => acc + (p.stock || 0), 0);
  const lowStockCount = products.filter(p => (p.stock || 0) <= (p.minStockAlert || 5)).length;
  const totalPurchases = purchases.length;
  const totalSales = sales.length;

  return (
    <div className="dashboard-page">
      <header className="m-b-6">
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>儀表板概覽</h1>
        <p style={{ color: 'var(--text-muted)' }}>歡迎回來，這是您今天的庫存摘要。</p>
      </header>

      {loading && products.length === 0 ? (
        <div className="flex items-center justify-center" style={{ minHeight: '300px' }}>
          <Loader2 className="animate-spin text-primary" size={40} />
          <span style={{ marginLeft: '1rem', color: 'var(--text-muted)' }}>資料載入中...</span>
        </div>
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            <StatCard
              title="總庫存量"
              value={totalStock.toLocaleString()}
              icon={<Box size={24} />}
              color="#6366f1"
            />
            <StatCard
              title="低庫存警示"
              value={lowStockCount}
              icon={<AlertTriangle size={24} />}
              color="#ef4444"
            />
            <StatCard
              title="本月進貨數"
              value={totalPurchases}
              icon={<ShoppingCart size={24} />}
              color="#10b981"
            />
            <StatCard
              title="本月銷售數"
              value={totalSales}
              icon={<TrendingUp size={24} />}
              color="#f59e0b"
            />
            <StatCard
              title="零用金餘額"
              value={`NT$ ${(pettyCashBalance || 0).toLocaleString()}`}
              icon={<Wallet size={24} />}
              color="var(--primary-light)"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <section className="card">
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>最近進貨</h2>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>產品名稱</th>
                      <th>數量</th>
                      <th>日期</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.slice(0, 5).map(p => {
                      const product = products.find(prod => prod.id === p.product_id);
                      return (
                        <tr key={p.id}>
                          <td>{product?.name || p.products?.name || '未知產品'}</td>
                          <td>{p.quantity}</td>
                          <td>{new Date(p.date).toLocaleDateString()}</td>
                        </tr>
                      );
                    })}
                    {purchases.length === 0 && (
                      <tr>
                        <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>暫無進貨紀錄</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="card">
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>最近銷售</h2>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>產品名稱</th>
                      <th>數量</th>
                      <th>日期</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.slice(0, 5).map(s => {
                      const product = products.find(prod => prod.id === s.product_id);
                      return (
                        <tr key={s.id}>
                          <td>{product?.name || s.products?.name || '未知產品'}</td>
                          <td>{s.quantity}</td>
                          <td>{new Date(s.date).toLocaleDateString()}</td>
                        </tr>
                      );
                    })}
                    {sales.length === 0 && (
                      <tr>
                        <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>暫無銷售紀錄</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
