<template>
  <div>
    <h1>Rock Paper Scissors Lizard Spock</h1>
    <h3 v-if="isMetamaskEnabled">(me: {{globals.account}})</h3>

    <div v-if="globals.state.message" :class="globals.state.class">
      <div v-if="!isMetamaskEnabled">
        {{globals.state.message}}
        <button @click="enableMetamask">Enable Metamask</button>
      </div>
      <div v-if="contractCreated">
        {{globals.state.message}} at
        <router-link :to="`/?hash=${globals.state.address}`">{{globals.state.address}}</router-link>
      </div>
    </div>

    <CreateGame
      v-if="isMetamaskEnabled"
      ref="gameForm"
      @newGame="createNewGame"
    />

    <SearchGame
      v-if="isMetamaskEnabled"
      :hash="currentHash"
      :contract="currentContract"
      @hashValueChange="updateHash"
    />
  </div>
</template>

<script>
import web3Utils from 'web3-utils';

import CreateGame from './create-game.vue';
import SearchGame from './search-game.vue';
import game from '../mixins/game.js';
import globals from '../mixins/globals.js';

export default {
  name: 'MainComponent',
  components: {
    SearchGame,
    CreateGame
  },
  mixins: [game],
  data() {
    return {
      metamaskReady: false,
      account: null,
      isMetamaskEnabled: false,
      currentContract: null,
      contractCreated: false,
      globals
    };
  },
  async created() {
    this.currentHash = this.$route.query.hash
    if (!ethereum) {
      this.metamaskReady = false,
      this.globals.state.class = 'error',
      this.globals.state.message = 'Metamask is not available'


      return;
    }

    if (!this.isMetamaskEnabled) {
      this.globals.state.message = 'Metamask is not enabled';
      this.globals.state.class = 'warning';
    }

    this.globals.games = JSON.parse(localStorage.getItem('solutions')) || {};
    await this.enableMetamask();
  },
  watch: {
    '$route.query.hash': {
      immediate: true,
      async handler(value) {
        this.contractCreated = false;

        if (!this.$route.query.hash) {
          return;
        }

        this.currentHash = this.$route.query.hash;
        this.getGame(this.currentHash);
      }
    }
  },
  methods: {
    async enableMetamask() {
      this.globals.account = await ethereum.enable().then((accounts) => {
        this.globals.state.message = '';
        this.globals.state.class = '';
        this.isMetamaskEnabled = true;

        return accounts[0];
      }).catch((error) => {
        this.globals.state.message = 'Cannot enable Metamask',
        this.globals.state.class = 'error';
        this.isMetamaskEnabled = false;

        console.error(error.message);

        return null;
      });
    },
    updateHash(value) {
      this.$router.push({ query: { hash: value } });
    },
    async createNewGame({ amount, address, move }) {
      this.$refs.gameForm.loading = true;
      try {
        const randomBytes = new Uint8Array(32);
        window.crypto.getRandomValues(randomBytes);
        const salt = this.toHexString(randomBytes);
        const contract = await this.createGame({ amount, address, move, salt }, this.globals.account);

        let timer = setInterval(() => {
          web3.eth.getTransactionReceipt(contract.transactionHash, (error, receipt) => {
            if (contract.address) {
              return;
            }

            if (contract.address || (receipt && receipt.contractAddress)) {
              if (timer) {
                clearInterval(timer);
                timer = null;
              }

              contract.address = receipt.contractAddress;

              this.globals.state.class = 'success';
              this.globals.state.message = 'Contract deployed';
              this.globals.state.address = contract.address;
              this.globals.state.hash = contract.transactionHash;
              this.contractCreated = true;
              this.$refs.gameForm.loading = false;

              this.globals.games[contract.address] = { move, salt };
              localStorage.setItem('solutions', JSON.stringify(this.globals.games));
              this.$refs.gameForm.reset();
            }
          });

        }, 1000);
      } catch(e) {
          this.globals.state.message = 'Unable to deploy contract ' + e.message;
          this.globals.state.class = 'error';
          this.$refs.gameForm.loading = false;
      }
    },
    toHexString(byteArray) {
      return '0x' + Array.from(byteArray).map((byte) => byte.toString(16).padStart(2, '0')).join('');
    }
  }
}
</script>