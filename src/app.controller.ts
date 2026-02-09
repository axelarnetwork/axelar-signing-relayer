import { Body, Controller, Get, Headers, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfirmDepositDto } from './dto/confirm-deposit.dto';
import { LinkAddressDto } from './dto/link-address.dto';
import { RouteMessageDto } from './dto/route-message.dto';
import { ethers } from 'ethers';

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

  @Post('route_message')
  @HttpCode(HttpStatus.OK)
  routeMessage(@Body() dto: RouteMessageDto, @Headers('x-trace-id') traceId: string) {
    return this.appService.routeMessage(dto);
  }

  @Post('confirm_gateway_tx')
  @HttpCode(HttpStatus.OK)
  async confirmGatewayTx(@Body() dto: any, @Headers('x-trace-id') traceId: string) {
    const data = await this.appService.confirmGatewayTx(dto);
    return { data };
  }

  @Post('execute_pending_transfers')
  @HttpCode(HttpStatus.OK)
  executePendingTransfers(@Body() dto: any, @Headers('x-trace-id') traceId: string) {
    return this.appService.executePendingTransfers(dto);
  }

  @Post('create_pending_transfers')
  @HttpCode(HttpStatus.OK)
  createPendingTransfers(@Body() dto: any, @Headers('x-trace-id') traceId: string) {
    return this.appService.createPendingTransfers(dto);
  }

  @Post('sign_commands')
  @HttpCode(HttpStatus.OK)
  signCommands(@Body() dto: any, @Headers('x-trace-id') traceId: string) {
    return this.appService.signCommands(dto);
  }

  @Post('route_ibc_transfers')
  @HttpCode(HttpStatus.OK)
  routeIBCTransfers(@Body() dto: any, @Headers('x-trace-id') traceId: string) {
    return this.appService.routeIBCTransfers(dto);
  }

  @Post('sign_evm_tx')
  @HttpCode(HttpStatus.OK)
  signEvmTx(@Body() dto: any, @Headers('x-trace-id') traceId: string) {
    return this.appService.signEvmTx(dto);
  }

  @Post('send_evm_tx')
  @HttpCode(HttpStatus.OK)
  sendEvmTx(
    @Body() dto: any,
    @Headers('x-trace-id') traceId: string,
  ): Promise<{ data: ethers.providers.TransactionResponse }> {
    return this.appService.sendEvmTx(dto);
  }
}
