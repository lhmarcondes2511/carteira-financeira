import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ThrottlerGuard, ThrottlerModuleOptions, ThrottlerStorage } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { ExecutionContext } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RateLimiterMiddleware implements NestMiddleware {
  private throttlerGuard: ThrottlerGuard;

  constructor(
    private configService: ConfigService,
    private throttlerStorage: ThrottlerStorage,
    private reflector: Reflector
  ) {
    const ttl = this.configService.get('THROTTLE_TTL', 60);
    const limit = this.configService.get('THROTTLE_LIMIT', 10);
    const options: ThrottlerModuleOptions = {
      throttlers: [{ ttl, limit }],
    };
    this.throttlerGuard = new ThrottlerGuard(options, this.throttlerStorage, this.reflector);
  }

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const context = this.createExecutionContext(req);
      await this.throttlerGuard.canActivate(context);
      next();
    } catch (error) {
      if (error instanceof ThrottlerException) {
        res.status(429).json({ message: 'Too Many Requests' });
      } else {
        next(error);
      }
    }
  }

  private createExecutionContext(req: Request): ExecutionContext {
    const executionContext = {
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => ({}),
        getNext: () => (() => {}),
      }),
      getClass: () => ({}),
      getHandler: () => ({}),
      getType: () => 'http',
      getArgs: () => [],
    };
    return executionContext as ExecutionContext;
  }
}