import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
    let controller: HealthController;
    let service: HealthService;

    beforeEach(async () => {
        const mockHealthService = {
            check: jest.fn()
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [HealthController],
            providers: [
                {
                    provide: HealthService,
                    useValue: mockHealthService
                }
            ],
        }).compile();

        controller = module.get<HealthController>(HealthController);
        service = module.get<HealthService>(HealthService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('check', () => {
        it('should return health check result', async () => {
            const mockHealthCheck = {
                status: 'ok',
                timestamp: new Date().toISOString(),
                uptime: 123.456,
                environment: 'test',
                databaseStatus: 'healthy'
            };

            jest.spyOn(service, 'check').mockResolvedValue(mockHealthCheck);

            const result = await controller.check();

            expect(result).toEqual(mockHealthCheck);
            expect(service.check).toHaveBeenCalled();
        });

        it('should handle errors gracefully', async () => {
            jest.spyOn(service, 'check').mockRejectedValue(new Error('Test error'));

            await expect(controller.check()).rejects.toThrow('Test error');
        });
    });
});