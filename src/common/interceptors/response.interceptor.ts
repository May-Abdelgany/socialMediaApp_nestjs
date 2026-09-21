import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { getRequestLang } from '../utils/get-request-lang.util';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const lang = getRequestLang(request);

    return next.handle().pipe(
      map((data) => ({
        success: true,
        statusCode: response.statusCode || 200,
        data,
        lang,
        timestamp: new Date().toISOString(),
        path: request.url,
      })),
    );
  }
}
