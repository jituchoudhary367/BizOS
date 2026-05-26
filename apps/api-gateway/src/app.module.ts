import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { BusinessModule } from './business/business.module';
import { ProxyModule } from './proxy/proxy.module';
import { HealthModule } from './health/health.module';
import { WsGateway } from './ws/ws.gateway';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 200 }]),
    AuthModule,
    BusinessModule,
    ProxyModule,
    HealthModule,
  ],
  providers: [WsGateway],
})
export class AppModule {}
