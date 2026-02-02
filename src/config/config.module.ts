import { Module } from '@nestjs/common';
import { ConfigModule as _ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

@Module({
  imports: [
    _ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        KEPLR_MNEMONIC: Joi.string().required(),
        EVM_MNEMONIC: Joi.string().required(),
        ENVIRONMENT: Joi.string().valid('local', 'mainnet', 'testnet', 'devnet').required(),
        GAS_PRICE: Joi.string().optional(),
      }),
    }),
  ],
})
export class ConfigModule {}
