import Vue from 'vue/dist/vue';

let activeInstance = null;
let activeWatcherFn = null;

Vue.mixin({
  beforeCreate () {
    activeInstance = this;
    let context;
    if (this.$options.setup) {
      context = this.$options.setup.call(this);
    }

    if (context) {
      this.$options.computed = this.$options.computed || {};
      Object.keys(context).forEach(key => {
        this.$options.computed[key] = function () {
          if (context[key] === null || context[key] === undefined) {
            return;
          }

          return context[key]._isWrapper ? context[key].value : context[key];
        }
      });
    }
  }
});

function state (obj) {
  const observable = Vue.observable(obj);

  return observable;
}

function value (val) {
  const observable = state({ _value: val });
  observable._isWrapper = true;
  Object.defineProperty(observable, 'value', {
    enumerable: false,
    get () {
      activeWatcherFn = observable;

      return observable._value;
    },
    set (val) {
      observable._value = val;
    }
  });

  return observable;
}

function watch (fn, handler) {
  fn();
  let val;
  if (activeWatcherFn) {
    val = state({ ...activeWatcherFn });

    Object.defineProperty(val, 'value', {
      set (value) {
        handler(value);
      }
    });
  }

  activeWatcherFn = null;

  return;
}

function computed (fn) {
  fn();
  let val;
  if (activeWatcherFn) {
    val = state({ ...activeWatcherFn });

    Object.defineProperty(val, 'value', {
      get () {
        return fn();
      }
    });
  }

  activeWatcherFn = null;

  return val;
}

function onMounted (cb) {
  activeInstance.$on('hook:mounted', cb.bind(activeInstance));
}

function onUnmounted (cb) {
  activeInstance.$on('hook:beforeDestroy', cb.bind(activeInstance));
}

function onCreated (cb) {
  activeInstance.$on('hook:created', cb.bind(activeInstance));
}

export {
  value,
  state,
  computed,
  watch,
  onMounted,
  onCreated,
  onUnmounted
};
