<template>
  <form ref="txForm" @submit.prevent="sendTransaction">
    <h2>New game</h2>
    <input v-model="amount" placeholder="Ethers to stake"/>
    <input v-model="address" placeholder="Challanger address"/>
    <select v-model="move">
      <option
        v-bind:key="key"
        v-for="(choice, key) in choices"
        :disabled="key === '0'" :value="key"
      >
        {{choice}}
      </option>
    </select>
    <button>Create game</button>
    <div v-if="loading">Processing, Waiting for contract address...</div>
  </form>
</template>

<script>
import choices from "../choices.json";
import globals from '../mixins/globals.js';

export default {
  name: 'CreateGame',
  data() {
    return {
      loading: false,
      amount: null,
      address: null,
      move: null,
      choices,
      globals
    }
  },
  methods: {
    sendTransaction() {
      if (this.amount && this.address && this.move) {
        const { amount, address, move } = this;
        this.$emit('newGame', { amount, address, move });
      }
    },
    reset() {
      this.amount = null;
      this.address = null;
      this.move = null;
      this.salt = null;
    }
  }
}
</script>