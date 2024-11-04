import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { HttpMetricsInterceptor } from './common/interceptors/metrics.interceptor';
import { MetricsService } from './modules/metrics/metrics.service';
import { LoggingService } from './modules/logging/logging.service'; 
import { WinstonModule } from 'nest-winston'; 
import { ConfigService } from '@nestjs/config'; 

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        bufferLogs: true,
    });

    const configService = app.get(ConfigService);
    const loggingConfig = configService.get('logging');

    app.useLogger(WinstonModule.createLogger(loggingConfig));

    const logger = app.get(LoggingService);

    app.use(helmet());

    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
        forbidNonWhitelisted: true,
        skipMissingProperties: true
    }));

    // Configuração do interceptor de métricas HTTP
    const metricsService = app.get(MetricsService);
    app.useGlobalInterceptors(new HttpMetricsInterceptor(metricsService));

    const config = new DocumentBuilder()
        .setTitle('Carteira Financeira API')
        .setDescription('API para gerenciamento de carteira financeira')
        .setVersion('1.0')
        .addBearerAuth()
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    const port = configService.get('PORT') || 3000;
    await app.listen(port);

    logger.log(`Application is running on: ${await app.getUrl()}`, 'Bootstrap');
}

bootstrap().catch((error) => {
    console.error('Error during application bootstrap', error);
    process.exit(1);
});