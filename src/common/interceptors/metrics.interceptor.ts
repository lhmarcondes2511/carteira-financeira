import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from 'src/modules/metrics/metrics.service';

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(private metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();

    return next.handle().pipe(
      tap(() => {
        const response = httpContext.getResponse();
        const duration = (Date.now() - now) / 1000; 
        this.metricsService.recordHttpRequestDuration(
          request.method,
          request.route.path,
          response.statusCode,
          duration
        );
      }),
    );
  }
}