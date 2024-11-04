import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Connection } from 'typeorm';
import { Transfer } from '../entities/transfer.entity';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class TransferReversalService {
    constructor(
        @InjectRepository(Transfer)
        private transferRepository: Repository<Transfer>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private connection: Connection,
    ) { }

    async reverseTransfer(transferId: string, reason: string): Promise<Transfer> {
        return this.connection.transaction(async (transactionalEntityManager) => {
            const transfer = await transactionalEntityManager.findOne(Transfer, {
                where: { id: transferId },
                relations: ['sender', 'receiver'],
            });

            if (!transfer) {
                throw new NotFoundException('Transferência não encontrada');
            }

            if (transfer.isReversed) {
                throw new BadRequestException('Esta transferência já foi revertida');
            }

            const sender = transfer.sender;
            const receiver = transfer.receiver;

            const amount = Number(transfer.amount);
            sender.balance = Number(sender.balance) + amount;
            receiver.balance = Number(receiver.balance) - amount;

            if (receiver.balance < 0) {
                throw new BadRequestException('O receptor não tem saldo suficiente para a reversão');
            }

            transfer.isReversed = true;
            transfer.reversalReason = reason;
            transfer.reversalDate = new Date();

            await transactionalEntityManager.save(sender);
            await transactionalEntityManager.save(receiver);
            await transactionalEntityManager.save(transfer);

            const reversalTransfer = this.transferRepository.create({
                sender: receiver,
                receiver: sender,
                amount: amount,
                description: `Reversão da transferência ${transferId}: ${reason}`,
                originalTransfer: transfer,
            });

            await transactionalEntityManager.save(reversalTransfer);

            return reversalTransfer;
        });
    }
}