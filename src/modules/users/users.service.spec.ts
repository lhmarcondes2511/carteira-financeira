import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from 'src/modules/users/users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from 'src/modules/users/entities/user.entity';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
    let service: UsersService;
    let repository: Repository<User>;

    const mockRepository = {
        create: jest.fn(),
        save: jest.fn(),
        findOne: jest.fn(),
        find: jest.fn(),
        delete: jest.fn(),
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

        it('should throw NotFoundException if user not found', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            await expect(service.findOne(validUuid))
                .rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException if invalid uuid', async () => {
            await expect(service.findOne('invalid-id'))
                .rejects.toThrow(BadRequestException);
        });
    });

    describe('update', () => {
        const validUuid = '123e4567-e89b-12d3-a456-426614174000';
        
        it('should update username successfully', async () => {
            const existingUser = {
                id: validUuid,
                username: 'oldusername',
                password: 'hashedpassword',
                balance: 100,
                createdAt: new Date(),
                updatedAt: new Date(),
                sentTransfers: [],
                receivedTransfers: []
            };

            const updateUserDto = { username: 'newusername' };

            mockRepository.findOne
                .mockResolvedValueOnce(existingUser)
                .mockResolvedValueOnce(null);
            
            const updatedUser = { ...existingUser, ...updateUserDto };
            mockRepository.save.mockResolvedValue(updatedUser);

            const result = await service.update(validUuid, updateUserDto);

            expect(result.username).toBe(updateUserDto.username);
            expect(result).not.toHaveProperty('password');
            expect(result.balance).toBe(100);
        });

        it('should update password successfully', async () => {
            const existingUser = {
                id: validUuid,
                username: 'testuser',
                password: 'oldhash',
                balance: 100,
                createdAt: new Date(),
                updatedAt: new Date(),
                sentTransfers: [],
                receivedTransfers: []
            };

            const updateUserDto = { password: 'NewTest@123' };

            mockRepository.findOne.mockResolvedValue(existingUser);
            mockRepository.save.mockImplementation(user => Promise.resolve(user));

            const result = await service.update(validUuid, updateUserDto);

            expect(result).not.toHaveProperty('password');
            expect(result.username).toBe(existingUser.username);
        });

        it('should throw BadRequestException if no updates provided', async () => {
            await expect(service.update(validUuid, {}))
                .rejects.toThrow(BadRequestException);
        });
    });

    describe('findByUsername', () => {
        it('should return user if found', async () => {
            const user = {
                username: 'testuser',
                password: 'hashedpassword'
            };

            mockRepository.findOne.mockResolvedValue(user);

            const result = await service.findByUsername('testuser');
            expect(result).toBeDefined();
            expect(result.username).toBe(user.username);
        });

        it('should throw NotFoundException if user not found', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            await expect(service.findByUsername('nonexistent'))
                .rejects.toThrow(NotFoundException);
        });
    });

    describe('validateUserPassword', () => {
        it('should validate correct password', async () => {
            const password = 'Test@123';
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = {
                username: 'testuser',
                password: hashedPassword
            };

            mockRepository.findOne.mockResolvedValue(user);

            const result = await service.validateUserPassword('testuser', password);
            expect(result).toBeDefined();
        });

        it('should throw BadRequestException for invalid password', async () => {
            const user = {
                username: 'testuser',
                password: await bcrypt.hash('Test@123', 10)
            };

            mockRepository.findOne.mockResolvedValue(user);

            await expect(service.validateUserPassword('testuser', 'wrongpassword'))
                .rejects.toThrow(BadRequestException);
        });
    });

    describe('findAll', () => {
        it('should return an array of users', async () => {
            const users = [
                {
                    id: '123e4567-e89b-12d3-a456-426614174000',
                    username: 'user1',
                    password: 'hashedpassword1',
                    balance: 100,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    sentTransfers: [],
                    receivedTransfers: []
                },
                {
                    id: '223e4567-e89b-12d3-a456-426614174000',
                    username: 'user2',
                    password: 'hashedpassword2',
                    balance: 200,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    sentTransfers: [],
                    receivedTransfers: []
                }
            ];

            mockRepository.find.mockResolvedValue(users);

            const result = await service.findAll();

            expect(result).toHaveLength(2);
            expect(result[0]).not.toHaveProperty('password');
            expect(result[1]).not.toHaveProperty('password');
            expect(result[0].username).toBe('user1');
            expect(result[1].username).toBe('user2');
        });

        it('should return an empty array if no users found', async () => {
            mockRepository.find.mockResolvedValue([]);

            const result = await service.findAll();

            expect(result).toEqual([]);
        });

        it('should throw BadRequestException if error occurs', async () => {
            mockRepository.find.mockRejectedValue(new Error('Database error'));

            await expect(service.findAll()).rejects.toThrow(BadRequestException);
        });
    });

    describe('remove', () => {
        const validUuid = '123e4567-e89b-12d3-a456-426614174000';

        it('should remove a user successfully', async () => {
            mockRepository.delete.mockResolvedValue({ affected: 1 });

            await expect(service.remove(validUuid)).resolves.not.toThrow();
        });

        it('should throw NotFoundException if user not found', async () => {
            mockRepository.delete.mockResolvedValue({ affected: 0 });

            await expect(service.remove(validUuid)).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException if invalid uuid', async () => {
            await expect(service.remove('invalid-id')).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if error occurs', async () => {
            mockRepository.delete.mockRejectedValue(new Error('Database error'));

            await expect(service.remove(validUuid)).rejects.toThrow(BadRequestException);
        });
    });
});