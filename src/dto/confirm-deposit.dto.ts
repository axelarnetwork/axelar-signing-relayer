import { StdFee } from '@cosmjs/stargate';
import { IsNotEmpty, IsString } from 'class-validator';

export class ConfirmDepositDto {
  @IsString()
  @IsNotEmpty()
  module: "axelarnet" | "evm";

  @IsString()
  @IsNotEmpty()
  depositAddress: string;

  @IsString()
  @IsNotEmpty()
  denom: string;

  @IsString()
  memo?: string;

  fee?: StdFee;

  @IsString()
  sourceChain: string;

  @IsString()
  burnerAddress: string;

  @IsString()
  txHash: string;
}
