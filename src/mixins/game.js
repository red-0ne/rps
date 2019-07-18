import web3Utils from 'web3-utils';
import promisify from 'micro-promisify';

import contractInfo from '../contract.json';

export default {
  methods: {
    async getGame(hash) {
      // eslint-disable-next-line no-undef
      const contract = web3.eth.contract(contractInfo.abi).at(hash);
      const props = [ 'j1', 'j2', 'lastAction', 'c1Hash', 'c2', 'stake' ];

      const result = await Promise.all(props.map((p) => promisify(contract[p])())).catch(() => {
        this.state.message = 'Invalid smart contract',
        this.state.class = 'error';
      });

      const contractProps = props.reduce((a, c, i) => {
        a[c] = result[i];
        return a;
      }, {});

      contractProps.stake = web3Utils.fromWei(contractProps.stake.toString(), 'ether');
      contractProps.lastAction = new Date(contractProps.lastAction * 1000);
      contractProps.hash = hash;
      this.currentContract = contractProps;
    },
    createGame({ amount, address, move, salt }, from) {
        // eslint-disable-next-line no-undef
        const rpsContract = web3.eth.contract(contractInfo.abi);

        return new Promise((resolve, reject) => {
          const stringMove = '0x' + new Number(move).toString(16).padStart(2, '0');
          const encryptedMove = web3Utils.keccak256(stringMove + salt.replace('0x', ''))
          rpsContract.new(encryptedMove, address, {
            from,
            data: contractInfo.bytecode,
            gas: '850000',
            value: web3Utils.toWei(amount, 'ether')
          }, (error, contract) => error ? reject(error) : resolve(contract));
        });
    },
    playGame({ amount, move, address }, from) {
      // eslint-disable-next-line no-undef
      const rpsContract = web3.eth.contract(contractInfo.abi).at(address);

      return new Promise((resolve, reject) => {
        rpsContract.play(move, {
          from,
          gas: '50000',
          value: web3Utils.toWei(amount, 'ether')
        }, (error, result) => error ? reject(error) : resolve(result));
      });
    },
    askTimeout(isInitiator, address, from) {
      // eslint-disable-next-line no-undef
      const rpsContract = web3.eth.contract(contractInfo.abi).at(address);

      return new Promise((resolve, reject) => {
        const cb = (error, result) => error ? reject(error) : resolve(result);
        const config = { from, gas: '60000' };
        isInitiator ? rpsContract.j2Timeout(config, cb) : rpsContract.j1Timeout(config, cb);
      });
    },
    solveGame(salt, move, address, from) {
      // eslint-disable-next-line no-undef
      const rpsContract = web3.eth.contract(contractInfo.abi).at(address);

      return new Promise((resolve, reject) => {
        const config = { from, gas: '30000' };
        const formattedMove = '0x' + new Number(move).toString(16).padStart(2, '0');
        rpsContract.solve(formattedMove, salt,
          config,
          (error, result) => error ? reject(error) : resolve(result));
      });

    }
  },
}