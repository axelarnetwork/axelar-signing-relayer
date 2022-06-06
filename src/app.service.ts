import { Injectable } from '@nestjs/common';
import { AxelarSigningClientUtil } from './app-sdk.service';
import { EncodeObject } from '@cosmjs/proto-signing';
import {
  ConfirmDepositRequest,
  ExecutePendingTransfersRequest,
  LinkRequest,
  protobufPackage,
} from '@axelar-network/axelarjs-types/axelar/axelarnet/v1beta1/tx';
import { ConfirmDepositDto } from './dto/confirm-deposit.dto';
import { toAccAddress } from '@cosmjs/stargate/build/queryclient/utils';
import { STANDARD_FEE } from '@axelar-network/axelarjs-sdk';
import { LinkAddressDto } from './dto/link-address.dto';
import { DeliverTxResponse } from '@cosmjs/stargate';

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
        typeUrl: `/${protobufPackage}.LinkRequest`,
        value: LinkRequest.fromPartial({
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
    const { depositAddress, denom, memo, fee } = dto;
    const confirmDepositPayload: EncodeObject[] = [
      {
        typeUrl: `/${protobufPackage}.ConfirmDepositRequest`,
        value: ConfirmDepositRequest.fromPartial({
          sender: toAccAddress(this.axelarSigningClient.signer.signerAddress),
          depositAddress: toAccAddress(depositAddress),
          denom,
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
