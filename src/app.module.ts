import { Module } from '@nestjs/common';
import { AxelarSigningClientUtil } from './app-sdk.service';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';

@Module({
  imports: [
    ConfigModule
  ],
  controllers: [AppController],
  providers: [AppService, AxelarSigningClientUtil],
})
export class AppModule {}
