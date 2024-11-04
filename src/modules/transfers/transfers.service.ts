import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Connection } from 'typeorm';
import { Transfer } from './entities/transfer.entity';
import { User } from '../users/entities/user.entity';
import { ITransfer } from './interfaces/transfer.interface';
import { IUser } from '../users/interfaces/user.interface';

@Injectable()
export class TransfersService {
    constructor(
        @InjectRepository(Transfer)
        private transfersRepository: Repository<Transfer>,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private connection: Connection,
    ) { }

    async create(senderId: string, receiverId: string, amount: number): Promise<ITransfer> {
        if (amount <= 0) {
            throw new BadRequestException('Amount must be positive');
        }

        return this.connection.transaction(async manager => {
            const sender = await manager.findOne(User, { where: { id: senderId } });
            const receiver = await manager.findOne(User, { where: { id: receiverId } });

            if (!sender) {
                throw new NotFoundException('Sender not found');
            }
            if (!receiver) {
                throw new NotFoundException('Receiver not found');
            }

            if (sender.balance < amount) {
                throw new BadRequestException('Insufficient balance');
            }

            // Atualizar saldos usando números
            sender.balance = Number(sender.balance) - Number(amount);
            receiver.balance = Number(receiver.balance) + Number(amount);

            await manager.save(sender);
            await manager.save(receiver);

            const transfer = new Transfer();
            transfer.sender = sender;
            transfer.receiver = receiver;
            transfer.amount = amount;

            const savedTransfer = await manager.save(transfer);
            return this.mapTransferToInterface(savedTransfer);
        });
    }

    async findAll(): Promise<ITransfer[]> {
        const transfers = await this.transfersRepository.find({
            relations: ['sender', 'receiver'],
        });
        return transfers.map(transfer => this.mapTransferToInterface(transfer));
    }

    async findOne(id: string): Promise<ITransfer> {
        const transfer = await this.transfersRepository.findOne({
            where: { id },
            relations: ['sender', 'receiver'],
        });
        if (!transfer) {
            throw new NotFoundException('Transfer not found');
        }
        return this.mapTransferToInterface(transfer);
    }

    async increaseBalance(userId: string, amount: number): Promise<IUser> {
        if (amount <= 0) {
            throw new BadRequestException('O valor deve ser positivo');
        }

        return this.connection.transaction(async manager => {
            const user = await manager.findOne(User, { where: { id: userId } });

            if (!user) {
                throw new NotFoundException('Usuário não encontrado');
            }

            user.balance = Number(user.balance) + Number(amount);
            await manager.save(user);

            return this.mapUserToInterface(user);
        });
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