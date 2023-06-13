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
import { toAccAddress } from '@cosmjs/stargate/build/queryclient/utils';
import { STANDARD_FEE } from '@axelar-network/axelarjs-sdk';
import { LinkAddressDto } from './dto/link-address.dto';
import { DeliverTxResponse, StdFee, calculateFee } from '@cosmjs/stargate';
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
        sender: toAccAddress(this.axelarSigningClient.signer.signerAddress),
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
              sender: toAccAddress(this.axelarSigningClient.signer.signerAddress),
              depositAddress: toAccAddress(depositAddress),
              denom,
            }),
          }
        : {
            typeUrl: `/${EvmProtobufPackage}.ConfirmDepositRequest`,
            value: EvmConfirmDepositRequest.fromPartial({
              sender: toAccAddress(this.axelarSigningClient.signer.signerAddress),
              chain: sourceChain,
              txId: utils.arrayify(txHash),
              burnerAddress: utils.arrayify(burnerAddress),
            }),
          };
    return await this.signAndGetTxBytes([payload], fee || STANDARD_FEE, memo);
  }

  async routeMessage(dto: RouteMessageDto): Promise<Uint8Array> {
    const { id, payload, fee, memo } = dto;
    console.log(dto);
    const _payload: EncodeObject = {
      typeUrl: `/${axelarnetProtobufPackage}.`,
      value: RouteMessageRequest.fromPartial({
        sender: toAccAddress(this.axelarSigningClient.signer.signerAddress),
        id,
        payload: utils.arrayify(payload),
      }),
    };
    let usedFee = fee;
    if (!usedFee) {
      usedFee = await this.getStandardFee('auto', [payload], memo);
    }
    return await this.signAndGetTxBytes([_payload], usedFee, memo);
  }

  async confirmGatewayTx(dto: any): Promise<Uint8Array> {
    const { memo, fee, chain, txHash } = dto;
    console.log(dto);
    const payload: EncodeObject = {
      typeUrl: `/${EvmProtobufPackage}.ConfirmGatewayTxRequest`,
      value: ConfirmGatewayTxRequest.fromPartial({
        sender: toAccAddress(this.axelarSigningClient.signer.signerAddress),
        chain,
        txId: utils.arrayify(txHash),
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
        sender: toAccAddress(this.axelarSigningClient.signer.signerAddress),
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
        sender: toAccAddress(this.axelarSigningClient.signer.signerAddress),
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
        sender: toAccAddress(this.axelarSigningClient.signer.signerAddress),
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
        sender: toAccAddress(this.axelarSigningClient.signer.signerAddress),
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
    return await this.axelarSigningClient.signer.signAndGetTxBytes(encodeData, fee as any, memo);
  }

  private async getStandardFee(fee: any, messages, memo) {
    let usedFee;
    if (fee == 'auto' || typeof fee === 'number') {
      assertDefined(
        this.axelarSigningClient.stargateOptions.gasPrice,
        'Gas price must be set in the client options when auto gas is used.',
      );
      const gasEstimation = await this.axelarSigningClient.signer.simulate(
        this.axelarSigningClient.signer.signerAddress,
        messages,
        memo,
      );
      const multiplier = typeof fee === 'number' ? fee : 1.3;
      usedFee = calculateFee(
        Math.round(gasEstimation * multiplier),
        this.axelarSigningClient.stargateOptions.gasPrice,
      );
    } else {
      usedFee = fee;
    }
    return usedFee;
  }
}
