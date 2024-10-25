import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from 'src/modules/users/users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from 'src/modules/users/entities/user.entity';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { validate as isUUID } from 'uuid';

describe('UsersService', () => {
    let service: UsersService;
    let repository: Repository<User>;

    const mockRepository = {
        create: jest.fn(),
        save: jest.fn(),
        findOne: jest.fn(),
        find: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: getRepositoryToken(User),
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
        repository = module.get<Repository<User>>(getRepositoryToken(User));
        jest.clearAllMocks();
    });

    describe('create', () => {
        const createUserDto = {
            username: 'testuser',
            password: 'Test@123',
        };

        it('should create a new user successfully', async () => {
            const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
            const user = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                ...createUserDto,
                password: hashedPassword,
                balance: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                sentTransfers: [],
                receivedTransfers: []
            };

            mockRepository.findOne.mockResolvedValue(null);
            mockRepository.create.mockReturnValue(user);
            mockRepository.save.mockResolvedValue(user);

            const result = await service.create(createUserDto);

            expect(result).not.toHaveProperty('password');
            expect(result.username).toBe(createUserDto.username);
            expect(result.balance).toBe(0);
        });

        it('should throw ConflictException if username exists', async () => {
            mockRepository.findOne.mockResolvedValue({ username: createUserDto.username });

            await expect(service.create(createUserDto))
                .rejects.toThrow(ConflictException);
        });

        it('should throw BadRequestException on error', async () => {
            mockRepository.findOne.mockRejectedValue(new Error('Database error'));

            await expect(service.create(createUserDto))
                .rejects.toThrow(BadRequestException);
        });
    });

    describe('findAll', () => {
        it('should return all users without passwords', async () => {
            const users = [
                {
                    id: '123e4567-e89b-12d3-a456-426614174000',
                    username: 'user1',
                    password: 'hash1',
                    balance: 100,
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    id: '223e4567-e89b-12d3-a456-426614174000',
                    username: 'user2',
                    password: 'hash2',
                    balance: 200,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ];

            mockRepository.find.mockResolvedValue(users);

            const result = await service.findAll();

            expect(result.length).toBe(2);
            result.forEach(user => {
                expect(user).not.toHaveProperty('password');
                expect(typeof user.balance).toBe('number');
            });
        });

        it('should throw BadRequestException on error', async () => {
            mockRepository.find.mockRejectedValue(new Error('Database error'));

            await expect(service.findAll())
                .rejects.toThrow(BadRequestException);
        });
    });

    describe('findOne', () => {
        const validUuid = '123e4567-e89b-12d3-a456-426614174000';

        it('should return a user successfully', async () => {
            const user = {
                id: validUuid,
                username: 'testuser',
                password: 'hashedpassword',
                balance: 100,
                createdAt: new Date(),
                updatedAt: new Date(),
                sentTransfers: [],
                receivedTransfers: []
            };

            mockRepository.findOne.mockResolvedValue(user);

            const result = await service.findOne(validUuid);

            expect(result).not.toHaveProperty('password');
            expect(result.username).toBe(user.username);
            expect(result.balance).toBe(100);
        });

        it('should throw BadRequestException for invalid UUID', async () => {
            await expect(service.findOne('invalid-id'))
                .rejects.toThrow(BadRequestException);
            expect(mockRepository.findOne).not.toHaveBeenCalled();
        });

        it('should throw NotFoundException if user not found', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            await expect(service.findOne(validUuid))
                .rejects.toThrow(NotFoundException);
        });
    });

    describe('update', () => {
        const validUuid = '123e4567-e89b-12d3-a456-426614174000';
        const updateUserDto = {
            username: 'updateduser',
            password: 'NewTest@123'
        };

        it('should update user successfully', async () => {
            const existingUser = {
                id: validUuid,
                username: 'oldusername',
                password: 'oldhash',
                balance: 100,
                createdAt: new Date(),
                updatedAt: new Date(),
                sentTransfers: [],
                receivedTransfers: []
            };

            mockRepository.findOne
                .mockResolvedValueOnce(existingUser)
                .mockResolvedValueOnce(null);

            const updatedUser = {
                ...existingUser,
                username: updateUserDto.username,
                password: await bcrypt.hash(updateUserDto.password, 10)
            };

            mockRepository.save.mockResolvedValue(updatedUser);

            const result = await service.update(validUuid, updateUserDto);

            expect(result.username).toBe(updateUserDto.username);
            expect(result).not.toHaveProperty('password');
            expect(result.balance).toBe(100);
        });

        it('should throw BadRequestException for invalid UUID', async () => {
            await expect(service.update('invalid-id', updateUserDto))
                .rejects.toThrow(BadRequestException);
        });

        it('should throw NotFoundException if user not found', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            await expect(service.update(validUuid, updateUserDto))
                .rejects.toThrow(NotFoundException);
        });

        it('should throw ConflictException if new username exists', async () => {
            const existingUser = {
                id: validUuid,
                username: 'oldusername'
            };

            const userWithSameUsername = {
                id: 'different-uuid',
                username: updateUserDto.username
            };

            mockRepository.findOne
                .mockResolvedValueOnce(existingUser)
                .mockResolvedValueOnce(userWithSameUsername);

            await expect(service.update(validUuid, { username: updateUserDto.username }))
                .rejects.toThrow(ConflictException);
        });
    });

    describe('validateUserPassword', () => {
        it('should validate password successfully', async () => {
            const password = 'Test@123';
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                username: 'testuser',
                password: hashedPassword
            };

            mockRepository.findOne.mockResolvedValue(user);

            const result = await service.validateUserPassword('testuser', password);
            expect(result).toBeDefined();
            expect(result.username).toBe(user.username);
        });

        it('should throw BadRequestException for invalid credentials', async () => {
            const user = {
                username: 'testuser',
                password: await bcrypt.hash('Test@123', 10)
            };

            mockRepository.findOne.mockResolvedValue(user);

            await expect(service.validateUserPassword('testuser', 'wrongpassword'))
                .rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException for non-existent user', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            await expect(service.validateUserPassword('nonexistent', 'Test@123'))
                .rejects.toThrow(BadRequestException);
        });
    });

    describe('remove', () => {
        const validUuid = '123e4567-e89b-12d3-a456-426614174000';

        it('should remove user successfully', async () => {
            mockRepository.delete.mockResolvedValue({ affected: 1 });

            await expect(service.remove(validUuid)).resolves.not.toThrow();
        });

        it('should throw BadRequestException for invalid UUID', async () => {
            await expect(service.remove('invalid-id'))
                .rejects.toThrow(BadRequestException);
        });

        it('should throw NotFoundException if user not found', async () => {
            mockRepository.delete.mockResolvedValue({ affected: 0 });

            await expect(service.remove(validUuid))
                .rejects.toThrow(NotFoundException);
        });
    });
});