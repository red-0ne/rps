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

    <button v-if="isInitiator && game.c2 != '0' && game.stake != '0'" @click="reveal">Reveal</button>
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
    </form>
    <button
      v-else-if="((isChallenger && game.c2 != '0') || (isInitiator && game.c2 == '0')) && game.stake != '0'"
      @click="timeout"
    >Request timeout</button>
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
      salt: ''
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
        this.globals.state = {
          message: 'Cannot play move',
          class: 'error'
        };
      if (!this.j2Move) {
        return;
      }

      try {
        await this.playGame({
          move: this.j2Move,
          amount: this.game.stake,
          address: this.game.hash
        }, this.globals.account);
        this.game.c2 = this.j2Move;
      } catch (e) {
        console.log('fail playing')
        this.globals.state.message = 'Cannot play move',
        this.globals.state.class = 'error';
      }
    },
    timeout() {
      this.askTimeout(this.isInitiator, this.game.hash)
        .catch((e) => {
          this.globals.state.message = 'Cannot request timeout',
          this.globals.state.class = 'error';
        })
        .then(() => this.game.stake = '0');
    },
    async reveal() {
      const { salt, move } = this.globals.games[this.game.hash];
      this.solveGame(salt, move, this.game.hash, this.globals.account);
    }
  }
}
</script>
