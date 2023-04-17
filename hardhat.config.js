
const { task } = require('hardhat/config') ;

require("@nomiclabs/hardhat-ethers")
require("@nomiclabs/hardhat-waffle");
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
 const accounts = await hre.ethers.getSigners();

 for (const account of accounts) {
   console.log(account.address);
 }
});
module.exports = {
  solidity:{
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 9999,
        details: {
          yul: true
        },
}
}
  },
  networks:{
    bsctest:{
      url:"https://data-seed-prebsc-1-s1.binance.org:8545/",
      accounts:[""]
    },
    arbitest:{
      url:"https://goerli-rollup.arbitrum.io/rpc",
      accounts:[""]
    },
    bsc:{
      url:"https://bsc-dataseed1.binance.org/",
      accounts:[""]
    },
    arbi:{
      url:"https://arb1.arbitrum.io/rpc", 
      accounts:[""]
    }
  }
};
