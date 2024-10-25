import { Test, TestingModule } from '@nestjs/testing';
import { TransfersService } from './transfers.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Transfer } from './entities/transfer.entity';
import { User } from '../users/entities/user.entity';
import { Connection, Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('TransfersService', () => {
    let service: TransfersService;
    let transferRepository: Repository<Transfer>;
    let userRepository: Repository<User>;
    let connection: Connection;

    const mockTransferRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
    };

    const mockUserRepository = {
        findOne: jest.fn(),
        save: jest.fn(),
    };

    const mockConnection = {
        transaction: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TransfersService,
                {
                    provide: getRepositoryToken(Transfer),
                    useValue: mockTransferRepository,
                },
                {
                    provide: getRepositoryToken(User),
                    useValue: mockUserRepository,
                },
                {
                    provide: Connection,
                    useValue: mockConnection,
                }
            ],
        }).compile();

        service = module.get<TransfersService>(TransfersService);
        transferRepository = module.get<Repository<Transfer>>(getRepositoryToken(Transfer));
        userRepository = module.get<Repository<User>>(getRepositoryToken(User));
        connection = module.get<Connection>(Connection);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        const senderId = '1';
        const receiverId = '2';
        const amount = 100;

        const sender = {
            id: senderId,
            username: 'sender',
            balance: 1000,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const receiver = {
            id: receiverId,
            username: 'receiver',
            balance: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        it('should create a transfer successfully', async () => {
            const transfer = {
                id: '1',
                sender,
                receiver,
                amount,
                createdAt: new Date(),
                description: null
            };

            mockConnection.transaction.mockImplementation(async (cb) => {
                const manager = {
                    findOne: jest.fn()
                        .mockResolvedValueOnce(sender)
                        .mockResolvedValueOnce(receiver),
                    save: jest.fn()
                        .mockImplementation(entity => {
                            if (entity instanceof Transfer) {
                                return transfer;
                            }
                            return entity;
                        })
                };
                return cb(manager);
            });

            const result = await service.create(senderId, receiverId, amount);

            expect(result).toBeDefined();
            expect(result.amount).toBe(amount);
            expect(result.sender.id).toBe(senderId);
            expect(result.receiver.id).toBe(receiverId);
            expect(result.sender.balance).toBe(900);
            expect(result.receiver.balance).toBe(100);
        });

        it('should throw BadRequestException for negative amount', async () => {
            await expect(
                service.create(senderId, receiverId, -100)
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException for zero amount', async () => {
            await expect(
                service.create(senderId, receiverId, 0)
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw NotFoundException if sender not found', async () => {
            mockConnection.transaction.mockImplementation(async (cb) => {
                const manager = {
                    findOne: jest.fn().mockResolvedValue(null)
                };
                return cb(manager);
            });

            await expect(
                service.create(senderId, receiverId, amount)
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw NotFoundException if receiver not found', async () => {
            mockConnection.transaction.mockImplementation(async (cb) => {
                const manager = {
                    findOne: jest.fn()
                        .mockResolvedValueOnce(sender)
                        .mockResolvedValueOnce(null)
                };
                return cb(manager);
            });

            await expect(
                service.create(senderId, receiverId, amount)
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException if insufficient balance', async () => {
            const poorSender = { ...sender, balance: 50 };
            mockConnection.transaction.mockImplementation(async (cb) => {
                const manager = {
                    findOne: jest.fn()
                        .mockResolvedValueOnce(poorSender)
                        .mockResolvedValueOnce(receiver)
                };
                return cb(manager);
            });

            await expect(
                service.create(senderId, receiverId, amount)
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('findAll', () => {
        it('should return all transfers', async () => {
            const transfers = [
                {
                    id: '1',
                    sender: {
                        id: '1',
                        username: 'sender',
                        balance: 900,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    },
                    receiver: {
                        id: '2',
                        username: 'receiver',
                        balance: 100,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    },
                    amount: 100,
                    createdAt: new Date(),
                    description: null
                }
            ];

            mockTransferRepository.find.mockResolvedValue(transfers);

            const result = await service.findAll();

            expect(result).toBeDefined();
            expect(result).toHaveLength(1);
            expect(result[0].amount).toBe(100);
            expect(result[0].sender.balance).toBe(900);
            expect(result[0].receiver.balance).toBe(100);
        });
    });

    describe('findOne', () => {
        it('should return a transfer by id', async () => {
            const transfer = {
                id: '1',
                sender: {
                    id: '1',
                    username: 'sender',
                    balance: 900,
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                receiver: {
                    id: '2',
                    username: 'receiver',
                    balance: 100,
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                amount: 100,
                createdAt: new Date(),
                description: null
            };

            mockTransferRepository.findOne.mockResolvedValue(transfer);

            const result = await service.findOne('1');

            expect(result).toBeDefined();
            expect(result.id).toBe('1');
            expect(result.amount).toBe(100);
            expect(result.sender.balance).toBe(900);
            expect(result.receiver.balance).toBe(100);
        });

        it('should throw NotFoundException if transfer not found', async () => {
            mockTransferRepository.findOne.mockResolvedValue(null);

            await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
        });
    });
});