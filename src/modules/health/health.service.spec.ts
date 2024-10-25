import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';

describe('HealthService', () => {
    let service: HealthService;
    let mockUserRepository;

    beforeEach(async () => {
        mockUserRepository = {
            query: jest.fn()
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                HealthService,
                {
                    provide: getRepositoryToken(User),
                    useValue: mockUserRepository
                }
            ],
        }).compile();

        service = module.get<HealthService>(HealthService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('check', () => {
        it('should return healthy status when database is connected', async () => {
            mockUserRepository.query.mockResolvedValue([{ '1': 1 }]);

            const result = await service.check();

            expect(result).toHaveProperty('status', 'ok');
            expect(result).toHaveProperty('timestamp');
            expect(result).toHaveProperty('uptime');
            expect(result).toHaveProperty('environment');
            expect(result).toHaveProperty('databaseStatus', 'healthy');
        });

        it('should return unhealthy status when database is not connected', async () => {
            mockUserRepository.query.mockRejectedValue(new Error('Database error'));

            const result = await service.check();

            expect(result).toHaveProperty('status', 'ok');
            expect(result).toHaveProperty('timestamp');
            expect(result).toHaveProperty('uptime');
            expect(result).toHaveProperty('environment');
            expect(result).toHaveProperty('databaseStatus', 'unhealthy');
        });

        it('should return valid timestamp', async () => {
            mockUserRepository.query.mockResolvedValue([{ '1': 1 }]);

            const result = await service.check();
            const timestamp = new Date(result.timestamp);

            expect(timestamp).toBeInstanceOf(Date);
            expect(isNaN(timestamp.getTime())).toBe(false);
        });

        it('should return valid uptime', async () => {
            mockUserRepository.query.mockResolvedValue([{ '1': 1 }]);

            const result = await service.check();

            expect(typeof result.uptime).toBe('number');
            expect(result.uptime).toBeGreaterThan(0);
        });
    });
});