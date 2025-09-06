export const getRpcMap: (env: string) => { [key: string]: string } = (env: string) =>
  env === 'mainnet'
    ? {
        fantom: 'https://fantom.drpc.org',
        polygon: 'https://polygon.drpc.org',
        moonbeam: 'https://rpc.api.moonbeam.network',
        avalanche: 'https://api.avax.network/ext/bc/C/rpc',
        ethereum: 'https://eth.drpc.org',
      }
    : {
        fantom: 'https://rpc.testnet.fantom.network',
        polygon: 'https://rpc-mumbai.maticvigil.com',
        moonbeam: 'https://rpc.api.moonbase.moonbeam.network',
        avalanche: 'https://api.avax-test.network/ext/bc/C/rpc',
        ethereum: 'https://sepolia.drpc.org',
      };
