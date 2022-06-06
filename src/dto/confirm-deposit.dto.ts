import { StdFee } from '@cosmjs/stargate';
import { IsNotEmpty, IsString } from 'class-validator';

export class ConfirmDepositDto {
  @IsString()
  @IsNotEmpty()
  depositAddress: string;

  @IsString()
  @IsNotEmpty()
  denom: string;

  @IsString()
  memo?: string;

  fee?: StdFee;

}
