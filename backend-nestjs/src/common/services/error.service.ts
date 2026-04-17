import { Injectable, HttpStatus, HttpException } from '@nestjs/common';

/**
 * 错误响应数据接口
 */
export interface ErrorResponse {
    code: string;
    message: string;
    details?: Record<string, unknown>;
}

/**
 * 错误处理服务
 * 提供统一的错误生成方法，类似于 Python 版本中的错误处理
 */
@Injectable()
export class ErrorService {
    /**
     * 实体不存在错误
     */
    entityNotFound(
        entityName: string,
        identifier: string | number,
    ): HttpException {
        return new HttpException(
            {
                code: 'ENTITY_NOT_FOUND',
                message: `${entityName} with identifier '${identifier}' not found`,
            } as ErrorResponse,
            HttpStatus.NOT_FOUND,
        );
    }

    /**
     * 实体已存在错误
     */
    entityAlreadyExists(
        entityName: string,
        field: string,
        value: string,
    ): HttpException {
        return new HttpException(
            {
                code: 'ENTITY_ALREADY_EXISTS',
                message: `${entityName} with ${field} '${value}' already exists`,
            } as ErrorResponse,
            HttpStatus.CONFLICT,
        );
    }

    /**
     * 必填字段缺失错误
     */
    requiredField(fieldName: string): HttpException {
        return new HttpException(
            {
                code: 'REQUIRED_FIELD',
                message: `Field '${fieldName}' is required`,
            } as ErrorResponse,
            HttpStatus.BAD_REQUEST,
        );
    }

    /**
     * 无效选择错误
     */
    invalidChoice(
        fieldName: string,
        value: string,
        validChoices: string[],
    ): HttpException {
        return new HttpException(
            {
                code: 'INVALID_CHOICE',
                message: `Invalid choice '${value}' for field '${fieldName}'. Valid choices are: ${validChoices.join(', ')}`,
            } as ErrorResponse,
            HttpStatus.BAD_REQUEST,
        );
    }

    /**
     * 不属于资源错误
     */
    notBelongTo(
        childEntity: string,
        parentEntity: string,
    ): HttpException {
        return new HttpException(
            {
                code: 'NOT_BELONG_TO',
                message: `The ${childEntity} does not belong to this ${parentEntity}`,
            } as ErrorResponse,
            HttpStatus.FORBIDDEN,
        );
    }

    /**
     * 验证错误
     */
    validationError(
        message: string,
        details?: Record<string, unknown>,
    ): HttpException {
        return new HttpException(
            {
                code: 'VALIDATION_ERROR',
                message,
                details,
            } as ErrorResponse,
            HttpStatus.BAD_REQUEST,
        );
    }

    /**
     * 认证错误
     */
    unauthorized(message = 'Authentication required'): HttpException {
        return new HttpException(
            {
                code: 'UNAUTHORIZED',
                message,
            } as ErrorResponse,
            HttpStatus.UNAUTHORIZED,
        );
    }

    /**
     * 权限错误
     */
    forbidden(message = 'Permission denied'): HttpException {
        return new HttpException(
            {
                code: 'FORBIDDEN',
                message,
            } as ErrorResponse,
            HttpStatus.FORBIDDEN,
        );
    }

    /**
     * 外部服务错误
     */
    externalServiceError(
        serviceName: string,
        message: string,
    ): HttpException {
        return new HttpException(
            {
                code: 'EXTERNAL_SERVICE_ERROR',
                message: `Error from ${serviceName}: ${message}`,
            } as ErrorResponse,
            HttpStatus.BAD_GATEWAY,
        );
    }
}
