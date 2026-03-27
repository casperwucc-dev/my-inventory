/**
 * Data Schema Definitions
 */

export const INITIAL_DATA = {
  products: [
    { id: '1', name: '智能手機', category: '電子產品', price: 15000, stock: 50, minStockAlert: 10 },
    { id: '2', name: '無線耳機', category: '電子產品', price: 3500, stock: 120, minStockAlert: 20 },
    { id: '3', name: '筆記型電腦', category: '辦公設備', price: 45000, stock: 15, minStockAlert: 5 },
    { id: '4', name: '人體工學椅', category: '辦公家具', price: 8000, stock: 8, minStockAlert: 10 },
  ],
  purchases: [],
  sales: [],
  suppliers: [
    { id: 's1', name: '宏碁電子', contact: '王先生', phone: '02-12345678', address: '台北市大安區' },
    { id: 's2', name: '華碩科技', contact: '李小姐', phone: '02-87654321', address: '台北市北投區' },
  ],
  customers: [
    { id: 'c1', name: '個人客戶-張三', contact: '張三', phone: '0912345678', address: '新北市板橋區' },
  ]
};

export const generateId = () => Math.random().toString(36).substr(2, 9);
