import { registerAs } from '@nestjs/config';
import { Registry, collectDefaultMetrics } from 'prom-client';

export default registerAs('monitoring', () => {
    const register = new Registry();

    collectDefaultMetrics({ register });

    return {
        register,
        path: '/metrics',
        defaultLabels: { app: 'carteira-financeira' },
        defaultMetrics: {
            enabled: true,
            interval: 5000,
        },
        customMetrics: {
            httpRequestDurationMicroseconds: {
                name: 'http_request_duration_seconds',
                help: 'Duration of HTTP requests in microseconds',
                labelNames: ['method', 'route', 'status_code'],
            },
            transfersTotal: {
                name: 'transfers_total',
                help: 'Total number of transfers',
                labelNames: ['status'],
            },
        },
    };
});