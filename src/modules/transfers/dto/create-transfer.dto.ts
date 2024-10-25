import { IsUUID, IsNumber, IsPositive } from 'class-validator';

export class CreateTransferDto {
  @IsUUID()
  receiverId: string;

  @IsNumber()
  @IsPositive()
  amount: number;
}