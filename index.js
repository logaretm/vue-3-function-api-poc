import { onMounted, onUnmounted, value, computed, watch, createElement as h } from './lib';
import Vue from 'vue/dist/vue';

function useMouse() {
  const x = value(0);
  const y = value(0);
  const update = e => {
    x.value = e.pageX;
    y.value = e.pageY;
  };

  onMounted(() => {
    window.addEventListener('mousemove', update)
  });
  onUnmounted(() => {
    window.removeEventListener('mousemove', update)
  });

  return { x, y };
}

function useCounter() {
  const count = value(0);
  const increment = () => { count.value++ };
  const double = computed(() => count.value * 2);

  return {
    count,
    increment,
    double
  };
}

new Vue({
  setup () {
    const { x, y } = useMouse();

    return () => {
      return h('div', {}, `${x.value} ${y.value}`);
    };
  }
}).$mount('#mouse');

new Vue({
  setup () {
    const { count, double, increment } = useCounter();
    watch(count, () => {
      console.log('Oi! Count has changed.');
    });


    return { count, double, increment };
  },
  template: `<div>
  <div>
      current count: {{ count }}
    </div>
    <div>
      times 2: {{ double }}
    </div>
    <button @click="increment">+</button>
  </div>`
}).$mount('#count');
