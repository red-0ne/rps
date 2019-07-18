<template>
  <div>
    <form @submit.prevent="searchGame">
      <h2>Game details</h2>
      <input placeholder="Game address" v-model="currentHash" />
      <button type="submit">Search</button>
    </form>

    <GameDetails v-if="contract" :game="contract"/>

    <div v-else-if="hash">
      <h3>No game at {{hash}}</h3>
    </div>
  </div>

</template>

<script>
import choices from "../choices.json";
import GameDetails from "./game-details.vue";

export default {
  name: 'SearchGame',
  components: {
    GameDetails
  },
  props: {
    hash: String,
    contract: Object
  },
  data() {
    return {
      currentHash: '',
      choices: choices
    };
  },
  created() {
    this.currentHash = this.hash;
  },
  methods: {
    searchGame() {
      this.$emit('hashValueChange', this.currentHash);
    }
  }
}
</script>