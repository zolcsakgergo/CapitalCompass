import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
  ) {}

  async create(
    userId: number,
    createTransactionDto: any,
  ): Promise<Transaction> {
    const transaction = {
      ...createTransactionDto,
      userId,
      totalValue:
        createTransactionDto.amount * createTransactionDto.pricePerUnit,
      transactionDate: new Date(createTransactionDto.transactionDate),
    };
    return this.transactionsRepository.save(transaction);
  }

  async findAll(userId: number): Promise<Transaction[]> {
    return this.transactionsRepository.find({
      where: { userId },
      order: { transactionDate: 'DESC' },
    });
  }

  async findOne(userId: number, id: number): Promise<Transaction> {
    const transaction = await this.transactionsRepository.findOne({
      where: { id, userId },
    });
    if (!transaction) {
      throw new NotFoundException(`Transaction #${id} not found`);
    }
    return transaction;
  }

  async remove(userId: number, id: number): Promise<void> {
    const result = await this.transactionsRepository.delete({ id, userId });
    if (result.affected === 0) {
      throw new NotFoundException(`Transaction #${id} not found`);
    }
  }
}
