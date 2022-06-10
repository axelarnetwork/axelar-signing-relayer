import { Module } from '@nestjs/common';
import { AxelarSigningClientUtil } from './app-sdk.service';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { EvmSigningClientUtil } from './evm-signer.service';

@Module({
  imports: [
    ConfigModule
  ],
  controllers: [AppController],
  providers: [AppService, AxelarSigningClientUtil, EvmSigningClientUtil],
})
export class AppModule {}
