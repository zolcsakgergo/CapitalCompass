# Prisma ORM Migration Guide

This guide provides instructions on how to set up and use Prisma ORM for the Investment Tracker application.

## Setup and Migration

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Generate Prisma Client**

   ```bash
   npx prisma generate
   ```

3. **Run Database Migration**

   ```bash
   npx prisma migrate dev --name init
   ```

   This will create the database tables according to the schema.

4. **Seed the Database**

   ```bash
   npx prisma db seed
   ```

   This will populate the database with sample data.

## Additional Commands

- **View Your Database with Prisma Studio**

  ```bash
  npx prisma studio
  ```

  This launches a web interface to explore and modify your data.

- **Create a New Migration**

  ```bash
  npx prisma migrate dev --name name_of_migration
  ```

  Use this when you've made changes to your schema.

- **Deploy Migrations in Production**

  ```bash
  npx prisma migrate deploy
  ```

  Use this in production environments to apply migrations.

## Database Structure

The database includes the following models:

- **User**: Stores user information
- **TbszAccount**: Represents tax-advantaged investment accounts
- **Portfolio**: Regular investment portfolios
- **Asset**: Investment assets that can belong to either a TBSZ account or a regular portfolio

## Relationships

- A User can have many TBSZ accounts and regular portfolios
- A TBSZ account belongs to one User and can have many Assets
- A Portfolio belongs to one User and can have many Assets
- An Asset can belong to either a TBSZ account or a Portfolio

## Environment Setup

Make sure your `.env` file contains the correct database connection string:

```
DATABASE_URL="postgresql://username:password@localhost:5432/database_name?schema=public"
```

Replace `username`, `password`, and `database_name` with your PostgreSQL credentials.
