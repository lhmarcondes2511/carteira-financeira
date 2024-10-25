import { registerAs } from '@nestjs/config';
import { WinstonModuleOptions } from 'nest-winston';
import { format, transports } from 'winston';

export default registerAs('logging', (): WinstonModuleOptions => ({
    level: process.env.LOG_LEVEL || 'info',
    format: format.combine(
        format.timestamp(),
        format.json()
    ),
    transports: [
        new transports.Console({
            format: format.combine(
                format.colorize(),
                format.simple()
            ),
        }),
        new transports.File({ filename: 'error.log', level: 'error' }),
        new transports.File({ filename: 'combined.log' }),
    ],
}));