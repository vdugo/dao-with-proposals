// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  const NAME = 'Vin Coin'
  const SYMBOL = 'VIN'
  const MAX_SUPPLY = '1000000'

  // Deploy Token
  const Token = await hre.ethers.getContractFactory('Token')
  let token = await Token.deploy(NAME, SYMBOL, MAX_SUPPLY)

  await token.deployed()
  console.log(`Token deployed to: ${token.address}\n`)

  // Deploy DAO
  const DAO = await hre.ethers.getContractFactory('DAO')
  let dao = await DAO.deploy(token.address, hre.ethers.utils.parseUnits('500001', 'ether'))
  await dao.deployed()
  console.log(`Token deployed to: ${dao.address}\n`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
