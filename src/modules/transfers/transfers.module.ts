import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransfersService } from './transfers.service';
import { TransfersController } from './transfers.controller';
import { Transfer } from './entities/transfer.entity';
import { User } from '../users/entities/user.entity';
import { TransferReversalService } from './services/transfer-reversal.service';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transfer, User]),
    MetricsModule
  ],
  controllers: [TransfersController],
  providers: [TransfersService, TransferReversalService],
  exports: [TransfersService, TransferReversalService],
})
export class TransfersModule { }