import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createTransactionDto: any) {
    const transaction = {
      ...createTransactionDto,
      userId,
      totalValue:
        createTransactionDto.amount * createTransactionDto.pricePerUnit,
      transactionDate: new Date(createTransactionDto.transactionDate),
    };
    return this.prisma.transaction.create({
      data: transaction,
    });
  }

  async findAll(userId: string) {
    return this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { transactionDate: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, userId },
    });
    if (!transaction) {
      throw new NotFoundException(`Transaction #${id} not found`);
    }
    return transaction;
  }

  async remove(userId: string, id: string): Promise<void> {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction #${id} not found`);
    }

    await this.prisma.transaction.delete({
      where: { id },
    });
  }
}
