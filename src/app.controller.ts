import { Body, Controller, Get, Headers, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfirmDepositDto } from './dto/confirm-deposit.dto';
import { LinkAddressDto } from './dto/link-address.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('get_link_address')
  @HttpCode(HttpStatus.OK)
  linkAddress(@Body() dto: LinkAddressDto, @Headers('x-trace-id') traceId: string) {
    return this.appService.linkAddress(dto);
  }

  @Post('confirm_deposit_tx')
  @HttpCode(HttpStatus.OK)
  confirmDeposit(@Body() dto: ConfirmDepositDto, @Headers('x-trace-id') traceId: string) {
    return this.appService.confirmDeposit(dto);
  }
}
