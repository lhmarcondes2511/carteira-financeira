import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { IUser } from './interfaces/user.interface';
import { validate as isUUID } from 'uuid';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
        private readonly metricsService: MetricsService
    ) { }

    async create(createUserDto: CreateUserDto): Promise<IUser> {
        try {
            await this.checkExistingUsername(createUserDto.username);

            const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
            const user = this.usersRepository.create({
                ...createUserDto,
                password: hashedPassword,
            });

            const savedUser = await this.usersRepository.save(user);
            this.metricsService.incrementUserOperations('create', 'success');
            return this.mapToIUser(savedUser);
        } catch (error) {
            this.metricsService.incrementUserOperations('create', 'failed');
            if (error instanceof ConflictException) {
                throw error;
            }
            throw new BadRequestException('Error creating user');
        }
    }

    async findAll(): Promise<IUser[]> {
        try {
            const users = await this.usersRepository.find();
            this.metricsService.incrementUserOperations('findAll', 'success');
            return users.map(user => this.mapToIUser(user));
        } catch (error) {
            this.metricsService.incrementUserOperations('findAll', 'failed');
            throw new BadRequestException('Error fetching users');
        }
    }

    async findOne(id: string): Promise<IUser> {
        try {
            await this.validateId(id);

            const user = await this.usersRepository.findOne({
                where: { id },
                relations: ['sentTransfers', 'receivedTransfers']
            });

            if (!user) {
                this.metricsService.incrementUserOperations('findOne', 'notFound');
                throw new NotFoundException('User not found');
            }

            this.metricsService.incrementUserOperations('findOne', 'success');
            return this.mapToIUser(user);
        } catch (error) {
            this.metricsService.incrementUserOperations('findOne', 'failed');
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException('Invalid user ID');
        }
    }

    async findByUsername(username: string): Promise<User> {
        try {
            const user = await this.usersRepository.findOne({
                where: { username }
            });

            if (!user) {
                this.metricsService.incrementUserOperations('findByUsername', 'notFound');
                throw new NotFoundException('User not found');
            }

            this.metricsService.incrementUserOperations('findByUsername', 'success');
            return user;
        } catch (error) {
            this.metricsService.incrementUserOperations('findByUsername', 'failed');
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException('Error finding user');
        }
    }

    async update(id: string, updateUserDto: UpdateUserDto): Promise<IUser> {
        try {
            await this.validateId(id);

            const user = await this.usersRepository.findOne({
                where: { id },
                relations: ['sentTransfers', 'receivedTransfers']
            });

            if (!user) {
                this.metricsService.incrementUserOperations('update', 'notFound');
                throw new NotFoundException('User not found');
            }

            let hasUpdates = false;

            if (updateUserDto.username) {
                if (updateUserDto.username !== user.username) {
                    await this.checkExistingUsername(updateUserDto.username, id);
                    user.username = updateUserDto.username;
                    hasUpdates = true;
                }
            }

            if (updateUserDto.password) {
                user.password = await bcrypt.hash(updateUserDto.password, 10);
                hasUpdates = true;
            }

            if (!hasUpdates) {
                this.metricsService.incrementUserOperations('update', 'noUpdates');
                throw new BadRequestException('No valid updates provided');
            }

            const savedUser = await this.usersRepository.save(user);
            this.metricsService.incrementUserOperations('update', 'success');
            return this.mapToIUser(savedUser);
        } catch (error) {
            this.metricsService.incrementUserOperations('update', 'failed');
            if (error instanceof ConflictException ||
                error instanceof NotFoundException ||
                error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('Error updating user');
        }
    }

    async remove(id: string): Promise<void> {
        try {
            await this.validateId(id);

            const result = await this.usersRepository.delete(id);
            if (result.affected === 0) {
                this.metricsService.incrementUserOperations('remove', 'notFound');
                throw new NotFoundException('User not found');
            }
            this.metricsService.incrementUserOperations('remove', 'success');
        } catch (error) {
            this.metricsService.incrementUserOperations('remove', 'failed');
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('Error removing user');
        }
    }

    async validateUserPassword(username: string, password: string): Promise<User> {
        try {
            const user = await this.findByUsername(username);
            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                this.metricsService.incrementUserOperations('validatePassword', 'invalid');
                throw new BadRequestException('Invalid credentials');
            }

            this.metricsService.incrementUserOperations('validatePassword', 'success');
            return user;
        } catch (error) {
            this.metricsService.incrementUserOperations('validatePassword', 'failed');
            throw new BadRequestException('Invalid credentials');
        }
    }

    private async validateId(id: string): Promise<void> {
        if (!isUUID(id)) {
            throw new BadRequestException('Invalid user ID');
        }
    }

    private async checkExistingUsername(username: string, excludeUserId?: string): Promise<void> {
        const existingUser = await this.usersRepository.findOne({
            where: { username }
        });

        if (existingUser && (!excludeUserId || existingUser.id !== excludeUserId)) {
            throw new ConflictException('Username already exists');
        }
    }

    private mapToIUser(user: User): IUser {
        const { password, ...result } = user;
        return {
            ...result,
            balance: Number(result.balance)
        };
    }
}