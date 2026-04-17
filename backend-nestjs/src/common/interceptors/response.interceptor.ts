import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';

/**
 * 统一响应接口
 */
interface ApiResponse<T> {
    success: true;
    data: T;
    timestamp: string;
    path: string;
}

/**
 * 分页响应接口
 */
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

/**
 * 响应拦截器
 * 统一成功响应格式
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
    intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T>> {
        const request = context.switchToHttp().getRequest();
        const path = request.url;

        return next.handle().pipe(
            map((data) => ({
                success: true,
                data,
                timestamp: new Date().toISOString(),
                path,
            })),
        );
    }
}

/**
 * 创建成功响应（用于控制器直接返回）
 */
export function createdResponse<T>(data: T, message = 'Created successfully'): { success: true; data: T; message: string } {
    return {
        success: true,
        data,
        message,
    };
}

/**
 * 创建分页响应
 */
export function paginatedResponse<T>(
    items: T[],
    total: number,
    page: number,
    pageSize: number,
): PaginatedResponse<T> {
    return {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}

/**
 * 创建空响应
 */
export function emptyResponse(message = 'Success'): { success: true; message: string } {
    return {
        success: true,
        message,
    };
}
