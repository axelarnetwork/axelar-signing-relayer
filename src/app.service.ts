import { Injectable } from '@nestjs/common';
import { AxelarSigningClientUtil } from './app-sdk.service';
import { EncodeObject } from '@cosmjs/proto-signing';
import {
  ConfirmDepositRequest as AxelarnetConfirmDepositRequest,
  ExecutePendingTransfersRequest as AxelarnetExecutePendingTransfersRequest,
  LinkRequest as AxelarnetLinkRequest,
  protobufPackage as axelarnetProtobufPackage,
} from '@axelar-network/axelarjs-types/axelar/axelarnet/v1beta1/tx';
import {
  ConfirmDepositRequest as EvmConfirmDepositRequest,
  LinkRequest as EvmLinkRequest,
  protobufPackage as EvmProtobufPackage,
} from '@axelar-network/axelarjs-types/axelar/evm/v1beta1/tx';
import { ConfirmDepositDto } from './dto/confirm-deposit.dto';
import { toAccAddress } from '@cosmjs/stargate/build/queryclient/utils';
import { STANDARD_FEE } from '@axelar-network/axelarjs-sdk';
import { LinkAddressDto } from './dto/link-address.dto';
import { DeliverTxResponse } from '@cosmjs/stargate';
import { utils } from 'ethers';

@Injectable()
export class AppService {
  constructor(private axelarSigningClient: AxelarSigningClientUtil) {}
  getHello(): string {
    return 'Hello World!';
  }
  async linkAddress(dto: LinkAddressDto): Promise<Uint8Array | DeliverTxResponse> {
    const { recipientAddr, recipientChain, asset, fee, memo, broadcast } = dto;
    const linkPayload: EncodeObject[] = [
      {
        typeUrl: `/${axelarnetProtobufPackage}.LinkRequest`,
        value: AxelarnetLinkRequest.fromPartial({
          sender: toAccAddress(this.axelarSigningClient.signer.signerAddress),
          recipientAddr,
          recipientChain,
          asset,
        }),
      },
    ];
    return broadcast
      ? await this.axelarSigningClient.signer.signThenBroadcast(
          linkPayload,
          fee || STANDARD_FEE,
          memo,
        )
      : await this.axelarSigningClient.signer.signAndGetTxBytes(
          linkPayload,
          fee || STANDARD_FEE,
          memo,
        );
  }
  async confirmDeposit(dto: ConfirmDepositDto): Promise<Uint8Array> {
    const { depositAddress, denom, memo, module, fee, sourceChain, burnerAddress, txHash } = dto;
    const confirmDepositPayload: EncodeObject[] =
      module === 'axelarnet'
        ? [
            {
              typeUrl: `/${axelarnetProtobufPackage}.ConfirmDepositRequest`,
              value: AxelarnetConfirmDepositRequest.fromPartial({
                sender: toAccAddress(this.axelarSigningClient.signer.signerAddress),
                depositAddress: toAccAddress(depositAddress),
                denom,
              }),
            },
          ]
        : [
            {
              typeUrl: `/${EvmProtobufPackage}.ConfirmDepositRequest`,
              value: EvmConfirmDepositRequest.fromPartial({
                sender: toAccAddress(this.axelarSigningClient.signer.signerAddress),
                chain: sourceChain,
                txId: utils.arrayify(txHash),
                burnerAddress: utils.arrayify(burnerAddress),
              }),
            },
          ];
    return await this.axelarSigningClient.signer.signAndGetTxBytes(
      confirmDepositPayload,
      fee || STANDARD_FEE,
      memo,
    );
  }
}
