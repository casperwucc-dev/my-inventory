import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

// Helper to handle Supabase errors
const handleError = (error, message) => {
  if (error) {
    console.error(`${message}:`, error.message);
    throw error;
  }
};

export const useInventory = () => {
  const [products, setProducts] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('name');
      
      if (productsError) {
        console.error('Error fetching products:', productsError.message);
      } else if (productsData) {
        setProducts(productsData.map(p => ({ ...p, minStockAlert: p.min_stock_alert })));
      }
      
      const { data: purchasesData, error: purchasesError } = await supabase
        .from('purchases')
        .select('*, products(name), suppliers(name)')
        .order('date', { ascending: false });
      
      if (purchasesError) {
        console.error('Error fetching purchases:', purchasesError.message);
      } else if (purchasesData) {
        setPurchases(purchasesData);
      }

      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*, products(name), customers(name)')
        .order('date', { ascending: false });
      
      if (salesError) {
        console.error('Error fetching sales:', salesError.message);
      } else if (salesData) {
        setSales(salesData);
      }
    } catch (err) {
      console.error('Unexpected error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const addProduct = async (product) => {
    const { data, error } = await supabase
      .from('products')
      .insert([{
        name: product.name,
        category: product.category,
        price: product.price,
        stock: product.stock,
        min_stock_alert: product.minStockAlert,
        conversion_rate: product.conversion_rate || 1,
        base_unit: product.base_unit || '包',
        purchase_unit: product.purchase_unit || '箱'
      }])
      .select();
    handleError(error, 'Error adding product');
    fetchInventoryData();
    return data[0];
  };

  const updateProduct = async (id, updatedProduct) => {
    const { error } = await supabase
      .from('products')
      .update({
        name: updatedProduct.name,
        category: updatedProduct.category,
        price: updatedProduct.price,
        stock: updatedProduct.stock,
        min_stock_alert: updatedProduct.minStockAlert,
        conversion_rate: updatedProduct.conversion_rate || 1,
        base_unit: updatedProduct.base_unit || '包',
        purchase_unit: updatedProduct.purchase_unit || '箱'
      })
      .eq('id', id);
    handleError(error, 'Error updating product');
    fetchInventoryData();
  };

  const deleteProduct = async (id) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    handleError(error, 'Error deleting product');
    fetchInventoryData();
  };

  const recordPurchase = async (purchase) => {
    const { error: purchaseError } = await supabase
      .from('purchases')
      .insert([{
        product_id: purchase.productId,
        supplier_id: purchase.supplierId,
        quantity: purchase.quantity,
        unit_price: purchase.unitPrice,
        total_amount: purchase.totalAmount
      }]);
    handleError(purchaseError, 'Error recording purchase');

    // Update stock
    const product = products.find(p => p.id === purchase.productId);
    const addedQty = purchase.quantity * (product?.conversion_rate || 1);
    
    const { error: stockError } = await supabase
      .from('products')
      .update({ stock: (product?.stock || 0) + addedQty })
      .eq('id', purchase.productId);
    handleError(stockError, 'Error updating product stock');

    fetchInventoryData();
  };

  const recordSale = async (sale) => {
    const { error: saleError } = await supabase
      .from('sales')
      .insert([{
        product_id: sale.productId,
        customer_id: sale.customerId,
        quantity: sale.quantity,
        unit_price: sale.unitPrice,
        total_amount: sale.totalAmount
      }]);
    handleError(saleError, 'Error recording sale');

    // Update stock
    const product = products.find(p => p.id === sale.productId);
    const { error: stockError } = await supabase
      .from('products')
      .update({ stock: product.stock - sale.quantity })
      .eq('id', sale.productId);
    handleError(stockError, 'Error updating product stock');

    fetchInventoryData();
  };

  return {
    products,
    purchases,
    sales,
    loading,
    addProduct,
    updateProduct,
    deleteProduct,
    recordPurchase,
    recordSale,
    refreshInventory: fetchInventoryData
  };
};

export const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSuppliers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name');
    if (!error) setSuppliers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const addSupplier = async (supplier) => {
    const { error } = await supabase.from('suppliers').insert([supplier]);
    handleError(error, 'Error adding supplier');
    fetchSuppliers();
  };

  const updateSupplier = async (id, updated) => {
    const { error } = await supabase.from('suppliers').update(updated).eq('id', id);
    handleError(error, 'Error updating supplier');
    fetchSuppliers();
  };

  const deleteSupplier = async (id) => {
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    handleError(error, 'Error deleting supplier');
    fetchSuppliers();
  };

  return { suppliers, loading, addSupplier, updateSupplier, deleteSupplier };
};

export const useCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name');
    if (!error) setCustomers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const addCustomer = async (customer) => {
    const { error } = await supabase.from('customers').insert([customer]);
    handleError(error, 'Error adding customer');
    fetchCustomers();
  };

  const updateCustomer = async (id, updated) => {
    const { error } = await supabase.from('customers').update(updated).eq('id', id);
    handleError(error, 'Error updating customer');
    fetchCustomers();
  };

  const deleteCustomer = async (id) => {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    handleError(error, 'Error deleting customer');
    fetchCustomers();
  };

  return { customers, loading, addCustomer, updateCustomer, deleteCustomer };
};

export const usePettyCash = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('petty_cash')
      .select('*')
      .order('date', { ascending: false });
    if (!error) setTransactions(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const addTransaction = async (transaction) => {
    const { error } = await supabase.from('petty_cash').insert([{
      type: transaction.type,
      amount: transaction.amount,
      category: transaction.category,
      payee: transaction.payee,
      description: transaction.description
    }]);
    handleError(error, 'Error adding transaction');
    fetchTransactions();
  };

  const deleteTransaction = async (id) => {
    const { error } = await supabase.from('petty_cash').delete().eq('id', id);
    handleError(error, 'Error deleting transaction');
    fetchTransactions();
  };

  const balance = transactions.reduce((acc, t) => {
    return t.type === 'income' ? acc + Number(t.amount) : acc - Number(t.amount);
  }, 0);

  return { transactions, balance, loading, addTransaction, deleteTransaction };
};
