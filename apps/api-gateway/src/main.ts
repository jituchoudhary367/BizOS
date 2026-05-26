import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

// Optional: enable Redis adapter for Socket.IO when REDIS_URL is provided
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  app.setGlobalPrefix('api');

  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    try {
      // Dynamically import to avoid hard dependency if not used
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { IoAdapter } = require('@nestjs/platform-socket.io');
      const { createAdapter } = require('socket.io-redis');
      const adapter = createAdapter({ url: redisUrl });
      const adapterInstance = new IoAdapter(app.getHttpServer());
      adapterInstance.createIOServer = function (port, options) {
        const server = require('socket.io')(this.httpServer, options);
        server.adapter(adapter);
        return server;
      };
      // setAdapter expects a WebSocket adapter; this uses IoAdapter with redis
      app.useWebSocketAdapter(adapterInstance);
      console.log('✅ Redis adapter for Socket.IO configured');
    } catch (e) {
      console.warn('Could not configure Redis adapter for Socket.IO:', e.message || e);
    }
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 BizOS API Gateway running on port ${port}`);
}

bootstrap();
