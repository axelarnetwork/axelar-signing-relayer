## Axelar signing relayer

HTTP service that signs and broadcasts Axelar and EVM transactions for relayer workflows. It exposes signing endpoints for Axelar modules and EVM chains and supports e2e tests against Axelar + Avalanche testnet.

## Requirements

- Node.js and npm
- Mnemonics for Axelar (Cosmos) and EVM chains
- Network access to Axelar RPC and EVM RPC endpoints

## Setup

```bash
npm install
```

## Configuration

Environment variables:

- `KEPLR_MNEMONIC` - Axelar/Cosmos signer mnemonic.
- `EVM_MNEMONIC` - EVM signer mnemonic.
- `ENVIRONMENT` - One of `local`, `mainnet`, `testnet`, `devnet`.
- `GAS_PRICE` (optional) - Override default gas price, format like `0.007uaxl`.

## Running

```bash
# development
npm run start

# watch mode
npm run start:dev

# production build + run
npm run build
npm run start:prod
```

## API

Signing endpoints:

- `POST /get_link_address`
- `POST /confirm_deposit_tx`
- `POST /route_message`
- `POST /confirm_gateway_tx`
- `POST /execute_pending_transfers`
- `POST /sign_commands`
- `POST /create_pending_transfers`
- `POST /route_ibc_transfers`
- `POST /sign_evm_tx`
- `POST /send_evm_tx`

## Tests

```bash
# unit tests
npm test

# e2e tests
npm run test:e2e

# unit test coverage
npm run test:cov

# e2e coverage
npm run test:e2e:cov
```

## Deployment

This application automatically deploys to production on Heroku when pull requests are merged to the main branch.

## Notes

- E2E tests depend on external RPCs and can be flaky if endpoints are down.
- `GAS_PRICE` can be set to tune Cosmos fee calculation without code changes.
