import Vue from 'vue/dist/vue';

let activeInstance = null;
let activeWatcherFn = null;

let DOM_EL = document.createElement('div');

Vue.mixin({
  beforeCreate () {
    activeInstance = this;
    let context;
    if (this.$options.setup) {
      context = this.$options.setup.call(this);
    }

    // Is a render function.
    if (typeof context === 'function') {
      this.$options.render = function (h) {
        return context(h, this.$props, this.$slots, this.$vnode);
      }

      return;
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
    configurable: true,
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
  if (typeof fn === 'function') {
    fn();
  } else {
    activeWatcherFn = fn;
  }

  if (activeWatcherFn) {
    const setter = function (value) {
      const oldValue = this._value;
      this._value = value;
      handler(value, oldValue);
    };

    Object.defineProperty(activeWatcherFn, 'value', {
      set (value) {
        setter.call(this, value);
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


function nestData (data) {
  return Object.keys(data).reduce((curr, key) => {
    // converts events from Vue 3.0 flat vnode data to 2.0 nested structure.
    if (key.indexOf('on') === 0) {
      curr.on = curr.on || {};
      const evt = key.slice(2).toLowerCase();
      curr.on[evt] = curr.on[evt] ? [...curr.on[evt], data[key]] : [data[key]];
    }

    if (key in DOM_EL) {
      curr.domProps = curr.domProps || {};
      curr.domProps[key] = data[key];
    }

    return curr;
  }, {});
}

function createElement (vnode, data, children) {
  const normalizedData = nestData(data);
  if (Array.isArray(children)) {
    children = children.map(c => nestData(c));
  }

  return activeInstance.$createElement(vnode, normalizedData, children);
}

export {
  value,
  state,
  computed,
  watch,
  onMounted,
  onCreated,
  onUnmounted,
  createElement
};
