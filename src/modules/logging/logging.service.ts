import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WinstonModule, utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';

@Injectable()
export class LoggingService implements NestLoggerService {
    private logger: winston.Logger;

    constructor(private configService: ConfigService) {
        const loggingConfig = this.configService.get('logging');
        this.logger = winston.createLogger(loggingConfig);

        this.logger.add(new winston.transports.Console({
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.ms(),
                nestWinstonModuleUtilities.format.nestLike('MyApp', { prettyPrint: true }),
            ),
        }));
    }

    log(message: any, context?: string): void {
        this.logger.info(message, { context });
    }

    error(message: any, trace?: string, context?: string): void {
        this.logger.error(message, { trace, context });
    }

    warn(message: any, context?: string): void {
        this.logger.warn(message, { context });
    }

    debug?(message: any, context?: string): void {
        this.logger.debug(message, { context });
    }

    verbose?(message: any, context?: string): void {
        this.logger.verbose(message, { context });
    }
}