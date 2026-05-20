const generateInvoiceNo = (prefix = 'INV') => {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${date}-${random}`;
};

module.exports = { generateInvoiceNo };
