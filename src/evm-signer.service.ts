import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { TransactionRequest } from '@ethersproject/providers';
import { ConfigService } from '@nestjs/config';
import { getRpcMap } from './config/rpcMap';

@Injectable()
export class EvmSigningClientUtil {
  private signer!: ethers.providers.JsonRpcSigner | ethers.Wallet;
  private env: string;
  constructor(private config: ConfigService) {
    this.env = config.get('ENVIRONMENT');
  }

  public async signTx(
    chain: string,
    gatewayAddress: string,
    opts: TransactionRequest,
  ): Promise<any> {
    const { maxFeePerGas, maxPriorityFeePerGas } = opts;
    const rpcUrl = getRpcMap(this.env)[chain.toLowerCase()];
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const evm_mnemonic = this.config.get('EVM_MNEMONIC');
    this.signer = ethers.Wallet.fromMnemonic(evm_mnemonic).connect(provider);

    const txRequest: TransactionRequest = {
      ...opts,
      maxPriorityFeePerGas: maxPriorityFeePerGas || ethers.utils.parseUnits('30', 'gwei'),
      maxFeePerGas: maxFeePerGas || ethers.utils.parseUnits('60', 'gwei'),
    };
    await this.withRetry(() => this.signer.estimateGas(txRequest));
    const tx = await this.withRetry(async () =>
      this.signer.signTransaction(await this.signer.populateTransaction(txRequest)),
    );
    return tx;
  }

  public async sendTx(
    chain: string,
    gatewayAddress: string,
    opts: TransactionRequest,
  ): Promise<ethers.providers.TransactionResponse> {
    const { maxFeePerGas, maxPriorityFeePerGas } = opts;
    const rpcUrl = getRpcMap(this.env)[chain.toLowerCase()];
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const evm_mnemonic = this.config.get('EVM_MNEMONIC');
    this.signer = ethers.Wallet.fromMnemonic(evm_mnemonic).connect(provider);
    const txRequest: TransactionRequest = {
      ...opts,
      maxPriorityFeePerGas: maxPriorityFeePerGas || ethers.utils.parseUnits('30', 'gwei'),
      maxFeePerGas: maxFeePerGas || ethers.utils.parseUnits('60', 'gwei'),
    };
    await this.withRetry(() => this.signer.estimateGas(txRequest));
    const tx = await this.withRetry(() => this.signer.sendTransaction(txRequest));
    await this.withRetry(() => tx.wait(1));
    return tx;
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
