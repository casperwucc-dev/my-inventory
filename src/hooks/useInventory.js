import { useState, useEffect } from 'react';
import { INITIAL_DATA } from '../utils/dataSchema';

export const useInventory = () => {
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem('inventory_app_data');
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  });

  useEffect(() => {
    localStorage.setItem('inventory_app_data', JSON.stringify(data));
  }, [data]);

  const addProduct = (product) => {
    setData(prev => ({
      ...prev,
      products: [...prev.products, { ...product, id: Date.now().toString() }]
    }));
  };

  const updateProduct = (id, updatedProduct) => {
    setData(prev => ({
      ...prev,
      products: prev.products.map(p => p.id === id ? { ...p, ...updatedProduct } : p)
    }));
  };

  const deleteProduct = (id) => {
    setData(prev => ({
      ...prev,
      products: prev.products.filter(p => p.id !== id)
    }));
  };

  const recordPurchase = (purchase) => {
    const newPurchase = { ...purchase, id: Date.now().toString(), date: new Date().toISOString() };
    setData(prev => {
      const updatedProducts = prev.products.map(p => 
        p.id === purchase.productId ? { ...p, stock: p.stock + purchase.quantity } : p
      );
      return {
        ...prev,
        purchases: [newPurchase, ...prev.purchases],
        products: updatedProducts
      };
    });
  };

  const recordSale = (sale) => {
    const newSale = { ...sale, id: Date.now().toString(), date: new Date().toISOString() };
    setData(prev => {
      const updatedProducts = prev.products.map(p => 
        p.id === sale.productId ? { ...p, stock: p.stock - sale.quantity } : p
      );
      return {
        ...prev,
        sales: [newSale, ...prev.sales],
        products: updatedProducts
      };
    });
  };

  return {
    products: data.products,
    purchases: data.purchases,
    sales: data.sales,
    suppliers: data.suppliers,
    customers: data.customers,
    addProduct,
    updateProduct,
    deleteProduct,
    recordPurchase,
    recordSale
  };
};

export const useSuppliers = () => {
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem('inventory_app_data');
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  });

  useEffect(() => {
    localStorage.setItem('inventory_app_data', JSON.stringify(data));
  }, [data]);

  const addSupplier = (supplier) => {
    setData(prev => ({
      ...prev,
      suppliers: [...prev.suppliers, { ...supplier, id: 's' + Date.now().toString() }]
    }));
  };

  const updateSupplier = (id, updated) => {
    setData(prev => ({
      ...prev,
      suppliers: prev.suppliers.map(s => s.id === id ? { ...s, ...updated } : s)
    }));
  };

  const deleteSupplier = (id) => {
    setData(prev => ({
      ...prev,
      suppliers: prev.suppliers.filter(s => s.id !== id)
    }));
  };

  return { suppliers: data.suppliers, addSupplier, updateSupplier, deleteSupplier };
};

export const useCustomers = () => {
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem('inventory_app_data');
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  });

  useEffect(() => {
    localStorage.setItem('inventory_app_data', JSON.stringify(data));
  }, [data]);

  const addCustomer = (customer) => {
    setData(prev => ({
      ...prev,
      customers: [...prev.customers, { ...customer, id: 'c' + Date.now().toString() }]
    }));
  };

  const updateCustomer = (id, updated) => {
    setData(prev => ({
      ...prev,
      customers: prev.customers.map(c => c.id === id ? { ...c, ...updated } : c)
    }));
  };

  const deleteCustomer = (id) => {
    setData(prev => ({
      ...prev,
      customers: prev.customers.filter(c => c.id !== id)
    }));
  };

  return { customers: data.customers, addCustomer, updateCustomer, deleteCustomer };
};
