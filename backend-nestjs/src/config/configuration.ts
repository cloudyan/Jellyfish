/**
 * 应用配置管理
 * 集中管理数据库、LLM、S3 等配置
 */
export interface DatabaseConfig {
    url: string;
}

export interface LlmProviderConfig {
    apiKey: string;
    baseUrl: string;
    defaultModel: string;
}

export interface LlmConfig {
    openai: LlmProviderConfig;
    deepseek: LlmProviderConfig;
    siliconflow: LlmProviderConfig;
    defaultProvider: string;
}

export interface S3Config {
    endpoint: string;
    region: string;
    bucket: string;
    accessKeyId: string;
    secretAccessKey: string;
}

export interface AppConfig {
    port: number;
    nodeEnv: string;
    frontendUrl: string;
    database: DatabaseConfig;
    llm: LlmConfig;
    s3: S3Config;
}

export const configuration = (): AppConfig => ({
    port: parseInt(process.env.PORT ?? '3000', 10),
    nodeEnv: process.env.NODE_ENV ?? 'development',
    frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',

    database: {
        url: process.env.DATABASE_URL ?? 'postgresql://user:password@localhost:5432/jellyfish',
    },

    llm: {
        openai: {
            apiKey: process.env.OPENAI_API_KEY ?? '',
            baseUrl: process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
            defaultModel: process.env.OPENAI_DEFAULT_MODEL ?? 'gpt-4o-mini',
        },
        deepseek: {
            apiKey: process.env.DEEPSEEK_API_KEY ?? '',
            baseUrl: process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com/v1',
            defaultModel: process.env.DEEPSEEK_DEFAULT_MODEL ?? 'deepseek-chat',
        },
        siliconflow: {
            apiKey: process.env.SILICONFLOW_API_KEY ?? '',
            baseUrl: process.env.SILICONFLOW_BASE_URL ?? 'https://api.siliconflow.cn/v1',
            defaultModel: process.env.SILICONFLOW_DEFAULT_MODEL ?? 'deepseek-ai/DeepSeek-V3',
        },
        defaultProvider: process.env.LLM_DEFAULT_PROVIDER ?? 'deepseek',
    },

    s3: {
        endpoint: process.env.S3_ENDPOINT ?? '',
        region: process.env.S3_REGION ?? 'auto',
        bucket: process.env.S3_BUCKET ?? 'jellyfish',
        accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
    },
});
