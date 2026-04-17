import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CrudService } from './services/crud.service';
import { ErrorService } from './services/error.service';

/**
 * 通用模块
 * 提供全局可用的服务和工具
 */
@Global()
@Module({
    imports: [ConfigModule],
    providers: [CrudService, ErrorService],
    exports: [CrudService, ErrorService],
})
export class CommonModule {}
