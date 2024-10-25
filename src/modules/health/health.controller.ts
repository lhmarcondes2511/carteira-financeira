import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('Health Check')
@Controller('health')
export class HealthController {
    constructor(private readonly healthService: HealthService) {}

    @Get()
    @ApiOperation({ summary: 'Verifica o status da aplicação' })
    @ApiResponse({ 
        status: 200, 
        description: 'Aplicação está funcionando corretamente',
        schema: {
            type: 'object',
            properties: {
                status: { type: 'string' },
                timestamp: { type: 'string' },
                uptime: { type: 'number' },
                environment: { type: 'string' },
                databaseStatus: { type: 'string' }
            }
        }
    })
    async check() {
        return this.healthService.check();
    }
}