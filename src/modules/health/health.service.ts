import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Injectable()
export class HealthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    async check() {
        const startTime = process.uptime();
        let databaseStatus = 'healthy';

        try {
            await this.userRepository.query('SELECT 1');
        } catch (error) {
            databaseStatus = 'unhealthy';
        }

        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: startTime,
            environment: process.env.NODE_ENV,
            databaseStatus
        };
    }
}