import { Injectable } from '@nestjs/common';
import { AxelarSigningClientUtil } from './app-sdk.service';
import { EncodeObject } from '@cosmjs/proto-signing';
import {
  ConfirmDepositRequest as AxelarnetConfirmDepositRequest,
  ExecutePendingTransfersRequest,
  LinkRequest as AxelarnetLinkRequest,
  RouteIBCTransfersRequest,
  protobufPackage as axelarnetProtobufPackage,
} from '@axelar-network/axelarjs-types/axelar/axelarnet/v1beta1/tx';
import {
  ConfirmDepositRequest as EvmConfirmDepositRequest,
  ConfirmGatewayTxRequest,
  CreatePendingTransfersRequest,
  SignCommandsRequest,
  protobufPackage as EvmProtobufPackage,
} from '@axelar-network/axelarjs-types/axelar/evm/v1beta1/tx';
import { RouteMessageRequest } from '@axelar-network/axelarjs-types/axelar/axelarnet/v1beta1/tx';
import { ConfirmDepositDto } from './dto/confirm-deposit.dto';
import { fromBech32 } from '@cosmjs/encoding';
import { STANDARD_FEE } from '@axelar-network/axelarjs-sdk';
import { LinkAddressDto } from './dto/link-address.dto';
import { DeliverTxResponse, StdFee, calculateFee, isDynamicGasPriceConfig } from '@cosmjs/stargate';
import { assertDefined } from '@cosmjs/utils';
import { ethers, utils } from 'ethers';
import { EvmSigningClientUtil } from './evm-signer.service';
import { TransactionRequest } from '@ethersproject/abstract-provider';
import { RouteMessageDto } from './dto/route-message.dto';

@Injectable()
export class AppService {
  constructor(
    private axelarSigningClient: AxelarSigningClientUtil,
    private evmSigningClient: EvmSigningClientUtil,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async linkAddress(dto: LinkAddressDto): Promise<Uint8Array | DeliverTxResponse> {
    const { recipientAddr, recipientChain, asset, fee, memo, broadcast } = dto;
    const payload: EncodeObject = {
      typeUrl: `/${axelarnetProtobufPackage}.LinkRequest`,
      value: AxelarnetLinkRequest.fromPartial({
        sender: this.axelarSigningClient.signer.signerAddress,
        recipientAddr,
        recipientChain,
        asset,
      }),
    };
    return broadcast
      ? await this.axelarSigningClient.signer.signThenBroadcast(
          [payload],
          fee || STANDARD_FEE,
          memo,
        )
      : await this.signAndGetTxBytes([payload], fee || STANDARD_FEE, memo);
  }

  async confirmDeposit(dto: ConfirmDepositDto): Promise<Uint8Array> {
    const { depositAddress, denom, memo, module, fee, sourceChain, burnerAddress, txHash } = dto;
    const payload: EncodeObject =
      module === 'axelarnet'
        ? {
            typeUrl: `/${axelarnetProtobufPackage}.ConfirmDepositRequest`,
            value: AxelarnetConfirmDepositRequest.fromPartial({
              sender: this.axelarSigningClient.signer.signerAddress,
              depositAddress: Buffer.from(fromBech32(depositAddress).data),
              denom,
            }),
          }
        : {
            typeUrl: `/${EvmProtobufPackage}.ConfirmDepositRequest`,
            value: EvmConfirmDepositRequest.fromPartial({
              sender: this.axelarSigningClient.signer.signerAddress,
              chain: sourceChain,
              txId: Buffer.from(utils.arrayify(txHash)),
              burnerAddress: Buffer.from(utils.arrayify(burnerAddress)),
            }),
          };
    return await this.signAndGetTxBytes([payload], fee || STANDARD_FEE, memo);
  }

  async routeMessage(dto: RouteMessageDto): Promise<Uint8Array> {
    const { id, payload, fee, memo } = dto;
    console.log(dto);
    const _payload: EncodeObject = {
      typeUrl: `/${axelarnetProtobufPackage}.RouteMessageRequest`,
      value: RouteMessageRequest.fromPartial({
        sender: this.axelarSigningClient.signer.signerAddress,
        id,
        payload: Buffer.from(utils.arrayify(payload)),
      }),
    };
    let usedFee = fee;
    if (!usedFee) {
      usedFee = await this.getStandardFee('auto', [_payload], memo);
    }
    return await this.signAndGetTxBytes([_payload], usedFee, memo);
  }

  async confirmGatewayTx(dto: any): Promise<Uint8Array> {
    const { memo, fee, chain, txHash } = dto;
    console.log(dto);
    const payload: EncodeObject = {
      typeUrl: `/${EvmProtobufPackage}.ConfirmGatewayTxRequest`,
      value: ConfirmGatewayTxRequest.fromPartial({
        sender: this.axelarSigningClient.signer.signerAddress,
        chain,
        txId: Buffer.from(utils.arrayify(txHash)),
      }),
    };
    let usedFee = fee;
    if (!usedFee) {
      usedFee = await this.getStandardFee('auto', [payload], memo);
    }
    return await this.signAndGetTxBytes([payload], usedFee, memo);
  }

  async executePendingTransfers(dto: any): Promise<Uint8Array> {
    const { fee, memo, module } = dto;

    // TODO: throw error
    if (module !== 'axelarnet') return;

    const payload: EncodeObject = {
      typeUrl: `/${axelarnetProtobufPackage}.ExecutePendingTransfersRequest`,
      value: ExecutePendingTransfersRequest.fromPartial({
        sender: this.axelarSigningClient.signer.signerAddress,
      }),
    };
    let usedFee = fee;
    if (!usedFee) {
      usedFee = await this.getStandardFee('auto', [payload], memo);
    }
    return await this.signAndGetTxBytes([payload], usedFee, memo);
  }

  async signCommands(dto: any): Promise<Uint8Array> {
    const { chain, fee, memo, module } = dto;

    // TODO: throw error
    if (module !== 'evm') return;

    const payload: EncodeObject = {
      typeUrl: `/${EvmProtobufPackage}.SignCommandsRequest`,
      value: SignCommandsRequest.fromPartial({
        sender: this.axelarSigningClient.signer.signerAddress,
        chain,
      }),
    };
    let usedFee = fee;
    if (!usedFee) {
      usedFee = await this.getStandardFee('auto', [payload], memo);
    }
    return await this.signAndGetTxBytes([payload], usedFee, memo);
  }

  async createPendingTransfers(dto: any): Promise<Uint8Array> {
    const { chain, fee, memo, module } = dto;

    // TODO: throw error
    if (module !== 'evm') return;

    const payload: EncodeObject = {
      typeUrl: `/${EvmProtobufPackage}.CreatePendingTransfersRequest`,
      value: CreatePendingTransfersRequest.fromPartial({
        sender: this.axelarSigningClient.signer.signerAddress,
        chain,
      }),
    };
    let usedFee = fee;
    if (!usedFee) {
      usedFee = await this.getStandardFee('auto', [payload], memo);
    }
    return await this.signAndGetTxBytes([payload], usedFee, memo);
  }

  async routeIBCTransfers(dto: any): Promise<Uint8Array> {
    const { fee, memo, module } = dto;

    // TODO: throw error
    if (module !== 'axelarnet') return;

    const payload: EncodeObject = {
      typeUrl: `/${axelarnetProtobufPackage}.RouteIBCTransfersRequest`,
      value: RouteIBCTransfersRequest.fromPartial({
        sender: this.axelarSigningClient.signer.signerAddress,
      }),
    };
    let usedFee = fee;
    if (!usedFee) {
      usedFee = await this.getStandardFee('auto', [payload], memo);
    }
    return await this.signAndGetTxBytes([payload], usedFee, memo);
  }

  async signEvmTx(dto: {
    chain: string;
    gatewayAddress: string;
    txRequest: TransactionRequest;
  }): Promise<{ data: string }> {
    const { chain, gatewayAddress, txRequest } = dto;
    return {
      data: await this.evmSigningClient.signTx(chain, gatewayAddress, txRequest),
    };
  }

  async sendEvmTx(dto: {
    chain: string;
    gatewayAddress: string;
    txRequest: TransactionRequest;
  }): Promise<{ data: ethers.providers.TransactionResponse }> {
    const { chain, gatewayAddress, txRequest } = dto;
    const data = await this.evmSigningClient.sendTx(chain, gatewayAddress, txRequest);
    return {
      data,
    };
  }

  private async signAndGetTxBytes(
    encodeData: EncodeObject[],
    fee: StdFee | string,
    memo?: string,
  ): Promise<Uint8Array> {
    const signerData = await this.withRetry(() => this.axelarSigningClient.getSignerData());
    const txBytes = await this.withRetry(() =>
      this.axelarSigningClient.signer.signAndGetTxBytes(encodeData, fee as any, memo, signerData),
    );
    this.axelarSigningClient.incrementSequence();
    return txBytes;
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

  private async getStandardFee(fee: any, messages, memo) {
    let usedFee;
    if (fee == 'auto' || typeof fee === 'number') {
      const gasPrice = this.axelarSigningClient.stargateOptions.gasPrice;
      assertDefined(gasPrice, 'Gas price must be set in the client options when auto gas is used.');
      if (isDynamicGasPriceConfig(gasPrice)) {
        throw new Error('Dynamic gas price config is not supported for fee calculation.');
      }
      const gasEstimation = await this.withRetry(() =>
        this.axelarSigningClient.signer.simulate(
          this.axelarSigningClient.signer.signerAddress,
          messages,
          memo,
        ),
      );
      const multiplier = typeof fee === 'number' ? fee : 1.3;
      usedFee = calculateFee(Math.round(gasEstimation * multiplier), gasPrice);
    } else {
      usedFee = fee;
    }
    return usedFee;
  }
}
