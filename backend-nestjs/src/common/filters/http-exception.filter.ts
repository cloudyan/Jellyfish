import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * 错误响应接口
 */
interface ErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    };
    timestamp: string;
    path: string;
}

/**
 * HTTP 异常过滤器
 * 统一错误响应格式
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest();
        const status = exception.getStatus();

        // 获取异常响应
        const exceptionResponse = exception.getResponse();
        let errorCode = 'INTERNAL_ERROR';
        let errorMessage = 'Internal server error';
        let errorDetails: Record<string, unknown> | undefined;

        // 解析异常响应
        if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
            const responseObj = exceptionResponse as Record<string, unknown>;
            errorCode = (responseObj.code as string) || this.getErrorCode(status);
            errorMessage = (responseObj.message as string) || errorMessage;
            errorDetails = responseObj.details as Record<string, unknown> | undefined;
        } else if (typeof exceptionResponse === 'string') {
            errorMessage = exceptionResponse;
        }

        const errorResponse: ErrorResponse = {
            success: false,
            error: {
                code: errorCode,
                message: errorMessage,
                ...(errorDetails && { details: errorDetails }),
            },
            timestamp: new Date().toISOString(),
            path: request.url,
        };

        response.status(status).json(errorResponse);
    }

    /**
     * 根据 HTTP 状态码获取错误代码
     */
    private getErrorCode(status: number): string {
        const codeMap: Record<number, string> = {
            [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
            [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
            [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
            [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
            [HttpStatus.CONFLICT]: 'CONFLICT',
            [HttpStatus.UNPROCESSABLE_ENTITY]: 'VALIDATION_ERROR',
            [HttpStatus.TOO_MANY_REQUESTS]: 'RATE_LIMIT',
            [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_ERROR',
            [HttpStatus.BAD_GATEWAY]: 'BAD_GATEWAY',
            [HttpStatus.SERVICE_UNAVAILABLE]: 'SERVICE_UNAVAILABLE',
        };

        return codeMap[status] || 'UNKNOWN_ERROR';
    }
}
