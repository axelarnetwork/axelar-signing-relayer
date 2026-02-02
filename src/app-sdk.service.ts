import { Injectable } from '@nestjs/common';
import {
  AxelarSigningClient,
  AxelarSigningClientConfig,
  Environment,
} from '@axelar-network/axelarjs-sdk';
import { ConfigService } from '@nestjs/config';
import { GasPrice, SignerData, SigningStargateClientOptions } from '@cosmjs/stargate';
import { STANDARD_GAS_PRICE as gasPrice } from './config/gasPrice';
import {
  RouteMessageRequest,
  protobufPackage,
} from '@axelar-network/axelarjs-types/axelar/axelarnet/v1beta1/tx';

@Injectable()
export class AxelarSigningClientUtil {
  public environment: string;
  public signer: AxelarSigningClient;
  public stargateOptions: SigningStargateClientOptions;
  public explicitSignerData?: SignerData;
  private signerDataPromise?: Promise<SignerData>;

  constructor(private config: ConfigService) {
    const environment = this.config.get('ENVIRONMENT');
    const keplr_mnemonic = this.config.get('KEPLR_MNEMONIC');
    this.environment = environment;
    this.initSigner(this.environment as Environment, keplr_mnemonic);
  }

  public async initSigner(environment: Environment, mnemonic: string) {
    const gasPriceOverride = this.config.get<string>('GAS_PRICE');
    const resolvedGasPrice = gasPriceOverride ? GasPrice.fromString(gasPriceOverride) : gasPrice;
    this.stargateOptions = { gasPrice: resolvedGasPrice };
    const config: AxelarSigningClientConfig = {
      environment,
      cosmosBasedWalletDetails: { mnemonic },
      options: this.stargateOptions,
    };
    this.signer = await AxelarSigningClient.initOrGetAxelarSigningClient(config);

    // TODO: temporarily register for the RouteMessage tx type here. will be unnecessary if using js sdk version >= 0.12.9, so it can be removed once updated.
    this.signer.registry.register(`/${protobufPackage}.RouteMessageRequest`, RouteMessageRequest);
  }

  public async getSignerData(forceRefresh = false): Promise<SignerData> {
    if (!forceRefresh && this.explicitSignerData) {
      return this.explicitSignerData;
    }
    if (!forceRefresh && this.signerDataPromise) {
      return await this.signerDataPromise;
    }
    this.signerDataPromise = (async () => {
      const chainId = await this.withRetry(() => this.signer.getChainId());
      const { accountNumber, sequence } = await this.withRetry(() =>
        this.signer.getSequence(this.signer.signerAddress),
      );
      this.explicitSignerData = {
        chainId,
        accountNumber,
        sequence,
      };
      return this.explicitSignerData;
    })();
    try {
      return await this.signerDataPromise;
    } finally {
      this.signerDataPromise = undefined;
    }
  }

  public incrementSequence(): void {
    if (!this.explicitSignerData) {
      return;
    }
    this.explicitSignerData = {
      ...this.explicitSignerData,
      sequence: this.explicitSignerData.sequence + 1,
    };
  }

  private async withRetry<T>(fn: () => Promise<T>, retries = 2, baseDelayMs = 500): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (attempt === retries) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, baseDelayMs * (attempt + 1)));
      }
    }
    throw lastError;
  }
}
