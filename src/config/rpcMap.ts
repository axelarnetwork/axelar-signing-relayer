export const getRpcMap: (env: string) => { [key: string]: string } = (env: string) =>
  env === 'mainnet'
    ? {
        fantom: 'https://withered-divine-waterfall.fantom.quiknode.pro',
        polygon: 'https://polygon-mainnet.infura.io/v3/467477790bfa4b7684be1336e789a068',
        moonbeam: 'https://rpc.api.moonbeam.network',
        avalanche: 'https://api.avax.network/ext/bc/C/rpc',
        ethereum: 'https://mainnet.infura.io/v3/467477790bfa4b7684be1336e789a068',
      }
    : {
        fantom: 'https://rpc.testnet.fantom.network',
        polygon: 'https://polygon-mumbai.infura.io/v3/467477790bfa4b7684be1336e789a068',
        moonbeam: 'https://rpc.api.moonbase.moonbeam.network',
        avalanche: 'https://api.avax-test.network/ext/bc/C/rpc',
        ethereum: 'https://ropsten.infura.io/v3/467477790bfa4b7684be1336e789a068',
      };
