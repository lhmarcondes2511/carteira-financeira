import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MetricsService } from '../../modules/metrics/metrics.service';

@Injectable()
export class PrometheusMiddleware implements NestMiddleware {
  constructor(private metricsService: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      this.metricsService.recordHttpRequestDuration(
        req.method,
        req.route?.path || req.path,
        res.statusCode,
        duration / 1000
      );
    });
    next();
  }
}