import { StdFee } from '@cosmjs/stargate';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class LinkAddressDto {
  @IsString()
  @IsNotEmpty()
  recipientAddr: string;

  @IsString()
  @IsNotEmpty()
  recipientChain: string;

  @IsString()
  @IsNotEmpty()
  asset: string;

  @IsString()
  memo?: string;

  fee?: StdFee;

  @IsBoolean()
  @IsNotEmpty()
  broadcast: boolean;
}
