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
                throw new NotFoundException('Transfer not found');
            }

            if (transfer.isReversed) {
                throw new BadRequestException('This transfer has already been reversed');
            }

            const sender = transfer.sender;
            const receiver = transfer.receiver;

            // Reverse the balances
            sender.balance += transfer.amount;
            receiver.balance -= transfer.amount;

            // Check if receiver has enough balance for the reversal
            if (receiver.balance < 0) {
                throw new BadRequestException('Receiver does not have enough balance for reversal');
            }

            // Mark the transfer as reversed
            transfer.isReversed = true;
            transfer.reversalReason = reason;
            transfer.reversalDate = new Date();

            // Save all changes
            await transactionalEntityManager.save(sender);
            await transactionalEntityManager.save(receiver);
            await transactionalEntityManager.save(transfer);

            // Create a new transfer record for the reversal
            const reversalTransfer = this.transferRepository.create({
                sender: receiver,
                receiver: sender,
                amount: transfer.amount,
                description: `Reversal of transfer ${transferId}: ${reason}`,
                originalTransfer: transfer,
            });

            await transactionalEntityManager.save(reversalTransfer);

            return reversalTransfer;
        });
    }
}