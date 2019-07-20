<template>
  <div>
    <h3>Game {{game.hash}}</h3>

    <dl>
      <dt>Stake</dt>
      <dd>{{game.stake}} Ethers</dd>
      <dt>Initiator</dt>
      <dd>{{game.j1}}</dd>
      <dt>Initiator hidden choice</dt>
      <dd>{{game.c1Hash}}</dd>
      <dt>Challanger</dt>
      <dd>{{game.j2}}</dd>
      <dt>Challanger choice</dt>
      <dd>{{choices[game.c2 || '0']}}</dd>
      <dt>Latest action</dt>
      <dd>{{game.lastAction}}</dd>
    </dl>

    <div v-if="isInitiator && game.c2 != '0' && game.stake != '0'" @click="reveal">
      <button>Reveal</button>
      <div v-if="processing">Processing...</div>
      <div v-if="failed">Reveal failed</div>
    </div>
    <form v-else-if="isChallenger && game.c2 == '0'" @submit.prevent="play">
      <select v-model="j2Move">
        <option
          v-bind:key="key"
          v-for="(choice, key) in choices"
          :disabled="key === '0'" :value="key"
        >
          {{choice}}
        </option>
      </select>
      <button type="submit">Play</button>
      <div v-if="processing">Processing...</div>
      <div v-if="failed">Play failed</div>
    </form>
    <div v-else-if="!processing && ((isChallenger && game.c2 != '0') || (isInitiator && game.c2 == '0')) && game.stake != '0'">
      <button @click="timeout">Request timeout</button>
      <div v-if="failed">Timeout request failed</div>
    </div>
    <div v-else-if="processing">Processing timeout request...</div>
    <div v-else-if="game.stake == '0'">Game finished</div>
  </div>
</template>

<script>
import choices from "../choices.json";
import globals from '../mixins/globals.js';
import game from '../mixins/game.js';

export default {
  name: 'GameDetails',
  mixins: [game],
  props: {
    game: {
      default: () => ({}),
      validator: Object
    }
  },
  data() {
    return {
      choices,
      globals,
      j1Move: 0,
      j2Move: 0,
      salt: '',
      processing: false,
      failed: false
    };
  },
  computed: {
    isInitiator() {
      return this.globals.account === this.game.j1;
    },
    isChallenger() {
      return this.globals.account === this.game.j2;
    },
  },
  created() {
  },
  methods: {
    async play() {
      if (!this.j2Move) {
        return;
      }

      this.processing = true;
      try {
        const hash = await this.playGame({
          move: this.j2Move,
          amount: this.game.stake,
          address: this.game.hash
        }, this.globals.account);
        const timer = setInterval(() => {
          web3.eth.getTransactionReceipt(hash, (error, receipt) => {
            if (receipt) {
              if (timer) {
                clearInterval(timer);
              }

              this.game.c2 = this.j2Move;
              this.failed = false;
              this.processing = false;
            }
          });
        }, 2000);
      } catch (e) {
        this.failed = true;
        this.processing = false;
      }
    },
    timeout() {
      this.processing = true;
      this.askTimeout(this.isInitiator, this.game.hash)
        .catch((e) => {
          this.failed = true;
          this.processing = false;
        })
        .then((hash) => {
          const timer = setInterval(() => {
            web3.eth.getTransactionReceipt(hash, (error, receipt) => {
              if (receipt) {
                if (timer) {
                  clearInterval(timer);
                }

                if (receipt.status === "0x1") {
                  this.failed = false;
                  this.game.stake = '0';
                } else {
                  this.failed = true;
                }
                this.processing = false;
              }
            });
          }, 2000);
        });
    },
    async reveal() {
      this.processing = true;
      const { salt, move } = this.globals.games[this.game.hash];
      this.solveGame(salt, move, this.game.hash, this.globals.account)
        .catch((e) => {
          this.failed = true;
          this.processing = false;
        })
        .then((hash) => {
          const timer = setInterval(() => {
            web3.eth.getTransactionReceipt(hash, (error, receipt) => {
              if (receipt) {
                if (timer) {
                  clearInterval(timer);
                }

                if (receipt.status === "0x1") {
                  this.game.state = '0';
                  this.failed = false;
                } else {
                  this.failed = true;
                }

                this.processing = false;
              }
            });
          }, 2000);
        });
    }
  }
}
</script>
