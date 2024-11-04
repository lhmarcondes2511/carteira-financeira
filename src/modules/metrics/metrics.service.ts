import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Registry, Counter, Histogram, Gauge } from 'prom-client';
import { LoggingService } from 'src/modules/logging/logging.service';

@Injectable()
export class MetricsService implements OnModuleInit {
    private register: Registry;
    private metrics: {
        systemCpuUsage: Counter<string>;
        systemMemoryUsage: Gauge<string>;
        appHttpRequestDuration: Histogram<string>;
        appUserOperations: Counter<string>;
        appTransferOperations: Counter<string>;
        appBalanceOperations: Counter<string>;
        appTransferAmount: Histogram<string>;
        appBalanceIncrease: Histogram<string>;
        appActiveUsers: Gauge<string>;
    };

    constructor(private configService: ConfigService, private loggingService: LoggingService) {
        this.register = this.configService.get('monitoring').register;
        this.metrics = {} as any;
    }

    onModuleInit() {
        this.initializeMetrics();
        this.startPeriodicMetricsCollection();
        this.loggingService.log('MetricsService initialized', 'MetricsService');
    }

    private initializeMetrics() {
        this.metrics.systemCpuUsage = new Counter({
            name: 'system_cpu_usage_seconds_total',
            help: 'Total system CPU time spent in seconds',
            registers: [this.register],
        });

        this.metrics.systemMemoryUsage = new Gauge({
            name: 'system_memory_usage_bytes',
            help: 'System memory usage in bytes',
            registers: [this.register],
        });

        this.metrics.appHttpRequestDuration = new Histogram({
            name: 'app_http_request_duration_seconds',
            help: 'Duration of HTTP requests in seconds',
            labelNames: ['method', 'route', 'status_code'],
            buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
            registers: [this.register],
        });

        this.metrics.appUserOperations = new Counter({
            name: 'app_user_operations_total',
            help: 'Total number of user operations',
            labelNames: ['operation', 'status'],
            registers: [this.register],
        });

        this.metrics.appTransferOperations = new Counter({
            name: 'app_transfer_operations_total',
            help: 'Total number of transfer operations',
            labelNames: ['operation', 'status'],
            registers: [this.register],
        });

        this.metrics.appBalanceOperations = new Counter({
            name: 'app_balance_operations_total',
            help: 'Total number of balance operations',
            labelNames: ['operation', 'status'],
            registers: [this.register],
        });

        this.metrics.appTransferAmount = new Histogram({
            name: 'app_transfer_amount',
            help: 'Distribution of transfer amounts',
            buckets: [10, 50, 100, 500, 1000, 5000, 10000],
            registers: [this.register],
        });

        this.metrics.appBalanceIncrease = new Histogram({
            name: 'app_balance_increase_amount',
            help: 'Distribution of balance increase amounts',
            buckets: [10, 50, 100, 500, 1000, 5000, 10000],
            registers: [this.register],
        });

        this.metrics.appActiveUsers = new Gauge({
            name: 'app_active_users',
            help: 'Number of active users',
            registers: [this.register],
        });
    }

    private startPeriodicMetricsCollection() {
        setInterval(() => {
            this.collectSystemMetrics();
        }, 15000);
    }

    private collectSystemMetrics() {
        const memoryUsage = process.memoryUsage();
        this.metrics.systemMemoryUsage.set(memoryUsage.rss);

        const cpuUsage = process.cpuUsage();
        const totalCpuTime = cpuUsage.user + cpuUsage.system;
        this.metrics.systemCpuUsage.inc(totalCpuTime / 1000000);
    }

    incrementUserOperations(operation: string, status: string) {
        this.metrics.appUserOperations.inc({ operation, status });
        this.loggingService.debug(`User operation: ${operation}, status: ${status}`, 'MetricsService');
    }

    incrementTransferOperations(operation: string, status: string) {
        this.metrics.appTransferOperations.inc({ operation, status });
    }

    incrementBalanceOperations(operation: string, status: string) {
        this.metrics.appBalanceOperations.inc({ operation, status });
    }

    recordTransferAmount(amount: number) {
        this.metrics.appTransferAmount.observe(amount);
    }

    recordBalanceIncrease(amount: number) {
        this.metrics.appBalanceIncrease.observe(amount);
    }

    recordHttpRequestDuration(method: string, route: string, statusCode: number, durationInSeconds: number) {
        this.metrics.appHttpRequestDuration.observe(
            { method, route, status_code: statusCode.toString() },
            durationInSeconds
        );
    }

    setActiveUsers(count: number) {
        this.metrics.appActiveUsers.set(count);
    }

    async getMetrics(): Promise<string> {
        return this.register.metrics();
    }

    getContentType(): string {
        return this.register.contentType;
    }
}