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
  LinkRequest as EvmLinkRequest,
  CreatePendingTransfersRequest,
  SignCommandsRequest,
  protobufPackage as EvmProtobufPackage,
} from '@axelar-network/axelarjs-types/axelar/evm/v1beta1/tx';
import { ConfirmDepositDto } from './dto/confirm-deposit.dto';
import { toAccAddress } from '@cosmjs/stargate/build/queryclient/utils';
import { STANDARD_FEE } from '@axelar-network/axelarjs-sdk';
import { LinkAddressDto } from './dto/link-address.dto';
import { DeliverTxResponse, StdFee } from '@cosmjs/stargate';
import { utils } from 'ethers';
import { EvmSigningClientUtil } from './evm-signer.service';
import { TransactionRequest } from '@ethersproject/abstract-provider';

@Injectable()
export class AppService {
  
  constructor(private axelarSigningClient: AxelarSigningClientUtil, private evmSigningClient: EvmSigningClientUtil) {}

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
  async confirmGatewayTx(dto: any): Promise<Uint8Array> {
    const { memo, fee, chain, txHash } = dto;
    console.log(dto)
    const payload: EncodeObject = {
      typeUrl: `/${EvmProtobufPackage}.ConfirmGatewayTxRequest`,
      value: ConfirmGatewayTxRequest.fromPartial({
        sender: toAccAddress(this.axelarSigningClient.signer.signerAddress),
        chain,
        txId: utils.arrayify(txHash),
      }),
    }
    return await this.signAndGetTxBytes([payload], fee || STANDARD_FEE, memo);
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
    return await this.signAndGetTxBytes([payload], fee || STANDARD_FEE, memo);
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
    return await this.signAndGetTxBytes([payload], fee || STANDARD_FEE, memo);
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
    return await this.signAndGetTxBytes([payload], fee || STANDARD_FEE, memo);
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
    return await this.signAndGetTxBytes([payload], fee || STANDARD_FEE, memo);
  }

  async signEvmTx(dto: { gatewayAddress: string, txRequest: TransactionRequest }): Promise<string> {
    const { gatewayAddress, txRequest } = dto;
    return await this.evmSigningClient.signTx(gatewayAddress, txRequest);
  }

  private async signAndGetTxBytes(
    encodeData: EncodeObject[],
    fee: StdFee,
    memo?: string,
  ): Promise<Uint8Array> {
    return await this.axelarSigningClient.signer.signAndGetTxBytes(encodeData, fee, memo);
  }
}
