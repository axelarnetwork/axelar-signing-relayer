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
    await this.signer.estimateGas(txRequest);
    const tx = await this.signer.signTransaction(await this.signer.populateTransaction(txRequest));
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
    await this.signer.estimateGas(txRequest);
    const tx = await this.signer.sendTransaction(txRequest);
    tx.wait(1);
    return tx;
  }
}
