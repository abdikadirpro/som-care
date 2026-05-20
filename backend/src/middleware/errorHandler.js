const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err.code === 'P2002') {
    const rawTarget = Array.isArray(err.meta?.target)
      ? err.meta.target.join(', ')
      : String(err.meta?.target || '');
    const FIELD_LABELS = {
      sku: 'SKU', barcode: 'Barcode', email: 'Email',
      phone: 'Phone', slug: 'Name (slug)', invoice_no: 'Invoice number',
      setting_key: 'Setting key',
    };
    const field = rawTarget.replace(/.*_(.+?)_key$/, '$1');
    const label = FIELD_LABELS[field] || field;
    return res.status(409).json({ success: false, message: `${label} already exists. Please use a different value or leave it blank.` });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ success: false, message: 'Record not found' });
  }
  if (err.code === 'P2003') {
    return res.status(409).json({ success: false, message: 'Cannot delete: this record is referenced by other data (sales, purchases, or inventory records).' });
  }
  if (err.code === 'P2014') {
    return res.status(409).json({ success: false, message: 'Cannot delete: related records exist.' });
  }
  if (err.name === 'ValidationError') {
    return res.status(422).json({ success: false, message: err.message });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
};

module.exports = errorHandler;
