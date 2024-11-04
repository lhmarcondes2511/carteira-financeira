import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Connection } from 'typeorm';
import { Transfer } from './entities/transfer.entity';
import { User } from '../users/entities/user.entity';
import { ITransfer } from './interfaces/transfer.interface';
import { IUser } from '../users/interfaces/user.interface';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class TransfersService {
    constructor(
        @InjectRepository(Transfer)
        private transfersRepository: Repository<Transfer>,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private connection: Connection,
        private metricsService: MetricsService
    ) { }

    async create(senderId: string, receiverId: string, amount: number): Promise<ITransfer> {
        if (amount <= 0) {
            this.metricsService.incrementTransferOperations('create', 'invalidAmount');
            throw new BadRequestException('Amount must be positive');
        }

        return this.connection.transaction(async manager => {
            try {
                const sender = await manager.findOne(User, { where: { id: senderId } });
                const receiver = await manager.findOne(User, { where: { id: receiverId } });

                if (!sender) {
                    this.metricsService.incrementTransferOperations('create', 'senderNotFound');
                    throw new NotFoundException('Sender not found');
                }
                if (!receiver) {
                    this.metricsService.incrementTransferOperations('create', 'receiverNotFound');
                    throw new NotFoundException('Receiver not found');
                }

                if (sender.balance < amount) {
                    this.metricsService.incrementTransferOperations('create', 'insufficientBalance');
                    throw new BadRequestException('Insufficient balance');
                }

                sender.balance = Number(sender.balance) - Number(amount);
                receiver.balance = Number(receiver.balance) + Number(amount);

                await manager.save(sender);
                await manager.save(receiver);

                const transfer = new Transfer();
                transfer.sender = sender;
                transfer.receiver = receiver;
                transfer.amount = amount;

                const savedTransfer = await manager.save(transfer);
                this.metricsService.incrementTransferOperations('create', 'success');
                this.metricsService.recordTransferAmount(amount);
                return this.mapTransferToInterface(savedTransfer);
            } catch (error) {
                this.metricsService.incrementTransferOperations('create', 'failed');
                throw error;
            }
        });
    }

    async findAll(): Promise<ITransfer[]> {
        try {
            const transfers = await this.transfersRepository.find({
                relations: ['sender', 'receiver'],
            });
            this.metricsService.incrementTransferOperations('findAll', 'success');
            return transfers.map(transfer => this.mapTransferToInterface(transfer));
        } catch (error) {
            this.metricsService.incrementTransferOperations('findAll', 'failed');
            throw error;
        }
    }

    async findOne(id: string): Promise<ITransfer> {
        try {
            const transfer = await this.transfersRepository.findOne({
                where: { id },
                relations: ['sender', 'receiver'],
            });
            if (!transfer) {
                this.metricsService.incrementTransferOperations('findOne', 'notFound');
                throw new NotFoundException('Transfer not found');
            }
            this.metricsService.incrementTransferOperations('findOne', 'success');
            return this.mapTransferToInterface(transfer);
        } catch (error) {
            this.metricsService.incrementTransferOperations('findOne', 'failed');
            throw error;
        }
    }

    async findMyTransfers(userId: string): Promise<ITransfer[]> {
        try {
            const transfers = await this.transfersRepository.find({
                where: [
                    { sender: { id: userId } },
                    { receiver: { id: userId } },
                ],
                relations: ['sender', 'receiver'],
                order: { createdAt: 'DESC' },
            });
            this.metricsService.incrementTransferOperations('findMyTransfers', 'success');
            return this.mapTransfersToInterface(transfers);
        } catch (error) {
            this.metricsService.incrementTransferOperations('findMyTransfers', 'failed');
            throw error;
        }
    }

    async increaseBalance(userId: string, amount: number): Promise<IUser> {
        if (amount <= 0) {
            this.metricsService.incrementBalanceOperations('increase', 'invalidAmount');
            throw new BadRequestException('O valor deve ser positivo');
        }

        return this.connection.transaction(async manager => {
            try {
                const user = await manager.findOne(User, { where: { id: userId } });

                if (!user) {
                    this.metricsService.incrementBalanceOperations('increase', 'userNotFound');
                    throw new NotFoundException('Usuário não encontrado');
                }

                user.balance = Number(user.balance) + Number(amount);
                await manager.save(user);

                this.metricsService.incrementBalanceOperations('increase', 'success');
                this.metricsService.recordBalanceIncrease(amount);
                return this.mapUserToInterface(user);
            } catch (error) {
                this.metricsService.incrementBalanceOperations('increase', 'failed');
                throw error;
            }
        });
    }

    private mapTransfersToInterface(transfers: Transfer[]): ITransfer[] {
        return transfers.map(transfer => ({
            id: transfer.id,
            sender: this.mapUserToInterface(transfer.sender),
            receiver: this.mapUserToInterface(transfer.receiver),
            amount: Number(transfer.amount),
            createdAt: transfer.createdAt,
            description: transfer.description,
        }));
    }

    private mapTransferToInterface(transfer: Transfer): ITransfer {
        return {
            id: transfer.id,
            sender: this.mapUserToInterface(transfer.sender),
            receiver: this.mapUserToInterface(transfer.receiver),
            amount: Number(transfer.amount),
            createdAt: transfer.createdAt,
            description: transfer.description,
        };
    }

    private mapUserToInterface(user: User): IUser {
        return {
            id: user.id,
            username: user.username,
            balance: Number(user.balance),
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };
    }
}