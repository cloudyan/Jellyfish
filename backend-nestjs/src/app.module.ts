import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configuration } from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { LlmModule } from './llm/llm.module';
import { StudioModule } from './studio/studio.module';
import { FilmModule } from './film/film.module';
import { ScriptProcessingModule } from './script-processing/script-processing.module';

/**
 * 应用程序根模块
 * 导入所有功能模块和配置
 */
@Module({
    imports: [
        // 配置模块
        ConfigModule.forRoot({
            isGlobal: true,
            load: [configuration],
            envFilePath: ['.env', '.env.local'],
        }),

        // 基础模块
        PrismaModule,
        CommonModule,

        // 业务模块
        LlmModule,
        StudioModule,
        FilmModule,
        ScriptProcessingModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
