const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

const { interface, bytecode } = require('../compile');

let lottery;
let accounts;

beforeEach(async () => {
	accounts = await web3.eth.getAccounts();

	lottery = await new web3.eth.Contract(JSON.parse(interface))
		.deploy({ data: bytecode })
		.send({ from: accounts[0], gas: '1000000' })
});

describe('Lottery', () => {
	it('deploys a contract', () => {
		assert.ok(lottery.options.address);
	});

	it('allows one account to enter', async () => {
		await lottery.methods.enter().send({
			from: accounts[0],
			value: web3.utils.toWei('0.02', 'ether') //web3 utiltiy for converting either to wei
		});
		const players = await lottery.methods.getPlayers().call({
			from: accounts[0]
		});
		assert.equal(accounts[0], players[0]);
		assert.equal(1, players.length);
	});

	it('allows multiple account to enter', async () => {
		await lottery.methods.enter().send({
			from: accounts[0],
			value: web3.utils.toWei('0.02', 'ether') //web3 utiltiy for converting either to wei
		});
		await lottery.methods.enter().send({
			from: accounts[1],
			value: web3.utils.toWei('0.02', 'ether') //web3 utiltiy for converting either to wei
		});
		await lottery.methods.enter().send({
			from: accounts[2],
			value: web3.utils.toWei('0.02', 'ether') //web3 utiltiy for converting either to wei
		});

		const players = await lottery.methods.getPlayers().call({
			from: accounts[0]
		});
		assert.equal(accounts[0], players[0]);
		assert.equal(accounts[1], players[1]);
		assert.equal(accounts[2], players[2]);
		assert.equal(3, players.length);
	});

	it('requires a minimum of ehter to enter', async() => {
		try{
			await lottery.methods.enter().send({
				from: accounts[0],
				value: 200
			});

			assert(false); //fails the test
		}catch(err) {
			assert(err);
		}
	});

	it('only manager can call pickWinner', async() => {
		try{
			await lottery.methods.pickWinner().send({
				from: accounts[1]
			});

			assert(false);
		}catch(err) {
			assert(err);
		}
	});

	//only enters a single player because of simplicity
	it('sends money to the winner and resets the players array', async() => {
		await lottery.methods.enter().send({
			from: accounts[0],
			value: web3.utils.toWei('2', 'ether')
		});
		
		//comparing initial balance and final balance of address who entered into the lottery
		const initialBalance = await web3.eth.getBalance(accounts[0]);
		await lottery.methods.pickWinner().send({ from: accounts[0] });	
		const finalBalance = await web3.eth.getBalance(accounts[0]);
		const difference = finalBalance - initialBalance;

		console.log(finalBalance - initialBalance);
		assert(difference > web3.utils.toWei('1.8', 'ether')); //there would always be gasPrice so will not be exactly 2 ether
	});
});