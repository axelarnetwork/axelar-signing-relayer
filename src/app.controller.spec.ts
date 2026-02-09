import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: { getHello: jest.Mock; confirmGatewayTx: jest.Mock };

  beforeEach(async () => {
    appService = {
      getHello: jest.fn(() => 'Hello World!'),
      confirmGatewayTx: jest.fn(),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: AppService, useValue: appService }],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('confirmGatewayTx', () => {
    it('wraps the service response in data', async () => {
      const signedBytes = new Uint8Array([1, 2, 3]);
      appService.confirmGatewayTx.mockResolvedValue(signedBytes);

      const result = await appController.confirmGatewayTx(
        { chain: 'avalanche', txHash: '0x' + '11'.repeat(32) },
        'trace-id',
      );

      expect(appService.confirmGatewayTx).toHaveBeenCalled();
      expect(result).toEqual({ data: signedBytes });
    });
  });
});
