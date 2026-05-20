const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Settings
  const settings = [
    { settingKey: 'currency', settingValue: 'ETB' },
    { settingKey: 'pharmacy_name', settingValue: 'Som Care Pharmacy' },
    { settingKey: 'tax_percent', settingValue: '15' },
    { settingKey: 'low_stock_alert', settingValue: '5' },
    { settingKey: 'support_phone', settingValue: '+251900000000' },
  ];
  for (const s of settings) {
    await prisma.setting.upsert({ where: { settingKey: s.settingKey }, update: s, create: s });
  }

  // Super Admin
  const hash = await bcrypt.hash('Admin@123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@somcare.com' },
    update: {},
    create: { firstName: 'Super', lastName: 'Admin', email: 'admin@somcare.com', password: hash, role: 'SUPER_ADMIN', phone: '+251900000001' },
  });

  await prisma.user.upsert({
    where: { email: 'cashier@somcare.com' },
    update: {},
    create: { firstName: 'Ahmed', lastName: 'Cashier', email: 'cashier@somcare.com', password: await bcrypt.hash('Cashier@123', 12), role: 'CASHIER', phone: '+251900000002' },
  });

  await prisma.user.upsert({
    where: { email: 'pharmacist@somcare.com' },
    update: {},
    create: { firstName: 'Sara', lastName: 'Pharmacist', email: 'pharmacist@somcare.com', password: await bcrypt.hash('Pharma@123', 12), role: 'PHARMACIST', phone: '+251900000003' },
  });

  // Categories
  const categories = [
    { name: 'Antibiotics', slug: 'antibiotics', icon: 'MdOutlineScience', description: 'Antibiotic medicines' },
    { name: 'Analgesics', slug: 'analgesics', icon: 'MdOutlineLocalHospital', description: 'Pain relief medicines' },
    { name: 'Vitamins & Supplements', slug: 'vitamins-supplements', icon: 'GiPill', description: 'Vitamins and dietary supplements' },
    { name: 'Antidiabetics', slug: 'antidiabetics', icon: 'GiMedicines', description: 'Diabetes management medicines' },
    { name: 'Cardiovascular', slug: 'cardiovascular', icon: 'MdFavorite', description: 'Heart and blood pressure medicines' },
    { name: 'Gastrointestinal', slug: 'gastrointestinal', icon: 'GiStomach', description: 'Digestive system medicines' },
    { name: 'Respiratory', slug: 'respiratory', icon: 'GiLungs', description: 'Respiratory medicines' },
    { name: 'Dermatology', slug: 'dermatology', icon: 'MdOutlineSpa', description: 'Skin care medicines' },
    { name: 'Medical Devices', slug: 'medical-devices', icon: 'GiMedicalPack', description: 'Medical equipment and devices' },
    { name: 'Syrups & Liquids', slug: 'syrups-liquids', icon: 'GiBottle', description: 'Liquid medicines and syrups' },
  ];

  const categoryMap = {};
  for (const cat of categories) {
    const created = await prisma.category.upsert({ where: { slug: cat.slug }, update: {}, create: cat });
    categoryMap[cat.slug] = created.id;
  }

  // Suppliers
  const suppliers = [
    { name: 'Ethiopian Pharmaceutical Supply Agency', contactPerson: 'Dr. Mulugeta', phone: '+251111234567', email: 'epsa@ethiopia.gov.et', city: 'Addis Ababa' },
    { name: 'Medtech Medical Supplies', contactPerson: 'Ahmed Hassan', phone: '+251911234567', email: 'info@medtech.et', city: 'Addis Ababa' },
    { name: 'Dashen Pharma Distributors', contactPerson: 'Tigist Bekele', phone: '+251921234567', email: 'dashen@pharma.et', city: 'Hawassa' },
  ];

  const supplierIds = [];
  for (const sup of suppliers) {
    const created = await prisma.supplier.create({ data: sup });
    supplierIds.push(created.id);
  }

  // Medicines
  const medicines = [
    { name: 'Amoxicillin 500mg', genericName: 'Amoxicillin', manufacturer: 'Julphar', dosage: '500mg', strength: '500mg', form: 'CAPSULE', purchasePrice: 8, retailPrice: 15, wholesalePrice: 12, piecesPerStrip: 10, stripsPerBox: 10, stockQuantity: 500, minimumStock: 50, expiryDate: new Date('2026-12-31'), categorySlug: 'antibiotics', barcode: '6291007050811' },
    { name: 'Paracetamol 500mg', genericName: 'Paracetamol', manufacturer: 'GSK', dosage: '500mg', strength: '500mg', form: 'TABLET', purchasePrice: 2, retailPrice: 4, wholesalePrice: 3, piecesPerStrip: 10, stripsPerBox: 20, stockQuantity: 2000, minimumStock: 100, expiryDate: new Date('2026-06-30'), categorySlug: 'analgesics', barcode: '6291007050812' },
    { name: 'Metformin 500mg', genericName: 'Metformin HCl', manufacturer: 'Sun Pharma', dosage: '500mg', strength: '500mg', form: 'TABLET', purchasePrice: 5, retailPrice: 10, wholesalePrice: 8, piecesPerStrip: 10, stripsPerBox: 10, stockQuantity: 300, minimumStock: 30, expiryDate: new Date('2026-09-30'), categorySlug: 'antidiabetics', barcode: '6291007050813', prescriptionRequired: true },
    { name: 'Omeprazole 20mg', genericName: 'Omeprazole', manufacturer: 'Cipla', dosage: '20mg', strength: '20mg', form: 'CAPSULE', purchasePrice: 10, retailPrice: 20, wholesalePrice: 15, piecesPerStrip: 10, stripsPerBox: 10, stockQuantity: 400, minimumStock: 40, expiryDate: new Date('2026-08-31'), categorySlug: 'gastrointestinal', barcode: '6291007050814' },
    { name: 'Cetirizine 10mg', genericName: 'Cetirizine HCl', manufacturer: 'UCB', dosage: '10mg', strength: '10mg', form: 'TABLET', purchasePrice: 3, retailPrice: 6, wholesalePrice: 5, piecesPerStrip: 10, stripsPerBox: 10, stockQuantity: 600, minimumStock: 50, expiryDate: new Date('2027-01-31'), categorySlug: 'respiratory', barcode: '6291007050815' },
    { name: 'Vitamin C 500mg', genericName: 'Ascorbic Acid', manufacturer: 'Nature\'s Bounty', dosage: '500mg', strength: '500mg', form: 'TABLET', purchasePrice: 4, retailPrice: 8, wholesalePrice: 6, piecesPerStrip: 10, stripsPerBox: 10, stockQuantity: 1000, minimumStock: 100, expiryDate: new Date('2027-03-31'), categorySlug: 'vitamins-supplements', barcode: '6291007050816' },
    { name: 'Amlodipine 5mg', genericName: 'Amlodipine Besylate', manufacturer: 'Pfizer', dosage: '5mg', strength: '5mg', form: 'TABLET', purchasePrice: 12, retailPrice: 25, wholesalePrice: 20, piecesPerStrip: 10, stripsPerBox: 3, stockQuantity: 200, minimumStock: 20, expiryDate: new Date('2026-11-30'), categorySlug: 'cardiovascular', barcode: '6291007050817', prescriptionRequired: true },
    { name: 'ORS Sachets', genericName: 'Oral Rehydration Salts', manufacturer: 'WHO Standard', dosage: '1 Sachet', strength: '5g', form: 'POWDER', purchasePrice: 3, retailPrice: 5, wholesalePrice: 4, piecesPerStrip: 1, stripsPerBox: 20, stockQuantity: 500, minimumStock: 50, expiryDate: new Date('2027-06-30'), categorySlug: 'gastrointestinal', barcode: '6291007050818' },
    { name: 'Ibuprofen 400mg', genericName: 'Ibuprofen', manufacturer: 'Reckitt', dosage: '400mg', strength: '400mg', form: 'TABLET', purchasePrice: 5, retailPrice: 10, wholesalePrice: 8, piecesPerStrip: 10, stripsPerBox: 10, stockQuantity: 8, minimumStock: 30, expiryDate: new Date('2026-04-30'), categorySlug: 'analgesics', barcode: '6291007050819' },
    { name: 'Albendazole 400mg', genericName: 'Albendazole', manufacturer: 'GSK', dosage: '400mg', strength: '400mg', form: 'TABLET', purchasePrice: 6, retailPrice: 12, wholesalePrice: 9, piecesPerStrip: 1, stripsPerBox: 10, stockQuantity: 250, minimumStock: 20, expiryDate: new Date('2027-02-28'), categorySlug: 'antibiotics', barcode: '6291007050820' },
    { name: 'Cough Syrup 100ml', genericName: 'Dextromethorphan + Guaifenesin', manufacturer: 'Benadryl', dosage: '10ml/dose', strength: '15mg/5ml', form: 'SYRUP', purchasePrice: 30, retailPrice: 55, wholesalePrice: 45, piecesPerStrip: 1, stripsPerBox: 1, stockQuantity: 80, minimumStock: 15, expiryDate: new Date('2026-10-31'), categorySlug: 'syrups-liquids', barcode: '6291007050821' },
    { name: 'Clotrimazole Cream 1%', genericName: 'Clotrimazole', manufacturer: 'Bayer', dosage: 'Topical', strength: '1%', form: 'CREAM', purchasePrice: 25, retailPrice: 45, wholesalePrice: 38, piecesPerStrip: 1, stripsPerBox: 1, stockQuantity: 3, minimumStock: 10, expiryDate: new Date('2026-05-31'), categorySlug: 'dermatology', barcode: '6291007050822' },
  ];

  for (const med of medicines) {
    const { categorySlug, ...medData } = med;
    const existing = await prisma.medicine.findUnique({ where: { barcode: medData.barcode } });
    if (!existing) {
      const slug = medData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
      await prisma.medicine.create({
        data: {
          ...medData,
          slug,
          sku: `SKU-${Date.now()}-${Math.random().toString(36).substr(2,4).toUpperCase()}`,
          categoryId: categoryMap[categorySlug],
          supplierId: supplierIds[Math.floor(Math.random() * supplierIds.length)],
        },
      });
    }
  }

  // Sample customers
  const customers = [
    { firstName: 'Mohammed', lastName: 'Ali', phone: '+251911111111', email: 'mohammed@gmail.com' },
    { firstName: 'Fatima', lastName: 'Hassan', phone: '+251922222222', email: 'fatima@gmail.com' },
    { firstName: 'Abdi', lastName: 'Omar', phone: '+251933333333' },
  ];
  for (const c of customers) {
    await prisma.customer.upsert({ where: { phone: c.phone }, update: {}, create: c });
  }

  console.log('✅ Seeding completed!');
  console.log('📧 Admin: admin@somcare.com / Admin@123');
  console.log('📧 Cashier: cashier@somcare.com / Cashier@123');
  console.log('📧 Pharmacist: pharmacist@somcare.com / Pharma@123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
