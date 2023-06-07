const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => 
{
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

const ether = tokens

describe('DAO', () => 
{
    let token, dao

    beforeEach(async () => 
    {
      const Token = await ethers.getContractFactory('Token')
      token = await Token.deploy('Vin Coin', 'VIN', '1000000')
  
      const DAO = await ethers.getContractFactory('DAO')
      dao = await DAO.deploy(token.address, '5000000000000000001')
    })

    describe('Deployment', () => 
    {
  
      it('returns token address', async () => 
      {
        expect(await dao.token()).to.equal(token.address)
      })

      it('returns quorum', async () =>
      {
        expect(await dao.quorum()).to.equal('5000000000000000001')
      })
  
    })

})
