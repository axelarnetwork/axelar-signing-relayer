import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { TransactionRequest } from '@ethersproject/providers';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EvmSigningClientUtil {
  private signer!: ethers.providers.JsonRpcSigner | ethers.Wallet;

  constructor(private config: ConfigService) {
    const evm_mnemonic = this.config.get('EVM_MNEMONIC');
    this.signer = ethers.Wallet.fromMnemonic(evm_mnemonic);
  }

  public async signTx(gatewayAddress: string, opts: TransactionRequest): Promise<string> {
    const { data, maxFeePerGas, maxPriorityFeePerGas } = opts;
    const txRequest: TransactionRequest = {
      ...opts,
      to: gatewayAddress,
      data: `0x${data}`,
      maxPriorityFeePerGas: maxPriorityFeePerGas || ethers.utils.parseUnits("30", "gwei"),
      maxFeePerGas: maxFeePerGas || ethers.utils.parseUnits("60", "gwei"),
    };
    await this.signer.estimateGas(txRequest);
    const tx = await this.signer.signTransaction(txRequest);
    console.log("signed transaction", tx);
    return tx;
  }
}