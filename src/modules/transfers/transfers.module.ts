import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransfersService } from './transfers.service';
import { TransfersController } from './transfers.controller';
import { Transfer } from './entities/transfer.entity';
import { User } from '../users/entities/user.entity';
import { TransferReversalService } from './services/transfer-reversal.service';

@Module({
    imports: [TypeOrmModule.forFeature([Transfer, User])],
    controllers: [TransfersController],
    providers: [TransfersService, TransferReversalService],
    exports: [TransfersService, TransferReversalService],
  })
export class TransfersModule { }