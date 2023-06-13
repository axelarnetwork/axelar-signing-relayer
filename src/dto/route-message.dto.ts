import { StdFee } from '@cosmjs/stargate';
import { IsNotEmpty, IsString } from 'class-validator';

export class RouteMessageDto {
  @IsString()
  @IsNotEmpty()
  payload: string;

  @IsString()
  @IsNotEmpty()
  id: string;

  fee?: StdFee;

  @IsString()
  memo?: string;
}
