import { Controller, Get, Post, Body, Param, UseGuards, Request, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ITransfer } from './interfaces/transfer.interface';
import { TransferReversalService } from './services/transfer-reversal.service';
import { ApiOperation, ApiResponse, ApiTags, ApiBody, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Transferência')
@Controller('transfers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TransfersController {
    constructor(
        private readonly transfersService: TransfersService,
        private readonly transferReversalService: TransferReversalService
    ) { }

    @Post()
    @ApiOperation({ summary: 'Criar uma nova transferência' })
    @ApiBody({
        description: 'Dados da transferência',
        type: CreateTransferDto,
        examples: {
            transferência: {
                value: {
                    receiverId: '123e4567-e89b-12d3-a456-426614174000',
                    amount: 100.50
                }
            }
        }
    })
    @ApiResponse({ status: 201, description: 'Transferência criada com sucesso' })
    @ApiResponse({ status: 400, description: 'Requisição inválida' })
    @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
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
                error.message || 'Ocorreu um erro ao processar a transferência',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Get()
    @ApiOperation({ summary: 'Listar todas as transferências' })
    @ApiResponse({ status: 200, description: 'Retorna todas as transferências' })
    findAll(): Promise<ITransfer[]> {
        return this.transfersService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Buscar uma transferência por ID' })
    @ApiResponse({ status: 200, description: 'Retorna a transferência solicitada' })
    @ApiResponse({ status: 404, description: 'Transferência não encontrada' })
    findOne(@Param('id') id: string): Promise<ITransfer> {
        return this.transfersService.findOne(id);
    }

    @Post(':id/reverse')
    @ApiOperation({ summary: 'Reverter uma transferência' })
    @ApiBody({
        description: 'Motivo da reversão',
        schema: {
            type: 'object',
            properties: {
                reason: {
                    type: 'string',
                    example: 'Transferência realizada por engano'
                }
            }
        }
    })
    @ApiResponse({ status: 200, description: 'Transferência revertida com sucesso' })
    @ApiResponse({ status: 400, description: 'Requisição inválida' })
    @ApiResponse({ status: 404, description: 'Transferência não encontrada' })
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
            throw new HttpException('Ocorreu um erro ao reverter a transferência', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Post('increase-balance')
    @ApiOperation({ summary: 'Aumentar o saldo do usuário' })
    @ApiBody({
        description: 'Dados para aumentar o saldo',
        schema: {
            type: 'object',
            properties: {
                amount: {
                    type: 'number',
                    example: 100.50
                }
            }
        }
    })
    @ApiResponse({ status: 200, description: 'Saldo aumentado com sucesso' })
    @ApiResponse({ status: 400, description: 'Requisição inválida' })
    async increaseBalance(@Request() req, @Body('amount') amount: number) {
        try {
            const updatedUser = await this.transfersService.increaseBalance(req.user.userId, amount);
            return {
                message: 'Saldo aumentado com sucesso',
                newBalance: updatedUser.balance
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                error.message || 'Ocorreu um erro ao aumentar o saldo',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}