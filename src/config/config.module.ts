import { Module } from '@nestjs/common';
import { ConfigModule as _ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

@Module({
  imports: [
    _ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        MNEMONIC: Joi.string().required(),
        ENVIRONMENT: Joi.string()
          .valid('local', 'mainnet', 'testnet', 'devnet')
          .required(),
      }),
    }),
  ],
})
export class ConfigModule {}
