import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

// 捕获 redis 错误
redisClient.on('error', (err) => {
  console.error('Redis Client Error', err);
});

// createClient 后需要调用 connect()
redisClient.connect().catch(console.error)

export default redisClient;