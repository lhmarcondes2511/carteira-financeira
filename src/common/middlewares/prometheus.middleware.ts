import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import { Registry } from 'prom-client';

@Injectable()
export class PrometheusMiddleware implements NestMiddleware {
    private readonly register: Registry;

    constructor(private configService: ConfigService) {
        this.register = this.configService.get('monitoring').register;
    }

    use(req: Request, res: Response, next: NextFunction) {
        if (req.path === '/metrics') {
            res.setHeader('Content-Type', this.register.contentType);
            this.register.metrics().then(data => res.end(data));
        } else {
            next();
        }
    }
}