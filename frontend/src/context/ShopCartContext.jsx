import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ShopCartContext = createContext(null);

export const ShopCartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('shopCart') || '[]'); }
    catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('shopCart', JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((medicine, qty = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.medicineId === medicine.id);
      if (existing) {
        return prev.map(i =>
          i.medicineId === medicine.id
            ? { ...i, quantity: Math.min(i.quantity + qty, medicine.stockQuantity) }
            : i
        );
      }
      return [...prev, {
        medicineId: medicine.id,
        name: medicine.name,
        genericName: medicine.genericName,
        form: medicine.form,
        strength: medicine.strength,
        price: parseFloat(medicine.retailPrice),
        maxStock: medicine.stockQuantity,
        quantity: qty,
      }];
    });
  }, []);

  const updateQty = useCallback((medicineId, qty) => {
    if (qty <= 0) { removeItem(medicineId); return; }
    setItems(prev => prev.map(i => i.medicineId === medicineId ? { ...i, quantity: qty } : i));
  }, []);

  const removeItem = useCallback((medicineId) => {
    setItems(prev => prev.filter(i => i.medicineId !== medicineId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const total    = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const count    = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <ShopCartContext.Provider value={{ items, addItem, updateQty, removeItem, clearCart, total, count }}>
      {children}
    </ShopCartContext.Provider>
  );
};

export const useShopCart = () => {
  const ctx = useContext(ShopCartContext);
  if (!ctx) throw new Error('useShopCart must be inside ShopCartProvider');
  return ctx;
};
