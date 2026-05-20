import { createContext, useContext, useState, useCallback } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [discount, setDiscount] = useState(0);
  // const [customer, setCustomer] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  const addItem = useCallback((medicine, unit = 'PIECE', qty = 1) => {
    setItems(prev => {
      const exists = prev.find(i => i.medicineId === medicine.id && i.sellingUnit === unit);
      if (exists) {
        return prev.map(i =>
          i.medicineId === medicine.id && i.sellingUnit === unit
            ? { ...i, quantity: i.quantity + qty }
            : i
        );
      }
      return [...prev, {
        medicineId: medicine.id,
        name: medicine.name,
        barcode: medicine.barcode,
        sellingUnit: unit,
        quantity: qty,
        sellingPrice: parseFloat(medicine.retailPrice),
        purchasePrice: parseFloat(medicine.purchasePrice),
        piecesPerStrip: medicine.piecesPerStrip || 1,
        stripsPerBox: medicine.stripsPerBox || 1,
        boxesPerDozen: medicine.boxesPerDozen || 12,
        maxStock: medicine.stockQuantity,
      }];
    });
  }, []);

  const updateQty = useCallback((medicineId, unit, qty) => {
    if (qty <= 0) { removeItem(medicineId, unit); return; }
    setItems(prev => prev.map(i =>
      i.medicineId === medicineId && i.sellingUnit === unit ? { ...i, quantity: qty } : i
    ));
  }, []);

  const updatePrice = useCallback((medicineId, unit, price) => {
    setItems(prev => prev.map(i =>
      i.medicineId === medicineId && i.sellingUnit === unit ? { ...i, sellingPrice: parseFloat(price) } : i
    ));
  }, []);

  const removeItem = useCallback((medicineId, unit) => {
    setItems(prev => prev.filter(i => !(i.medicineId === medicineId && i.sellingUnit === unit)));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setDiscount(0);
    setPaymentMethod('CASH');
  }, []);

  const subtotal = items.reduce((sum, i) => sum + i.sellingPrice * i.quantity, 0);
  const discountAmount = parseFloat(discount) || 0;
  const totalAmount = Math.max(0, subtotal - discountAmount);

  return (
    <CartContext.Provider value={{
      items, addItem, updateQty, updatePrice, removeItem, clearCart,
      discount, setDiscount,
      // customer, setCustomer,
      paymentMethod, setPaymentMethod,
      subtotal, discountAmount, totalAmount,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be inside CartProvider');
  return ctx;
};
