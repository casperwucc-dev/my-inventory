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

  const updateSale = async (id, updatedSale) => {
    const originalSale = sales.find(s => s.id === id);
    if (!originalSale) return;

    const { error: updateError } = await supabase
      .from('sales')
      .update({
        product_id: updatedSale.productId,
        customer_id: updatedSale.customerId,
        quantity: updatedSale.quantity,
        unit_price: updatedSale.unitPrice,
        total_amount: updatedSale.totalAmount
      })
      .eq('id', id);
    handleError(updateError, 'Error updating sale');

    // Handle stock adjustment
    if (originalSale.product_id === updatedSale.productId) {
      // Same product, adjust quantity difference
      const product = products.find(p => p.id === updatedSale.productId);
      const diff = updatedSale.quantity - originalSale.quantity;
      const { error: stockError } = await supabase
        .from('products')
        .update({ stock: product.stock - diff })
        .eq('id', updatedSale.productId);
      handleError(stockError, 'Error updating stock');
    } else {
      // Different product, restore old and subtract new
      const oldProduct = products.find(p => p.id === originalSale.product_id);
      const newProduct = products.find(p => p.id === updatedSale.productId);
      
      if (oldProduct) {
        await supabase.from('products').update({ stock: oldProduct.stock + originalSale.quantity }).eq('id', originalSale.product_id);
      }
      if (newProduct) {
        await supabase.from('products').update({ stock: newProduct.stock - updatedSale.quantity }).eq('id', updatedSale.productId);
      }
    }

    fetchInventoryData();
  };

  const deleteSale = async (id) => {
    const saleToDelete = sales.find(s => s.id === id);
    if (!saleToDelete) return;

    const { error: deleteError } = await supabase
      .from('sales')
      .delete()
      .eq('id', id);
    handleError(deleteError, 'Error deleting sale');

    const product = products.find(p => p.id === saleToDelete.product_id);
    if (product) {
      const { error: stockError } = await supabase
        .from('products')
        .update({ stock: product.stock + saleToDelete.quantity })
        .eq('id', saleToDelete.product_id);
      handleError(stockError, 'Error updating stock');
    }

    fetchInventoryData();
  };

  const updatePurchase = async (id, updatedPurchase) => {
    const original = purchases.find(p => p.id === id);
    if (!original) return;

    // Update purchase record
    const { error: updateError } = await supabase
      .from('purchases')
      .update({
        product_id: updatedPurchase.productId,
        supplier_id: updatedPurchase.supplierId,
        quantity: updatedPurchase.quantity,
        unit_price: updatedPurchase.unitPrice,
        total_amount: updatedPurchase.totalAmount
      })
      .eq('id', id);
    handleError(updateError, 'Error updating purchase');

    // Handle stock adjustment
    if (original.product_id === updatedPurchase.productId) {
      // Same product, adjust quantity difference
      const product = products.find(p => p.id === updatedPurchase.productId);
      const rate = product?.conversion_rate || 1;
      const diffBase = (updatedPurchase.quantity - original.quantity) * rate;
      
      const { error: stockError } = await supabase
        .from('products')
        .update({ stock: product.stock + diffBase })
        .eq('id', updatedPurchase.productId);
      handleError(stockError, 'Error updating stock');
    } else {
      // Different product, restore old and subtract new
      const oldP = products.find(p => p.id === original.product_id);
      const newP = products.find(p => p.id === updatedPurchase.productId);
      
      if (oldP) {
        const oldRemovedQty = original.quantity * (oldP.conversion_rate || 1);
        await supabase.from('products').update({ stock: oldP.stock - oldRemovedQty }).eq('id', original.product_id);
      }
      if (newP) {
        const newAddedQty = updatedPurchase.quantity * (newP.conversion_rate || 1);
        await supabase.from('products').update({ stock: newP.stock + newAddedQty }).eq('id', updatedPurchase.productId);
      }
    }

    fetchInventoryData();
  };

  const deletePurchase = async (id) => {
    const pToDelete = purchases.find(p => p.id === id);
    if (!pToDelete) return;

    // Remove from purchases
    const { error: deleteError } = await supabase
      .from('purchases')
      .delete()
      .eq('id', id);
    handleError(deleteError, 'Error deleting purchase');

    // Restore stock (subtract the quantity added)
    const product = products.find(p => p.id === pToDelete.product_id);
    if (product) {
      const removedQty = pToDelete.quantity * (product.conversion_rate || 1);
      const { error: stockError } = await supabase
        .from('products')
        .update({ stock: product.stock - removedQty })
        .eq('id', pToDelete.product_id);
      handleError(stockError, 'Error updating stock');
    }

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
    updateSale,
    deleteSale,
    updatePurchase,
    deletePurchase,
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
      accounting_item: transaction.accountingItem,
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
