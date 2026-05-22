const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Form-based placeholder images (Pexels free CDN — replace via admin upload for real photos)
const IMG = {
  TABLET:  'https://images.pexels.com/photos/163944/pexels-photo-163944.jpeg?auto=compress&cs=tinysrgb&w=400',
  CAPSULE: 'https://images.pexels.com/photos/3683095/pexels-photo-3683095.jpeg?auto=compress&cs=tinysrgb&w=400',
  SYRUP:   'https://images.pexels.com/photos/139398/pexels-photo-139398.jpeg?auto=compress&cs=tinysrgb&w=400',
  CREAM:   'https://images.pexels.com/photos/4046316/pexels-photo-4046316.jpeg?auto=compress&cs=tinysrgb&w=400',
  POWDER:  'https://images.pexels.com/photos/593451/pexels-photo-593451.jpeg?auto=compress&cs=tinysrgb&w=400',
};

async function main() {
  console.log('🌱 Seeding database...');

  // Settings
  const settings = [
    { settingKey: 'currency',         settingValue: 'ETB' },
    { settingKey: 'pharmacy_name',    settingValue: 'Som Care Pharmacy' },
    { settingKey: 'tax_percent',      settingValue: '15' },
    { settingKey: 'low_stock_alert',  settingValue: '5' },
    { settingKey: 'support_phone',    settingValue: '+251900000000' },
  ];
  for (const s of settings) {
    await prisma.setting.upsert({ where: { settingKey: s.settingKey }, update: s, create: s });
  }

  // Users
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
    { name: 'Antibiotics',           slug: 'antibiotics',          icon: 'MdOutlineScience',      description: 'Antibiotic medicines' },
    { name: 'Analgesics',            slug: 'analgesics',            icon: 'MdOutlineLocalHospital', description: 'Pain relief medicines' },
    { name: 'Vitamins & Supplements',slug: 'vitamins-supplements',  icon: 'GiPill',                description: 'Vitamins and dietary supplements' },
    { name: 'Antidiabetics',         slug: 'antidiabetics',         icon: 'GiMedicines',           description: 'Diabetes management medicines' },
    { name: 'Cardiovascular',        slug: 'cardiovascular',        icon: 'MdFavorite',            description: 'Heart and blood pressure medicines' },
    { name: 'Gastrointestinal',      slug: 'gastrointestinal',      icon: 'GiStomach',             description: 'Digestive system medicines' },
    { name: 'Respiratory',           slug: 'respiratory',           icon: 'GiLungs',               description: 'Respiratory medicines' },
    { name: 'Dermatology',           slug: 'dermatology',           icon: 'MdOutlineSpa',          description: 'Skin care medicines' },
    { name: 'Medical Devices',       slug: 'medical-devices',       icon: 'GiMedicalPack',         description: 'Medical equipment and devices' },
    { name: 'Syrups & Liquids',      slug: 'syrups-liquids',        icon: 'GiBottle',              description: 'Liquid medicines and syrups' },
  ];

  const categoryMap = {};
  for (const cat of categories) {
    const created = await prisma.category.upsert({ where: { slug: cat.slug }, update: {}, create: cat });
    categoryMap[cat.slug] = created.id;
  }

  // Suppliers — find-or-create to avoid duplicates on re-seed
  const supplierDefs = [
    { name: 'Ethiopian Pharmaceutical Supply Agency', contactPerson: 'Dr. Mulugeta',   phone: '+251111234567', email: 'epsa@ethiopia.gov.et', city: 'Addis Ababa' },
    { name: 'Medtech Medical Supplies',               contactPerson: 'Ahmed Hassan',    phone: '+251911234567', email: 'info@medtech.et',       city: 'Addis Ababa' },
    { name: 'Dashen Pharma Distributors',             contactPerson: 'Tigist Bekele',   phone: '+251921234567', email: 'dashen@pharma.et',      city: 'Hawassa' },
  ];
  const supplierIds = [];
  for (const sup of supplierDefs) {
    let s = await prisma.supplier.findFirst({ where: { name: sup.name } });
    if (!s) s = await prisma.supplier.create({ data: sup });
    supplierIds.push(s.id);
  }

  // ── Clear existing medicines & their dependents ──────────────────────────
  console.log('🗑️  Clearing existing medicines...');
  await prisma.inventoryMovement.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.purchaseItem.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.medicine.deleteMany();

  // ── New medicines with images ─────────────────────────────────────────────
  const medicines = [
    // ── Featured (shown on landing page) ───
    {
      name: 'Amoxicillin 500mg', genericName: 'Amoxicillin',
      description: 'Broad-spectrum penicillin antibiotic used for ear, throat, and urinary tract infections.',
      manufacturer: 'Julphar', dosage: '500mg TID', strength: '500mg', form: 'CAPSULE',
      purchasePrice: 8,  retailPrice: 15, wholesalePrice: 12,
      piecesPerStrip: 10, stripsPerBox: 10, stockQuantity: 500, minimumStock: 50,
      expiryDate: new Date('2027-06-30'), categorySlug: 'antibiotics',
      barcode: 'SC-10001', prescriptionRequired: true, featured: true, imageUrl: IMG.CAPSULE,
    },
    {
      name: 'Paracetamol 500mg', genericName: 'Acetaminophen',
      description: 'Effective fever reducer and pain reliever for headaches, muscle aches, and colds.',
      manufacturer: 'GSK', dosage: '500mg QID PRN', strength: '500mg', form: 'TABLET',
      purchasePrice: 2,  retailPrice: 5,  wholesalePrice: 3.5,
      piecesPerStrip: 10, stripsPerBox: 20, stockQuantity: 2000, minimumStock: 100,
      expiryDate: new Date('2027-08-31'), categorySlug: 'analgesics',
      barcode: 'SC-10002', featured: true, imageUrl: IMG.TABLET,
    },
    {
      name: 'Vitamin C 1000mg', genericName: 'Ascorbic Acid',
      description: 'High-dose vitamin C supplement for immune support, antioxidant protection, and skin health.',
      manufacturer: "Nature's Bounty", dosage: '1000mg OD', strength: '1000mg', form: 'TABLET',
      purchasePrice: 6,  retailPrice: 12, wholesalePrice: 9,
      piecesPerStrip: 10, stripsPerBox: 10, stockQuantity: 1000, minimumStock: 100,
      expiryDate: new Date('2027-12-31'), categorySlug: 'vitamins-supplements',
      barcode: 'SC-10003', featured: true, imageUrl: IMG.TABLET,
    },
    {
      name: 'Azithromycin 500mg', genericName: 'Azithromycin',
      description: 'Macrolide antibiotic for respiratory infections, skin infections, and STIs. 3–5 day course.',
      manufacturer: 'Pfizer', dosage: '500mg OD', strength: '500mg', form: 'TABLET',
      purchasePrice: 20, retailPrice: 40, wholesalePrice: 32,
      piecesPerStrip: 3, stripsPerBox: 5, stockQuantity: 300, minimumStock: 30,
      expiryDate: new Date('2027-04-30'), categorySlug: 'antibiotics',
      barcode: 'SC-10004', prescriptionRequired: true, featured: true, imageUrl: IMG.TABLET,
    },
    {
      name: 'Metformin 850mg', genericName: 'Metformin HCl',
      description: 'First-line oral antidiabetic for type 2 diabetes. Lowers blood glucose without causing hypoglycaemia.',
      manufacturer: 'Sun Pharma', dosage: '850mg BD', strength: '850mg', form: 'TABLET',
      purchasePrice: 7,  retailPrice: 14, wholesalePrice: 11,
      piecesPerStrip: 10, stripsPerBox: 10, stockQuantity: 400, minimumStock: 40,
      expiryDate: new Date('2027-03-31'), categorySlug: 'antidiabetics',
      barcode: 'SC-10005', prescriptionRequired: true, featured: true, imageUrl: IMG.TABLET,
    },
    {
      name: 'Ibuprofen 400mg', genericName: 'Ibuprofen',
      description: 'NSAID for pain, fever, and inflammation. Effective for headaches, dental pain, and arthritis.',
      manufacturer: 'Reckitt', dosage: '400mg TID', strength: '400mg', form: 'TABLET',
      purchasePrice: 5,  retailPrice: 10, wholesalePrice: 8,
      piecesPerStrip: 10, stripsPerBox: 10, stockQuantity: 600, minimumStock: 60,
      expiryDate: new Date('2027-07-31'), categorySlug: 'analgesics',
      barcode: 'SC-10006', featured: true, imageUrl: IMG.TABLET,
    },
    // ── Standard stock ───────────────────────────────────────────────────────
    {
      name: 'Omeprazole 20mg', genericName: 'Omeprazole',
      description: 'Proton pump inhibitor for acid reflux, peptic ulcers, and GERD.',
      manufacturer: 'Cipla', dosage: '20mg OD AC', strength: '20mg', form: 'CAPSULE',
      purchasePrice: 10, retailPrice: 20, wholesalePrice: 16,
      piecesPerStrip: 10, stripsPerBox: 10, stockQuantity: 400, minimumStock: 40,
      expiryDate: new Date('2027-01-31'), categorySlug: 'gastrointestinal',
      barcode: 'SC-10007', imageUrl: IMG.CAPSULE,
    },
    {
      name: 'Cetirizine 10mg', genericName: 'Cetirizine HCl',
      description: 'Non-drowsy antihistamine for allergic rhinitis, urticaria, and hay fever.',
      manufacturer: 'UCB', dosage: '10mg OD', strength: '10mg', form: 'TABLET',
      purchasePrice: 3,  retailPrice: 6,  wholesalePrice: 5,
      piecesPerStrip: 10, stripsPerBox: 10, stockQuantity: 600, minimumStock: 50,
      expiryDate: new Date('2027-09-30'), categorySlug: 'respiratory',
      barcode: 'SC-10008', imageUrl: IMG.TABLET,
    },
    {
      name: 'Amlodipine 5mg', genericName: 'Amlodipine Besylate',
      description: 'Calcium channel blocker for hypertension and angina pectoris.',
      manufacturer: 'Pfizer', dosage: '5mg OD', strength: '5mg', form: 'TABLET',
      purchasePrice: 12, retailPrice: 25, wholesalePrice: 20,
      piecesPerStrip: 10, stripsPerBox: 3, stockQuantity: 200, minimumStock: 20,
      expiryDate: new Date('2027-02-28'), categorySlug: 'cardiovascular',
      barcode: 'SC-10009', prescriptionRequired: true, imageUrl: IMG.TABLET,
    },
    {
      name: 'Atorvastatin 10mg', genericName: 'Atorvastatin Calcium',
      description: 'Statin medication to lower LDL cholesterol and reduce cardiovascular risk.',
      manufacturer: 'Ranbaxy', dosage: '10mg OD', strength: '10mg', form: 'TABLET',
      purchasePrice: 15, retailPrice: 30, wholesalePrice: 24,
      piecesPerStrip: 10, stripsPerBox: 3, stockQuantity: 180, minimumStock: 18,
      expiryDate: new Date('2027-05-31'), categorySlug: 'cardiovascular',
      barcode: 'SC-10010', prescriptionRequired: true, imageUrl: IMG.TABLET,
    },
    {
      name: 'Zinc 20mg Tablets', genericName: 'Zinc Sulfate',
      description: 'Zinc supplement for immune support, wound healing, and growth in children.',
      manufacturer: 'EPSA', dosage: '20mg OD', strength: '20mg', form: 'TABLET',
      purchasePrice: 4,  retailPrice: 8,  wholesalePrice: 6,
      piecesPerStrip: 10, stripsPerBox: 10, stockQuantity: 800, minimumStock: 80,
      expiryDate: new Date('2027-11-30'), categorySlug: 'vitamins-supplements',
      barcode: 'SC-10011', imageUrl: IMG.TABLET,
    },
    {
      name: 'Diclofenac 50mg', genericName: 'Diclofenac Sodium',
      description: 'NSAID for moderate to severe pain, rheumatoid arthritis, and post-operative pain.',
      manufacturer: 'Novartis', dosage: '50mg BD-TID', strength: '50mg', form: 'TABLET',
      purchasePrice: 6,  retailPrice: 12, wholesalePrice: 9,
      piecesPerStrip: 10, stripsPerBox: 10, stockQuantity: 350, minimumStock: 35,
      expiryDate: new Date('2027-06-30'), categorySlug: 'analgesics',
      barcode: 'SC-10012', prescriptionRequired: true, imageUrl: IMG.TABLET,
    },
    {
      name: 'ORS Sachets', genericName: 'Oral Rehydration Salts',
      description: 'WHO-formula oral rehydration therapy for diarrhoea and dehydration. Mix with 1L clean water.',
      manufacturer: 'EPSA', dosage: '1 Sachet in 1L water', strength: '5g/sachet', form: 'POWDER',
      purchasePrice: 3,  retailPrice: 5,  wholesalePrice: 4,
      piecesPerStrip: 1, stripsPerBox: 20, stockQuantity: 500, minimumStock: 50,
      expiryDate: new Date('2028-01-31'), categorySlug: 'gastrointestinal',
      barcode: 'SC-10013', imageUrl: IMG.POWDER,
    },
    {
      name: 'Cough Syrup 100ml', genericName: 'Dextromethorphan + Guaifenesin',
      description: 'Dual-action cough suppressant and expectorant for dry and productive coughs.',
      manufacturer: 'Benadryl', dosage: '10ml every 4–6 hours', strength: '15mg/5ml', form: 'SYRUP',
      purchasePrice: 30, retailPrice: 55, wholesalePrice: 45,
      piecesPerStrip: 1, stripsPerBox: 1, stockQuantity: 80, minimumStock: 15,
      expiryDate: new Date('2027-10-31'), categorySlug: 'syrups-liquids',
      barcode: 'SC-10014', imageUrl: IMG.SYRUP,
    },
    {
      name: 'Clotrimazole Cream 1%', genericName: 'Clotrimazole',
      description: 'Antifungal cream for athlete\'s foot, ringworm, jock itch, and vaginal candidiasis.',
      manufacturer: 'Bayer', dosage: 'Apply BD–TID', strength: '1%', form: 'CREAM',
      purchasePrice: 25, retailPrice: 45, wholesalePrice: 38,
      piecesPerStrip: 1, stripsPerBox: 1, stockQuantity: 120, minimumStock: 12,
      expiryDate: new Date('2027-08-31'), categorySlug: 'dermatology',
      barcode: 'SC-10015', imageUrl: IMG.CREAM,
    },
    {
      name: 'Albendazole 400mg', genericName: 'Albendazole',
      description: 'Broad-spectrum anthelmintic for intestinal worms, hydatid disease, and neurocysticercosis.',
      manufacturer: 'GSK', dosage: '400mg single dose', strength: '400mg', form: 'TABLET',
      purchasePrice: 6,  retailPrice: 12, wholesalePrice: 9,
      piecesPerStrip: 1, stripsPerBox: 10, stockQuantity: 250, minimumStock: 25,
      expiryDate: new Date('2027-12-31'), categorySlug: 'antibiotics',
      barcode: 'SC-10016', imageUrl: IMG.TABLET,
    },
  ];

  console.log(`➕  Creating ${medicines.length} medicines...`);
  for (const med of medicines) {
    const { categorySlug, ...data } = med;
    const slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    await prisma.medicine.create({
      data: {
        ...data,
        slug,
        sku: `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        categoryId: categoryMap[categorySlug],
        supplierId: supplierIds[Math.floor(Math.random() * supplierIds.length)],
      },
    });
  }

  // Sample customers
  const customers = [
    { firstName: 'Mohammed', lastName: 'Ali',    phone: '+251911111111', email: 'mohammed@gmail.com' },
    { firstName: 'Fatima',   lastName: 'Hassan', phone: '+251922222222', email: 'fatima@gmail.com' },
    { firstName: 'Abdi',     lastName: 'Omar',   phone: '+251933333333' },
  ];
  for (const c of customers) {
    await prisma.customer.upsert({ where: { phone: c.phone }, update: {}, create: c });
  }

  console.log('✅ Seeding completed!');
  console.log('📧 Admin: admin@somcare.com / Admin@123');
  console.log('📧 Cashier: cashier@somcare.com / Cashier@123');
  console.log('📧 Pharmacist: pharmacist@somcare.com / Pharma@123');
  console.log(`💊 ${medicines.length} medicines seeded (${medicines.filter(m => m.featured).length} featured)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
