import { Injectable } from '@nestjs/common';
import {
  AxelarSigningClient,
  AxelarSigningClientConfig,
  Environment,
} from '@axelar-network/axelarjs-sdk';
import { ConfigService } from '@nestjs/config';
import { SigningStargateClientOptions } from '@cosmjs/stargate';
import { STANARD_GAS_PRICE as gasPrice } from './config/gasPrice';


@Injectable()
export class AxelarSigningClientUtil {
  public environment: string;
  public signer: AxelarSigningClient;
  public stargateOptions: SigningStargateClientOptions;

  constructor(private config: ConfigService) {
    const environment = this.config.get('ENVIRONMENT');
    const keplr_mnemonic = this.config.get('KEPLR_MNEMONIC');
    this.environment = environment;
    this.initSigner(this.environment as Environment, keplr_mnemonic);
  }

  public async initSigner(environment: Environment, mnemonic: string) {
    this.stargateOptions = { gasPrice };
    const config: AxelarSigningClientConfig = {
      environment,
      cosmosBasedWalletDetails: { mnemonic },
      options: this.stargateOptions,
    };
    this.signer = await AxelarSigningClient.initOrGetAxelarSigningClient(
      config,
    );
  }
}
