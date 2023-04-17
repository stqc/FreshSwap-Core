// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const ibep= require("/home/jdbomb/Desktop/FreshSwap-Core/artifacts/contracts/bep20.sol/IBEP20.json");
async function main() {
  // const currentTimestampInSeconds = Math.round(Date.now() / 1000);
  // const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
  // const unlockTime = currentTimestampInSeconds + ONE_YEAR_IN_SECS;

  // const lockedAmount = hre.ethers.utils.parseEther("1");

  // const Lock = await hre.ethers.getContractFactory("Lock");
  // const lock = await Lock.deploy(unlockTime, { value: lockedAmount });

  // await lock.deployed();
  // var usd = await hre.ethers.getContractFactory("USD")
  // usd= await usd.deploy();
  // var native = await hre.ethers.getContractFactory("USD")
  // native= await native.deploy();
  const betterSwapFactory = await hre.ethers.getContractFactory("FreshSwapFactory");
  const bs=await (await betterSwapFactory.deploy("0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1","0x82aF49447D8a07e3bd95BD0d56f35241523fBab1")).deployed();
  var tokenMaker = await hre.ethers.getContractFactory("FreshSwapTokenFactory");
  tokenMaker= await tokenMaker.deploy(bs.address)
  
  // const USD = await hre.ethers.getContractFactory("USD");
  // const usd =await (await USD.deploy()).deployed();
  // console.log("BetterSwap Factory Address", bs.address, bs.admin());

  console.log(bs.address,tokenMaker.address);
  // console.log("USD address ", usd.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
