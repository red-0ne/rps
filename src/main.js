import Vue from 'vue'
import VueRouter from 'vue-router'

import App from './App.vue'
import MainComponent from "./components/main-component.vue";

Vue.use(VueRouter)

const router = new VueRouter({
  mode: 'history',
  routes: [
    { path: '/', component: MainComponent }
  ]
});

Vue.config.productionTip = false

new Vue({
  router,
  render: h => h(App),
}).$mount('#app')
