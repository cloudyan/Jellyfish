import { config } from 'dotenv';

// 加载测试环境变量
config({ path: '.env.test' });

// 全局测试配置
beforeAll(() => {
  // 全局初始化
});

afterAll(async () => {
  // 全局清理
});
