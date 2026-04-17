import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

/**
 * 应用程序入口
 * 配置全局管道、过滤器、Swagger 文档
 */
async function bootstrap(): Promise<void> {
    const app = await NestFactory.create(AppModule);

    // 配置全局验证管道
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true, // 自动剔除未定义的属性
            transform: true, // 自动类型转换
            forbidNonWhitelisted: true, // 禁止未定义的属性
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );

    // 配置全局异常过滤器
    app.useGlobalFilters(new HttpExceptionFilter());

    // 配置全局响应拦截器
    app.useGlobalInterceptors(new ResponseInterceptor());

    // 配置 Swagger 文档
    const config = new DocumentBuilder()
        .setTitle('Jellyfish API')
        .setDescription('Jellyfish 后端 API 文档')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    // 启用 CORS
    app.enableCors({
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
    });

    // 设置全局 API 前缀
    app.setGlobalPrefix('api/v1');

    const port = process.env.PORT ?? 3000;
    await app.listen(port);

    console.log(`Application is running on: http://localhost:${port}`);
    console.log(`API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
