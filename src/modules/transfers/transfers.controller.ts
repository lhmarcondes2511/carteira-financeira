import { Controller, Get, Post, Body, Param, UseGuards, Request, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ITransfer } from './interfaces/transfer.interface';
import { TransferReversalService } from './services/transfer-reversal.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Transferência')
@Controller('transfers')
@UseGuards(JwtAuthGuard)
export class TransfersController {
    constructor(
        private readonly transfersService: TransfersService,
        private readonly transferReversalService: TransferReversalService
    ) { }

    @Post()
    @ApiOperation({ summary: 'Create a new transfer' })
    @ApiResponse({ status: 201, description: 'Transfer created successfully' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 404, description: 'User not found' })
    async create(@Request() req, @Body() createTransferDto: CreateTransferDto): Promise<ITransfer> {
        try {
            const transfer = await this.transfersService.create(
                req.user.userId,
                createTransferDto.receiverId,
                createTransferDto.amount
            );
            return transfer;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            if (error.message.includes('not found')) {
                throw new NotFoundException(error.message);
            }
            throw new HttpException(
                error.message || 'An error occurred while processing the transfer',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Get()
    findAll(): Promise<ITransfer[]> {
        return this.transfersService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string): Promise<ITransfer> {
        return this.transfersService.findOne(id);
    }

    @Post(':id/reverse')
    async reverseTransfer(
        @Param('id') id: string,
        @Body('reason') reason: string,
    ): Promise<ITransfer> {
        try {
            return await this.transferReversalService.reverseTransfer(id, reason);
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException('An error occurred while reversing the transfer', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}