require("@nomiclabs/hardhat-waffle");
require('@nomiclabs/hardhat-ethers');
require("@nomiclabs/hardhat-etherscan");

if (process.env.REPORT_GAS) {
  require("hardhat-gas-reporter");
}

const privateKey = process.env.PRIVATE_KEY || null

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  defaultNetwork: "rinkeby",
  networks: {
    rinkeby: {
      url: "https://eth-rinkeby.alchemyapi.io/v2/OkAUbUpxjIAjgxYYKMYM39nL_OxTW4p2",
      accounts: [privateKey]
    }
  },
  solidity: {
    version: "0.8.11",
    settings: {
      optimizer: {
        enabled: true,
        runs: 800,
      },
    },
  },
  gasReporter: {
    currency: "USD",
    gasPrice: 100,
    showTimeSpent: true,
  },
  etherscan: {
    apiKey: process.env.API_KEY
  }
};
