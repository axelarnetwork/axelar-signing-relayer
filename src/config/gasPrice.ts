import { GasPrice } from '@cosmjs/stargate';
import { Decimal } from '@cosmjs/math';

export const STANDARD_GAS_PRICE = new GasPrice(Decimal.fromUserInput('0.007', 3), 'uaxl');
