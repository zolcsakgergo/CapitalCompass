import { PrismaClient, AssetType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Clean up existing data
  await prisma.asset.deleteMany({});
  await prisma.tbszAccount.deleteMany({});
  await prisma.portfolio.deleteMany({});
  await prisma.user.deleteMany({});

  // Create users
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const user1 = await prisma.user.create({
    data: {
      email: 'john.doe@example.com',
      passwordHash,
      firstName: 'John',
      lastName: 'Doe',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'jane.smith@example.com',
      passwordHash,
      firstName: 'Jane',
      lastName: 'Smith',
    },
  });

  console.log('Created users');

  // Create TBSZ accounts for user1
  const tbsz1 = await prisma.tbszAccount.create({
    data: {
      name: 'TBSZ 2023',
      openingDate: new Date('2023-01-15'),
      maturityDate: new Date('2028-01-15'),
      initialDepositAmount: 1000000,
      userId: user1.id,
    },
  });

  const tbsz2 = await prisma.tbszAccount.create({
    data: {
      name: 'TBSZ 2024',
      openingDate: new Date('2024-01-10'),
      maturityDate: new Date('2029-01-10'),
      initialDepositAmount: 1500000,
      userId: user1.id,
    },
  });

  // Create TBSZ account for user2
  const tbsz3 = await prisma.tbszAccount.create({
    data: {
      name: 'TBSZ 2023',
      openingDate: new Date('2023-03-20'),
      maturityDate: new Date('2028-03-20'),
      initialDepositAmount: 2000000,
      userId: user2.id,
    },
  });

  console.log('Created TBSZ accounts');

  // Create portfolios
  const portfolio1 = await prisma.portfolio.create({
    data: {
      name: 'Growth Portfolio',
      description: 'High risk, high reward investments',
      userId: user1.id,
    },
  });

  const portfolio2 = await prisma.portfolio.create({
    data: {
      name: 'Dividend Portfolio',
      description: 'Focused on steady income',
      userId: user2.id,
    },
  });

  console.log('Created portfolios');

  // Create assets in TBSZ accounts
  await prisma.asset.createMany({
    data: [
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        type: AssetType.STOCK,
        purchaseDate: new Date('2023-02-15'),
        purchasePrice: 150.25,
        quantity: 10,
        currentValue: 1750.3,
        tbszAccountId: tbsz1.id,
      },
      {
        symbol: 'MSFT',
        name: 'Microsoft Corporation',
        type: AssetType.STOCK,
        purchaseDate: new Date('2023-03-10'),
        purchasePrice: 280.15,
        quantity: 5,
        currentValue: 1650.75,
        tbszAccountId: tbsz1.id,
      },
      {
        symbol: 'GOOGL',
        name: 'Alphabet Inc.',
        type: AssetType.STOCK,
        purchaseDate: new Date('2024-01-20'),
        purchasePrice: 142.5,
        quantity: 8,
        currentValue: 1215.6,
        tbszAccountId: tbsz2.id,
      },
      {
        symbol: 'VTI',
        name: 'Vanguard Total Stock Market ETF',
        type: AssetType.ETF,
        purchaseDate: new Date('2023-05-12'),
        purchasePrice: 217.8,
        quantity: 12,
        currentValue: 2750.4,
        tbszAccountId: tbsz3.id,
      },
    ],
  });

  // Create assets in regular portfolios
  await prisma.asset.createMany({
    data: [
      {
        symbol: 'TSLA',
        name: 'Tesla Inc.',
        type: AssetType.STOCK,
        purchaseDate: new Date('2022-11-10'),
        purchasePrice: 195.6,
        quantity: 15,
        currentValue: 2760.45,
        portfolioId: portfolio1.id,
      },
      {
        symbol: 'BTC',
        name: 'Bitcoin',
        type: AssetType.CRYPTO,
        purchaseDate: new Date('2023-01-05'),
        purchasePrice: 16700.25,
        quantity: 0.5,
        currentValue: 24350.5,
        portfolioId: portfolio1.id,
      },
      {
        symbol: 'KO',
        name: 'Coca-Cola Company',
        type: AssetType.STOCK,
        purchaseDate: new Date('2022-08-18'),
        purchasePrice: 63.45,
        quantity: 30,
        currentValue: 1980.3,
        portfolioId: portfolio2.id,
      },
      {
        symbol: 'SCHD',
        name: 'Schwab US Dividend Equity ETF',
        type: AssetType.ETF,
        purchaseDate: new Date('2022-09-23'),
        purchasePrice: 72.4,
        quantity: 20,
        currentValue: 1560.8,
        portfolioId: portfolio2.id,
      },
    ],
  });

  console.log('Created assets');
  console.log('Seed completed successfully');
}

main()
  .catch(e => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
