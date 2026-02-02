import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { AppModule } from './../src/app.module';
import { AxelarSigningClientUtil } from '../src/app-sdk.service';

jest.setTimeout(30000);

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let signerAddress: string;

  const expectBytesResponse = (res: request.Response) => {
    const body = res.body;
    if (Array.isArray(body)) {
      expect(body.length).toBeGreaterThan(0);
      return;
    }
    if (body && Array.isArray(body.data)) {
      expect(body.data.length).toBeGreaterThan(0);
      return;
    }
    if (body && typeof body === 'object' && Object.keys(body).length > 0) {
      const keys = Object.keys(body);
      const allNumeric = keys.every((key) => String(Number(key)) === key);
      if (allNumeric) {
        expect(keys.length).toBeGreaterThan(0);
        return;
      }
    }
    throw new Error(`Unexpected response body: ${JSON.stringify(body)}`);
  };

  const postWithRetry = async (path: string, payload: Record<string, unknown>, retries = 2) => {
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      const res = await request(app.getHttpServer()).post(path).send(payload);
      if (res.status === 200) {
        return res;
      }
      if (attempt === retries) {
        throw new Error(
          `Request to ${path} failed with status ${res.status}: ${JSON.stringify(res.body)}`,
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }
    throw new Error(`Request to ${path} failed unexpectedly`);
  };

  beforeAll(async () => {
    const mnemonic = process.env.KEPLR_MNEMONIC;
    if (!mnemonic) {
      throw new Error('KEPLR_MNEMONIC must be set for e2e tests.');
    }
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix: 'axelar' });
    signerAddress = (await wallet.getAccounts())[0].address;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const config = app.get(ConfigService);
    const axelarSigner = app.get(AxelarSigningClientUtil);
    await axelarSigner.initSigner(config.get('ENVIRONMENT'), config.get('KEPLR_MNEMONIC'));
  });

  afterAll(async () => {
    await app.close();
    await new Promise<void>((resolve) => app.getHttpServer().close(() => resolve()));
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer()).get('/').expect(200).expect('Hello World!');
  });

  it('/get_link_address (POST) signs without broadcast', async () => {
    const res = await request(app.getHttpServer())
      .post('/get_link_address')
      .send({
        recipientAddr: '0x74Ccd7d9F1F40417C6F7fD1151429a2c44c34e6d',
        recipientChain: 'avalanche',
        asset: 'wavax-wei',
        broadcast: false,
        memo: 'e2e link address',
      })
      .expect(200);
    expectBytesResponse(res);
  });

  it('/confirm_deposit_tx (POST) axelarnet path signs', async () => {
    const res = await request(app.getHttpServer())
      .post('/confirm_deposit_tx')
      .send({
        module: 'axelarnet',
        depositAddress: signerAddress,
        denom: 'wavax-wei',
        memo: 'e2e confirm deposit',
        fee: null,
        sourceChain: 'avalanche',
        burnerAddress: '0x0000000000000000000000000000000000000000',
        txHash: '0x' + '11'.repeat(32),
      })
      .expect(200);
    expectBytesResponse(res);
  });

  it('/confirm_deposit_tx (POST) evm path signs', async () => {
    const res = await request(app.getHttpServer())
      .post('/confirm_deposit_tx')
      .send({
        module: 'evm',
        depositAddress: signerAddress,
        denom: 'wavax-wei',
        memo: 'e2e confirm deposit evm',
        fee: null,
        sourceChain: 'avalanche',
        burnerAddress: '0x' + '22'.repeat(20),
        txHash: '0x' + '33'.repeat(32),
      })
      .expect(200);
    expectBytesResponse(res);
  });

  it('/route_message (POST) signs', async () => {
    const res = await postWithRetry('/route_message', {
      id: 'e2e-message',
      payload: '0xdeadbeef',
      memo: 'e2e route message',
      fee: {
        amount: [{ denom: 'uaxl', amount: '1' }],
        gas: '200000',
      },
    });
    expectBytesResponse(res);
  });

  it('/confirm_gateway_tx (POST) signs', async () => {
    const res = await postWithRetry('/confirm_gateway_tx', {
      chain: 'avalanche',
      txHash: '0x' + '44'.repeat(32),
      memo: 'e2e confirm gateway',
      fee: {
        amount: [{ denom: 'uaxl', amount: '1' }],
        gas: '200000',
      },
    });
    expectBytesResponse(res);
  });

  it('/execute_pending_transfers (POST) signs', async () => {
    const res = await postWithRetry('/execute_pending_transfers', {
      module: 'axelarnet',
      memo: 'e2e execute pending',
      fee: {
        amount: [{ denom: 'uaxl', amount: '1' }],
        gas: '200000',
      },
    });
    expectBytesResponse(res);
  });

  it('/sign_commands (POST) signs', async () => {
    const res = await postWithRetry('/sign_commands', {
      module: 'evm',
      chain: 'avalanche',
      memo: 'e2e sign commands',
      fee: {
        amount: [{ denom: 'uaxl', amount: '1' }],
        gas: '200000',
      },
    });
    expectBytesResponse(res);
  });

  it('/create_pending_transfers (POST) signs', async () => {
    const res = await postWithRetry('/create_pending_transfers', {
      module: 'evm',
      chain: 'avalanche',
      memo: 'e2e create pending',
      fee: {
        amount: [{ denom: 'uaxl', amount: '1' }],
        gas: '200000',
      },
    });
    expectBytesResponse(res);
  });

  it('/route_ibc_transfers (POST) signs', async () => {
    const res = await postWithRetry('/route_ibc_transfers', {
      module: 'axelarnet',
      memo: 'e2e route ibc',
      fee: {
        amount: [{ denom: 'uaxl', amount: '1' }],
        gas: '200000',
      },
    });
    expectBytesResponse(res);
  });

  it('/sign_evm_tx (POST) signs', async () => {
    const res = await request(app.getHttpServer())
      .post('/sign_evm_tx')
      .send({
        chain: 'avalanche',
        gatewayAddress: '0x0000000000000000000000000000000000000000',
        txRequest: {
          to: '0x0000000000000000000000000000000000000000',
          value: '0x0',
          data: '0x',
        },
      })
      .expect(200);
    expect(res.body?.data).toBeDefined();
  });

  it('/send_evm_tx (POST) broadcasts a tx', async () => {
    const res = await postWithRetry('/send_evm_tx', {
      chain: 'avalanche',
      gatewayAddress: '0x0000000000000000000000000000000000000000',
      txRequest: {
        to: '0x0000000000000000000000000000000000000000',
        value: '0x0',
        data: '0x',
      },
    });
    expect(ethers.utils.isHexString(res.body?.data?.hash, 32)).toBe(true);
  }, 30000);
});
