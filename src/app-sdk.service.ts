import { Injectable } from '@nestjs/common';
import {
  AxelarSigningClient,
  AxelarSigningClientConfig,
  Environment,
} from '@axelar-network/axelarjs-sdk';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AxelarSigningClientUtil {
  public environment: string;
  public signer: AxelarSigningClient;

  constructor(private config: ConfigService) {
    const environment = this.config.get('ENVIRONMENT');
    const mnemonic = this.config.get('MNEMONIC');
    this.environment = environment;
    this.initSigner(this.environment as Environment, mnemonic);
  }

  public async initSigner(environment: Environment, mnemonic: string) {
    const config: AxelarSigningClientConfig = {
      environment,
      mnemonic,
      options: {},
    };
    this.signer = await AxelarSigningClient.initOrGetAxelarSigningClient(
      config,
    );
  }
}
