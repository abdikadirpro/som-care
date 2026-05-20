/**
 * Convert quantity from one unit to pieces (base unit).
 * medicine: { piecesPerStrip, stripsPerBox, boxesPerDozen, boxesPerCarton }
 */
const toPieces = (qty, unit, medicine) => {
  const pps = medicine.piecesPerStrip || 1;
  const spb = medicine.stripsPerBox || 1;
  const bpd = medicine.boxesPerDozen || 12;
  const bpc = medicine.boxesPerCarton || 1;

  switch (unit) {
    case 'PIECE':    return qty;
    case 'STRIP':    return qty * pps;
    case 'BOX':      return qty * pps * spb;
    case 'DOZEN':    return qty * pps * spb * bpd;
    case 'SUB_DOZEN': return qty * pps * spb * Math.floor(bpd / 2);
    case 'CARTON':   return qty * pps * spb * bpc;
    default:         return qty;
  }
};

/**
 * Get unit price based on selling unit from medicine prices.
 */
const getUnitPrice = (unit, medicine, priceType = 'retail') => {
  const pps = medicine.piecesPerStrip || 1;
  const spb = medicine.stripsPerBox || 1;
  const bpd = medicine.boxesPerDozen || 12;
  const bpc = medicine.boxesPerCarton || 1;

  const basePrice =
    priceType === 'wholesale'
      ? parseFloat(medicine.wholesalePrice || medicine.retailPrice)
      : parseFloat(medicine.retailPrice);

  switch (unit) {
    case 'PIECE':    return basePrice;
    case 'STRIP':    return basePrice * pps;
    case 'BOX':      return basePrice * pps * spb;
    case 'DOZEN':    return basePrice * pps * spb * bpd;
    case 'SUB_DOZEN': return basePrice * pps * spb * Math.floor(bpd / 2);
    case 'CARTON':   return basePrice * pps * spb * bpc;
    default:         return basePrice;
  }
};

module.exports = { toPieces, getUnitPrice };
