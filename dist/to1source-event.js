!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?module.exports=e():"function"==typeof define&&define.amd?define(e):(t="undefined"!=typeof globalThis?globalThis:t||self).To1sourceEvent=e()}(this,(function(){"use strict";var t="You are trying to register an event already been taken by other type:",e="on",r="only",o="once",n="onlyOnce",i=-1,a=[e,r,o,n],s=[e,r];function u(t){return t instanceof RegExp}function l(t){return"string"==typeof t}function h(t){if(l(t))throw new Error("Wrong type, we want number!");return!isNaN(parseInt(t))}function p(t){switch(!0){case!0===u(t):return t;case!0===l(t):return new RegExp(t);default:return!1}}var g=new WeakMap,f=new WeakMap,c=function(t){void 0===t&&(t={}),t.logger&&"function"==typeof t.logger&&(this.logger=t.logger)},d={$name:{configurable:!0}};c.prototype.logger=function(){},d.$name.get=function(){return"to1source-event"},c.prototype._validateEvt=function(){for(var t=this,e=[],r=arguments.length;r--;)e[r]=arguments[r];return e.forEach((function(e){if(!l(e))throw t.logger("(validateEvt)",e),new Error("Event name must be string type! we got "+typeof e)})),!0},c.prototype._validate=function(t,e){if(this._validateEvt(t)&&"function"==typeof e)return!0;throw new Error("callback required to be function type! we got "+typeof e)},c.prototype._validateType=function(t){return this._validateEvt(t),!!a.filter((function(e){return t===e})).length},c.prototype._run=function(t,e,r){return this.logger("(run) callback:",t,"payload:",e,"context:",r),this.$done=Reflect.apply(t,r,this.toArray(e)),this.$done},c.prototype._hashFnToKey=function(t){return function(t){return t.split("").reduce((function(t,e){return(t=(t<<5)-t+e.charCodeAt(0))&t}),0)}(t.toString())+""},c.prototype.toArray=function(t){return Array.isArray(t)?t:[t]},Object.defineProperties(c.prototype,d);var y=function(t){function e(e){void 0===e&&(e={}),t.call(this,e),this.keep=e.keep,this.result=e.keep?[]:null,this.normalStore=new Map,this.lazyStore=new Map,this.maxCountStore=new Map}t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e;var r={normalStore:{configurable:!0},lazyStore:{configurable:!0}};return e.prototype.getMaxStore=function(t){return this.maxCountStore.get(t)||i},e.prototype.checkMaxStore=function(t,e){if(void 0===e&&(e=null),this.logger("==========================================="),this.logger("checkMaxStore start",t,e),null!==e&&h(e))return this.maxCountStore.set(t,e),this.logger("Setup max store for "+t+" with "+e),e;if(null===e){var r=this.getMaxStore(t);if(this.logger("getMaxStore value",r),r!==i){if(r>0&&--r,!(r>0))return this.maxCountStore.delete(t),this.logger("remove "+t+" from maxStore"),i;this.maxCountStore.set(t,r)}return r}throw new Error("Expect max to be an integer, but we got "+typeof e+" "+e)},e.prototype.searchMapEvt=function(t){var e=this.$get(t,!0).filter((function(t){var e=t[3];return s.includes(e)}));return e.length?e:[]},e.prototype.takeFromStore=function(t,e){void 0===e&&(e="lazyStore");var r=this[e];if(r){if(this.logger("(takeFromStore)",e,r),r.has(t)){var o=r.get(t);return this.logger('(takeFromStore) has "'+t+'"',o),r.delete(t),o}return!1}throw new Error('"'+e+'" is not supported!')},e.prototype.findFromStore=function(t,e,r){return void 0===r&&(r=!1),!!e.has(t)&&Array.from(e.get(t)).map((function(t){return r?t:t[1]}))},e.prototype.removeFromStore=function(t,e){return!!e.has(t)&&(this.logger("($off)",t),e.delete(t),!0)},e.prototype.getStoreSet=function(t,e){var r;return t.has(e)?(this.logger('(addToStore) "'+e+'" existed'),r=t.get(e)):(this.logger('(addToStore) create new Set for "'+e+'"'),r=new Set),r},e.prototype.addToStore=function(t,e){for(var r=[],o=arguments.length-2;o-- >0;)r[o]=arguments[o+2];var n=this.getStoreSet(t,e);if(r.length>2)if(Array.isArray(r[0])){var i=r[2];this.checkTypeInLazyStore(e,i)||n.add(r)}else this.checkContentExist(r,n)||(this.logger("(addToStore) insert new",r),n.add(r));else n.add(r);return t.set(e,n),[t,n.size]},e.prototype.checkContentExist=function(t,e){return!!Array.from(e).filter((function(e){return e[0]===t[0]})).length},e.prototype.checkTypeInStore=function(t,e){this._validateEvt(t,e);var r=this.$get(t,!0);return!1===r||!r.filter((function(t){var r=t[3];return e!==r})).length},e.prototype.checkTypeInLazyStore=function(t,e){this._validateEvt(t,e);var r=this.lazyStore.get(t);return this.logger("(checkTypeInLazyStore)",r),!!r&&!!Array.from(r).filter((function(t){return t[2]!==e})).length},e.prototype.addToNormalStore=function(t,e,r,o){if(void 0===o&&(o=null),this.logger('(addToNormalStore) try to add "'+e+'" --\x3e "'+t+'" to normal store'),this.checkTypeInStore(t,e)){this.logger("(addToNormalStore)",'"'+e+'" --\x3e "'+t+'" can add to normal store');var n=this._hashFnToKey(r),i=[this.normalStore,t,n,r,o,e],a=Reflect.apply(this.addToStore,this,i),s=a[0],u=a[1];return this.normalStore=s,u}return!1},e.prototype.addToLazyStore=function(t,e,r,o){void 0===e&&(e=[]),void 0===r&&(r=null),void 0===o&&(o=!1);var n=[this.lazyStore,t,this.toArray(e),r];o&&n.push(o);var i=Reflect.apply(this.addToStore,this,n),a=i[0],s=i[1];return this.lazyStore=a,this.logger("(addToLazyStore) size: "+s),s},r.normalStore.set=function(t){g.set(this,t)},r.normalStore.get=function(){return g.get(this)},r.lazyStore.set=function(t){f.set(this,t)},r.lazyStore.get=function(){return f.get(this)},Object.defineProperties(e.prototype,r),e}(c),_=function(t){function e(e){t.call(this,e),this.__suspend_state__=null,this.__pattern__=[],this.queueStore=new Set}t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e;var r={$queues:{configurable:!0}};return e.prototype.$suspend=function(){this.logger("---\x3e SUSPEND ALL OPS <---"),this.__suspend__(!0)},e.prototype.$release=function(){this.logger("---\x3e RELEASE ALL SUSPENDED QUEUE <---"),this.__suspend__(!1)},e.prototype.$suspendEvent=function(){for(var t=this,e=[],r=arguments.length;r--;)e[r]=arguments[r];return e.map((function(e){var r=p(e);if(u(r))return!1===t.__isPatternRegisterd(r)&&(t.__pattern__.push(r),t.__pattern__.length);throw new Error('We expect a pattern variable to be string or RegExp, but we got "'+typeof r+'" instead')}))},e.prototype.$releaseEvent=function(){for(var t=this,e=[],r=arguments.length;r--;)e[r]=arguments[r];return e.map((function(e){t.logger("($releaseEvent)",e);var r=p(e);if(u(r)&&t.__isPatternRegisterd(r)){var o=t;return t.__getToReleaseQueue(r).map((function(t,e){return Reflect.apply(o.$trigger,o,t),e})).reduce((function(t,e){return++e}),0)}throw t.logger("$releaseEvent throw error ==========================>",t.__pattern__,r),new Error('We expect a pattern variable to be string or RegExp, but we got "'+typeof r+'" instead')})).reduce((function(t,e){return t+e}),0)},e.prototype.$queue=function(t){for(var e=[],r=arguments.length-1;r-- >0;)e[r]=arguments[r+1];switch(!0){case!0===this.__suspend_state__:return this.__addToQueueStore(t,e);case!0==!!this.__pattern__.length:return this.__pattern__.filter((function(e){return e.test(t)})).length?this.__addToQueueStore(t,e):(this.logger("($queue) "+t+" NOT added to $queueStore",this.__pattern__),!1);default:return this.logger("($queue) get called NOTHING added"),!1}},r.$queues.get=function(){var t=this.queueStore.size;return this.logger("($queues)","size: "+t),t>0?Array.from(this.queueStore):[]},e.prototype.__getToReleaseQueue=function(t){var e=this,r=this.$queues.filter((function(e){return t.test(e[0])})).map((function(r){return e.logger("[release] execute "+r[0]+" matches "+t,r),e.queueStore.delete(r),r}));return r.length>0&&(this.__pattern__=this.__pattern__.filter((function(e){return e.toString()!==t.toString()}))),r},e.prototype.__addToQueueStore=function(t,e){return this.logger("($queue) "+t+" added to $queueStore",e),this.queueStore.add([t].concat(e)),!0},e.prototype.__isPatternRegisterd=function(t){return!!this.__pattern__.filter((function(e){return e.toString()===t.toString()})).length},e.prototype.__suspend__=function(t){if("boolean"!=typeof t)throw new Error("$suspend only accept Boolean value! we got "+typeof t);var e=this.__suspend_state__;this.__suspend_state__=t,this.logger('($suspend) Change from "'+e+'" --\x3e "'+t+'"'),!0===e&&!1===t&&this.__release__()},e.prototype.__release__=function(){var t=this,e=this.queueStore.size,r=this.__pattern__;if(this.__pattern__=[],this.logger("(release) was called with "+e+(r.length?' for "'+r.join(",")+'"':"")+" item"+(e>1?"s":"")),e>0){var o=Array.from(this.queueStore);this.logger("(release queue)",o),o.forEach((function(e){t.logger("[release] execute "+e[0],e),Reflect.apply(t.$trigger,t,e)})),this.queueStore.clear(),this.logger("Release size "+this.queueStore.size)}return e},Object.defineProperties(e.prototype,r),e}(y),v=function(a){function s(t){void 0===t&&(t={}),a.call(this,t)}a&&(s.__proto__=a),s.prototype=Object.create(a&&a.prototype),s.prototype.constructor=s;var u={$done:{configurable:!0}};return s.prototype.$on=function(e,r,o){var n=this;void 0===o&&(o=null);var i="on";this._validate(e,r);var a=this.takeFromStore(e);if(!1===a)return this.logger('($on) "'+e+'" is not in lazy store'),this.addToNormalStore(e,i,r,o);this.logger("($on) "+e+" found in lazy store");var s=0;return a.forEach((function(a){var u=a[0],l=a[1],h=a[2];if(h&&h!==i)throw new Error(t+" "+h);n.logger("($on)",'call run "'+e+'"'),n._run(r,u,o||l),s+=n.addToNormalStore(e,i,r,o||l)})),this.logger("($on) return size "+s),s},s.prototype.$once=function(e,r,n){void 0===n&&(n=null),this._validate(e,r);var i=this.takeFromStore(e);if(!1===i)return this.logger('($once) "'+e+'" is not in the lazy store'),this.addToNormalStore(e,o,r,n);this.logger("($once)",i);var a=Array.from(i)[0],s=a[0],u=a[1],l=a[2];if(l&&l!==o)throw new Error(t+" "+l);this.logger("($once)",'call run "'+e+'"'),this._run(r,s,n||u),this.$off(e)},s.prototype.$only=function(e,o,n){var i=this;void 0===n&&(n=null),this._validate(e,o);var a=!1,s=this.takeFromStore(e);(this.normalStore.has(e)||(this.logger('($only) "'+e+'" add to normalStore'),a=this.addToNormalStore(e,r,o,n)),!1!==s)&&(this.logger('($only) "'+e+'" found data in lazy store to execute'),Array.from(s).forEach((function(a){var s=a[0],u=a[1],l=a[2];if(l&&l!==r)throw new Error(t+" "+l);i.logger('($only) call run "'+e+'"'),i._run(o,s,n||u)})));return a},s.prototype.$onlyOnce=function(e,r,o){void 0===o&&(o=null),this._validate(e,r);var i=!1,a=this.takeFromStore(e);if(this.normalStore.has(e)||(this.logger('($onlyOnce) "'+e+'" add to normalStore'),i=this.addToNormalStore(e,n,r,o)),!1!==a){this.logger("($onlyOnce)",a);var s=Array.from(a)[0],u=s[0],l=s[1],h=s[2];if(h&&h!==n)throw new Error(t+" "+h);this.logger('($onlyOnce) call run "'+e+'"'),this._run(r,u,o||l),this.$off(e)}return i},s.prototype.$max=function(t,e,r){if(void 0===r&&(r=null),this._validateEvt(t),h(e)&&e>0){if(!1!==this.$get(t,!0)){var o=this.searchMapEvt(t);if(o.length){var n=o[0][3];this.checkMaxStore(t,e);var a=this;return function(){for(var e=[],o=arguments.length;o--;)e[o]=arguments[o];var s=a.getMaxStore(t),u=i;if(s>0){var l=a.$call(t,n,r);if(Reflect.apply(l,a,e),(u=a.checkMaxStore(t))===i)return a.$off(t),i}return u}}}return this.logger("The "+t+" is not registered, can not execute non-existing event at the moment"),i}throw new Error("Expect max to be an integer and greater than zero! But we got ["+typeof e+"]"+e+" instead")},s.prototype.$replace=function(t,r,o,n){if(void 0===o&&(o=null),void 0===n&&(n=e),this._validateType(n)){this.$off(t);var i=this["$"+n];return this.logger("($replace)",t,r),Reflect.apply(i,this,[t,r,o])}throw new Error(n+" is not supported!")},s.prototype.$trigger=function(t,e,r,o){void 0===e&&(e=[]),void 0===r&&(r=null),void 0===o&&(o=!1),this._validateEvt(t);var n=0,i=this.normalStore;if(this.logger("($trigger) normalStore",i),i.has(t)){if(this.logger('($trigger) "'+t+'" found'),this.$queue(t,e,r,o))return this.logger('($trigger) Currently suspended "'+t+'" added to queue, nothing executed. Exit now.'),!1;for(var a=Array.from(i.get(t)),s=a.length,u=!1,l=0;l<s;++l){++n;var h=a[l],p=h[1],g=h[2],f=h[3];this.logger("($trigger) call run for "+o+":"+t),this._run(p,e,r||g),"once"!==f&&"onlyOnce"!==f||(u=!0)}return u&&i.delete(t),n}return this.addToLazyStore(t,e,r,o),n},s.prototype.$call=function(t,e,r){void 0===e&&(e=!1),void 0===r&&(r=null);var o=this;return function(){for(var n=[],i=arguments.length;i--;)n[i]=arguments[i];var a=[t,n,r,e];return Reflect.apply(o.$trigger,o,a)}},s.prototype.$off=function(t){var e=this;return this._validateEvt(t),!![this.lazyStore,this.normalStore].filter((function(e){return e.has(t)})).map((function(r){return e.removeFromStore(t,r)})).length},s.prototype.$get=function(t,e){void 0===e&&(e=!1),this._validateEvt(t);var r=this.normalStore;return this.findFromStore(t,r,e)},u.$done.set=function(t){this.logger("($done) set value: ",t),this.keep?this.result.push(t):this.result=t},u.$done.get=function(){return this.logger("($done) get result:",this.result),this.keep?this.result[this.result.length-1]:this.result},s.prototype.$debug=function(t){var e=this;void 0===t&&(t=null);var r=["lazyStore","normalStore"],o=[this.lazyStore,this.normalStore];o[t]?this.logger(r[t],o[t]):o.map((function(t,o){e.logger(r[o],t)}))},Object.defineProperties(s.prototype,u),s}(_);return v}));
//# sourceMappingURL=to1source-event.js.map