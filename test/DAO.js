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
    let deployer, funder, recipient, user
    let investor1, investor2, investor3, investor4, investor5

    beforeEach(async () => 
    {
        let accounts = await ethers.getSigners()
        deployer = accounts[0]
        funder = accounts[1]
        investor1 = accounts[2]
        investor2 = accounts[3]
        investor3 = accounts[4]
        investor4 = accounts[5]
        investor5 = accounts[6]
        recipient = accounts[7]
        user = accounts[8]

        const Token = await ethers.getContractFactory('Token')
        token = await Token.deploy('Vin Coin', 'VIN', '1000000')

        // send 20% of the token supply to each of the 5 investors
        let transaction = await token.connect(deployer).transfer(investor1.address, tokens(200000))
        await transaction.wait()

        transaction = await token.connect(deployer).transfer(investor2.address, tokens(200000))
        await transaction.wait()

        transaction = await token.connect(deployer).transfer(investor3.address, tokens(200000))
        await transaction.wait()

        transaction = await token.connect(deployer).transfer(investor4.address, tokens(200000))
        await transaction.wait()

        transaction = await token.connect(deployer).transfer(investor5.address, tokens(200000))
        await transaction.wait()
        
        // set quorum to > 50% of the total supply, 500k tokens + 1 wei
        const DAO = await ethers.getContractFactory('DAO')
        dao = await DAO.deploy(token.address, tokens('500001'))

        // Funder sends 100 Ether to DAO treasury for Governance
        await funder.sendTransaction({to: dao.address, value: ether(100)})
    })

    describe('Deployment', () => 
    {
        it('sends Ether to the DAO treasury', async () =>
        {
            expect(await ethers.provider.getBalance(dao.address)).to.equal(ether(100))
        })

        it('returns token address', async () => 
        {
          expect(await dao.token()).to.equal(token.address)
        })
  
        it('returns quorum', async () =>
        {
          expect(await dao.quorum()).to.equal(tokens(500001))
        })
  
    })

    describe('Proposal Creation', () => 
    {
        let transaction, result

        describe('Success', () =>
        {
            beforeEach(async () =>
            {
                transaction = await dao.connect(investor1).createProposal('proposal1', ether(100), recipient.address)
                result = await transaction.wait()
            })

            it('updates the proposal count', async () =>
            {
                expect(await dao.proposalCount()).to.equal(1)
                
            })

            it('updates proposals mapping', async () =>
            {
                const proposal = await dao.proposals(1)
                expect(proposal.id).to.equal(1)
                expect(proposal.amount).to.equal(ether(100))
                expect(proposal.recipient).to.equal(recipient.address)
            })

            it('emits a Propose event', async () =>
            {
                await expect(transaction).to.emit(dao, 'Propose').withArgs(1, ether(100), recipient.address, investor1.address)
            })
        })

        describe('Failure', () => 
        {
            it('rejects an invalid amount', async () =>
            {
                await expect(dao.connect(investor1).createProposal('Proposal 1', ether(1000), recipient.address )).to.be.reverted
            })

            it('rejects a non-investor', async () =>
            {
                await expect(dao.connect(user).createProposal('Proposal 1', ether(100), recipient.address)).to.be.reverted
            })
        })
  
    })

    describe('Voting', () =>
    {
        let transaction, result

        beforeEach(async () =>
        {
            transaction = await dao.connect(investor1).createProposal('Proposal 1', ether(100), recipient.address)
            result = await transaction.wait()
        })

        describe('Success', () =>
        {
            beforeEach(async () =>
            {   
                // vote on the first proposal, i.e. proposal 1
                transaction = await dao.connect(investor1).vote(1)
                result = await transaction.wait()
            })

            it('updates the vote count', async () =>
            {
                // proposals mapping at key 1
                const proposal = await dao.proposals(1)
                expect(proposal.votes).to.equal(tokens(200000))
            })

            it('emits a vote event', async () =>
            {
                await expect(transaction).to.emit(dao,'Vote').withArgs(1, investor1.address)
            })
        })

        describe('Failure', () =>
        {
            it('rejects a non-investor', async () =>
            {
                await expect(dao.connect(user).vote(1)).to.be.reverted
            })

            it('rejects double voting', async () =>
            {
                transaction = await dao.connect(investor1).vote(1)
                await transaction.wait()

                await expect(dao.connect(investor1).vote(1)).to.be.reverted
            })
        })
    })

    describe('Governance', () =>
    {
        let transaction, result

        describe('Success', () =>
        {
            beforeEach(async () =>
            {
                // create proposal
                transaction = await dao.connect(investor1).createProposal('Proposal 1', ether(100), recipient.address)
                result = await transaction.wait()

                // vote
                transaction = await dao.connect(investor1).vote(1)
                result = await transaction.wait()
                transaction = await dao.connect(investor2).vote(1)
                result = await transaction.wait()
                transaction = await dao.connect(investor3).vote(1)
                result = await transaction.wait()

                // finalize proposal
                transaction = await dao.connect(investor1).finalizeProposal(1)
            })

            it('updates the proposal to finalized', async () =>
            {
                const proposal = await dao.proposals(1)
                expect(proposal.finalized).to.equal(true)
            })

            it('transfers funds to recipient', async () =>
            {
                // hardhat gives all accounts 10,000 ether by default,
                // their new balance should be 10,000 + 100 ether
                expect(await ethers.provider.getBalance(recipient.address)).to.equal(tokens(10200))
            })

            it('emits a Finalize event', async () =>
            {
                await expect(transaction).to.emit(dao, 'Finalize').withArgs(1)
            })
        })

        describe('Failure', () =>
        {
            beforeEach(async () =>
            {
                // create proposal
                transaction = await dao.connect(investor1).createProposal('Proposal 1', ether(100), recipient.address)
                result = await transaction.wait()

                // vote
                transaction = await dao.connect(investor1).vote(1)
                result = await transaction.wait()
                transaction = await dao.connect(investor2).vote(1)
                result = await transaction.wait()
            })

            it('rejects finalization if quorum is not met', async () =>
            {
                await expect(dao.connect(investor1).finalizeProposal(1)).to.be.reverted
            })

            it('rejects proposal if already finalized', async () =>
            {
                // investor 3 votes make the quorum eligible
                transaction = await dao.connect(investor3).vote(1)
                result = await transaction.wait()

                // finalize
                transaction = await dao.connect(investor3).finalizeProposal(1)
                result = await transaction.wait()

                // can't finalize a proposal twice
                await expect(dao.connect(investor1).finalizeProposal(1)).to.be.reverted
            })

            it('rejects finalization from a non-investor', async () =>
            {
                transaction = await dao.connect(investor3).vote(1)
                result = await transaction.wait()

                await expect(dao.connect(user).finalizeProposal(1)).to.be.reverted
            })
        })
    })

})
