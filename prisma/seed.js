require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Seed admin
  const phone = '+998917850090';
  const admin = await prisma.user.upsert({
    where: { phone },
    update: {
      role: 'ADMIN',
      name: 'Администратор',
    },
    create: {
      phone,
      name: 'Администратор',
      role: 'ADMIN',
    },
  });
  console.log('Seed admin user created/updated:', admin);

  // 2. Seed Categories
  const catVeg = await prisma.category.upsert({
    where: { slug: 'vegetables' },
    update: {},
    create: { name: 'Овощи и Фрукты', slug: 'vegetables', image: '🥦' },
  });

  const catDairy = await prisma.category.upsert({
    where: { slug: 'dairy' },
    update: {},
    create: { name: 'Молочные продукты', slug: 'dairy', image: '🥛' },
  });

  const catDrinks = await prisma.category.upsert({
    where: { slug: 'drinks' },
    update: {},
    create: { name: 'Напитки', slug: 'drinks', image: '🥤' },
  });

  const catBakery = await prisma.category.upsert({
    where: { slug: 'bakery' },
    update: {},
    create: { name: 'Выпечка', slug: 'bakery', image: '🍞' },
  });

  console.log('Categories seeded.');

  // 3. Seed Products
  const productsData = [
    {
      name: 'Помидоры красные',
      slug: 'red-tomatoes',
      barcode: '40001',
      nomenclatureCode: 'TOMATO_RED',
      description: 'Свежие сочные красные помидоры, выращенные в теплицах Ташкента.',
      price: 12000,
      oldPrice: 15000,
      stock: 50,
      unit: 'кг',
      categoryId: catVeg.id,
      image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop',
    },
    {
      name: 'Огурцы свежие',
      slug: 'fresh-cucumbers',
      barcode: '40002',
      nomenclatureCode: 'CUCUMBER_FRESH',
      description: 'Свежие хрустящие огурцы, идеально подходят для салатов.',
      price: 9000,
      oldPrice: null,
      stock: 8,
      unit: 'кг',
      categoryId: catVeg.id,
      image: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=500&auto=format&fit=crop',
    },
    {
      name: 'Молоко 3.2% "Мусаффо"',
      slug: 'milk-musaffo-32',
      barcode: '40003',
      nomenclatureCode: 'MILK_32',
      description: 'Пастеризованное молоко высшего качества, жирность 3.2%.',
      price: 11000,
      oldPrice: null,
      stock: 30,
      unit: 'л',
      categoryId: catDairy.id,
      image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop',
    },
    {
      name: 'Сыр Чеддер',
      slug: 'cheddar-cheese',
      barcode: '40004',
      nomenclatureCode: 'CHEDDAR_CHEESE',
      description: 'Твердый сыр Чеддер с насыщенным вкусом и ароматом.',
      price: 75000,
      oldPrice: 89000,
      stock: 15,
      unit: 'кг',
      categoryId: catDairy.id,
      image: 'https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=500&auto=format&fit=crop',
    },
    {
      name: 'Coca-Cola 1.5L',
      slug: 'coca-cola-15',
      barcode: '5449000000996',
      nomenclatureCode: 'COLA15',
      description: 'Классический освежающий газированный напиток Coca-Cola.',
      price: 14000,
      oldPrice: 15500,
      stock: 25,
      unit: 'шт',
      categoryId: catDrinks.id,
      image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop',
    },
    {
      name: 'Багет французский',
      slug: 'french-baguette',
      barcode: '40006',
      nomenclatureCode: 'BAGUETTE_FR',
      description: 'Хрустящий французский багет, выпекаемый каждое утро.',
      price: 5000,
      oldPrice: null,
      stock: 0,
      unit: 'шт',
      categoryId: catBakery.id,
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop',
    },
  ];

  for (const prod of productsData) {
    await prisma.product.upsert({
      where: { slug: prod.slug },
      update: {
        price: prod.price,
        oldPrice: prod.oldPrice,
        stock: prod.stock,
        image: prod.image,
        categoryId: prod.categoryId,
        description: prod.description,
      },
      create: prod,
    });
  }

  console.log('Products seeded.');

  // 4. Seed Integration Settings
  const settingsCount = await prisma.integrationSettings.count();
  if (settingsCount === 0) {
    await prisma.integrationSettings.create({
      data: {
        integrationEnabled: false,
        integrationMode: 'disabled',
        autoUpdatePrices: true,
        autoUpdateStock: true,
        syncIntervalMinutes: 5,
      },
    });
    console.log('Default Integration Settings seeded.');
  }

  // 5. Seed ExternalProducts
  const externalProductsData = [
    {
      barcode: '5449000000996',
      nomenclatureCode: 'COLA15',
      name: 'Coca-Cola 1.5L',
      price: 14000,
      stock: 25,
      unit: 'шт',
      categoryName: 'Напитки',
    },
    {
      barcode: '4780012345678',
      nomenclatureCode: 'MILK1',
      name: 'Молоко 1L',
      price: 11000,
      stock: 40,
      unit: 'шт',
      categoryName: 'Молочные продукты',
    },
    {
      barcode: '4780098765432',
      nomenclatureCode: 'BREAD01',
      name: 'Хлеб',
      price: 4000,
      stock: 60,
      unit: 'шт',
      categoryName: 'Хлеб',
    },
  ];

  for (const ext of externalProductsData) {
    await prisma.externalProduct.upsert({
      where: { barcode: ext.barcode },
      update: {
        price: ext.price,
        stock: ext.stock,
        name: ext.name,
        categoryName: ext.categoryName,
        nomenclatureCode: ext.nomenclatureCode,
      },
      create: ext,
    });
  }

  console.log('External Products seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
