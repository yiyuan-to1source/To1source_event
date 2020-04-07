"use strict";var t="You are trying to register an event already been taken by other type:",e=["on","only","once","onlyOnce"],r=["on","only"];function o(t){return t instanceof RegExp}function n(t){return"string"==typeof t}function i(t){if(n(t))throw new Error("Wrong type, we want number!");return!isNaN(parseInt(t))}function a(t){switch(!0){case!0===o(t):return t;case!0===n(t):return new RegExp(t);default:return!1}}var s=new WeakMap,u=new WeakMap,l=function(){},h={$name:{configurable:!0},is:{configurable:!0}};l.prototype.logger=function(){},h.$name.get=function(){return"to1source-event"},h.is.get=function(){return this.$name},l.prototype.validateEvt=function(){for(var t=this,e=[],r=arguments.length;r--;)e[r]=arguments[r];return e.forEach((function(e){if(!n(e))throw t.logger("(validateEvt)",e),new Error("Event name must be string type! we got "+typeof e)})),!0},l.prototype.validate=function(t,e){if(this.validateEvt(t)&&"function"==typeof e)return!0;throw new Error("callback required to be function type! we got "+typeof e)},l.prototype.validateType=function(t){return this.validateEvt(t),!!e.filter((function(e){return t===e})).length},l.prototype.run=function(t,e,r){return this.logger("(run) callback:",t,"payload:",e,"context:",r),this.$done=Reflect.apply(t,r,this.toArray(e)),this.$done},l.prototype.hashFnToKey=function(t){return function(t){return t.split("").reduce((function(t,e){return(t=(t<<5)-t+e.charCodeAt(0))&t}),0)}(t.toString())+""},Object.defineProperties(l.prototype,h);var p=function(e){function r(t){void 0===t&&(t={}),e.call(this,t)}e&&(r.__proto__=e),r.prototype=Object.create(e&&e.prototype),r.prototype.constructor=r;var o={$done:{configurable:!0}};return r.prototype.$on=function(e,r,o){var n=this;void 0===o&&(o=null);this.validate(e,r);var i=this.takeFromStore(e);if(!1===i)return this.logger('($on) "'+e+'" is not in lazy store'),this.addToNormalStore(e,"on",r,o);this.logger("($on) "+e+" found in lazy store");var a=0;return i.forEach((function(i){var s=i[0],u=i[1],l=i[2];if(l&&"on"!==l)throw new Error(t+" "+l);n.logger("($on)",'call run "'+e+'"'),n.run(r,s,o||u),a+=n.addToNormalStore(e,"on",r,o||u)})),this.logger("($on) return size "+a),a},r.prototype.$once=function(e,r,o){void 0===o&&(o=null),this.validate(e,r);var n=this.takeFromStore(e);if(!1===n)return this.logger('($once) "'+e+'" is not in the lazy store'),this.addToNormalStore(e,"once",r,o);this.logger("($once)",n);var i=Array.from(n)[0],a=i[0],s=i[1],u=i[2];if(u&&"once"!==u)throw new Error(t+" "+u);this.logger("($once)",'call run "'+e+'"'),this.run(r,a,o||s),this.$off(e)},r.prototype.$only=function(e,r,o){var n=this;void 0===o&&(o=null),this.validate(e,r);var i=!1,a=this.takeFromStore(e);(this.normalStore.has(e)||(this.logger('($only) "'+e+'" add to normalStore'),i=this.addToNormalStore(e,"only",r,o)),!1!==a)&&(this.logger('($only) "'+e+'" found data in lazy store to execute'),Array.from(a).forEach((function(i){var a=i[0],s=i[1],u=i[2];if(u&&"only"!==u)throw new Error(t+" "+u);n.logger('($only) call run "'+e+'"'),n.run(r,a,o||s)})));return i},r.prototype.$onlyOnce=function(e,r,o){void 0===o&&(o=null),this.validate(e,r);var n=!1,i=this.takeFromStore(e);if(this.normalStore.has(e)||(this.logger('($onlyOnce) "'+e+'" add to normalStore'),n=this.addToNormalStore(e,"onlyOnce",r,o)),!1!==i){this.logger("($onlyOnce)",i);var a=Array.from(i)[0],s=a[0],u=a[1],l=a[2];if(l&&"onlyOnce"!==l)throw new Error(t+" "+l);this.logger('($onlyOnce) call run "'+e+'"'),this.run(r,s,o||u),this.$off(e)}return n},r.prototype.$max=function(t,e,r){if(void 0===r&&(r=null),this.validateEvt(t),i(e)&&e>0){if(!1!==this.$get(t,!0)){var o=this.searchMapEvt(t);if(o.length){var n=o[0][3],a=(this.checkMaxStore(t,e),this);return function(){for(var e=[],o=arguments.length;o--;)e[o]=arguments[o];var i=a.getMaxStore(t),s=-1;if(i>0){var u=a.$call(t,n,r);if(Reflect.apply(u,a,e),-1===(s=a.checkMaxStore(t)))return a.$off(t),-1}return s}}}return this.logger("The "+t+" is not registered, can not execute non-existing event at the moment"),-1}throw new Error("Expect max to be an integer and greater than zero! But we got ["+typeof e+"]"+e+" instead")},r.prototype.$replace=function(t,e,r,o){if(void 0===r&&(r=null),void 0===o&&(o="on"),this.validateType(o)){this.$off(t);var n=this["$"+o];return this.logger("($replace)",t,e),Reflect.apply(n,this,[t,e,r])}throw new Error(o+" is not supported!")},r.prototype.$trigger=function(t,e,r,o){void 0===e&&(e=[]),void 0===r&&(r=null),void 0===o&&(o=!1),this.validateEvt(t);var n=0,i=this.normalStore;if(this.logger("($trigger) normalStore",i),i.has(t)){if(this.logger('($trigger) "'+t+'" found'),this.$queue(t,e,r,o))return this.logger('($trigger) Currently suspended "'+t+'" added to queue, nothing executed. Exit now.'),!1;for(var a=Array.from(i.get(t)),s=a.length,u=!1,l=0;l<s;++l){++n;var h=a[l],p=(h[0],h[1]),g=h[2],c=h[3];this.logger("($trigger) call run for "+o+":"+t),this.run(p,e,r||g),"once"!==c&&"onlyOnce"!==c||(u=!0)}return u&&i.delete(t),n}return this.addToLazyStore(t,e,r,o),n},r.prototype.$call=function(t,e,r){void 0===e&&(e=!1),void 0===r&&(r=null);var o=this;return function(){for(var n=[],i=arguments.length;i--;)n[i]=arguments[i];var a=[t,n,r,e];return Reflect.apply(o.$trigger,o,a)}},r.prototype.$off=function(t){var e=this;return this.validateEvt(t),!![this.lazyStore,this.normalStore].filter((function(e){return e.has(t)})).map((function(r){return e.removeFromStore(t,r)})).length},r.prototype.$get=function(t,e){void 0===e&&(e=!1),this.validateEvt(t);var r=this.normalStore;return this.findFromStore(t,r,e)},o.$done.set=function(t){this.logger("($done) set value: ",t),this.keep?this.result.push(t):this.result=t},o.$done.get=function(){return this.logger("($done) get result:",this.result),this.keep?this.result[this.result.length-1]:this.result},r.prototype.$debug=function(t){var e=this;void 0===t&&(t=null);var r=["lazyStore","normalStore"],o=[this.lazyStore,this.normalStore];o[t]?this.logger(r[t],o[t]):o.map((function(t,o){e.logger(r[o],t)}))},Object.defineProperties(r.prototype,o),r}(function(t){function e(e){void 0===e&&(e={}),t.call(this),e.logger&&"function"==typeof e.logger&&(this.logger=e.logger),this.keep=e.keep,this.result=e.keep?[]:null,this.normalStore=new Map,this.lazyStore=new Map,this.maxCountStore=new Map}t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e;var o={normalStore:{configurable:!0},lazyStore:{configurable:!0}};return e.prototype.getMaxStore=function(t){return this.maxCountStore.get(t)||-1},e.prototype.checkMaxStore=function(t,e){if(void 0===e&&(e=null),this.logger("==========================================="),this.logger("checkMaxStore start",t,e),null!==e&&i(e))return this.maxCountStore.set(t,e),this.logger("Setup max store for "+t+" with "+e),e;if(null===e){var r=this.getMaxStore(t);if(this.logger("getMaxStore value",r),-1!==r){if(r>0&&--r,!(r>0))return this.maxCountStore.delete(t),this.logger("remove "+t+" from maxStore"),-1;this.maxCountStore.set(t,r)}return r}throw new Error("Expect max to be an integer, but we got "+typeof e+" "+e)},e.prototype.searchMapEvt=function(t){var e=this.$get(t,!0).filter((function(t){var e,o=t[3];return e=o,!!r.filter((function(t){return e===t})).length}));return e.length?e:[]},e.prototype.takeFromStore=function(t,e){void 0===e&&(e="lazyStore");var r=this[e];if(r){if(this.logger("(takeFromStore)",e,r),r.has(t)){var o=r.get(t);return this.logger('(takeFromStore) has "'+t+'"',o),r.delete(t),o}return!1}throw new Error('"'+e+'" is not supported!')},e.prototype.findFromStore=function(t,e,r){return void 0===r&&(r=!1),!!e.has(t)&&Array.from(e.get(t)).map((function(t){return r?t:t[1]}))},e.prototype.removeFromStore=function(t,e){return!!e.has(t)&&(this.logger("($off)",t),e.delete(t),!0)},e.prototype.getStoreSet=function(t,e){var r;return t.has(e)?(this.logger('(addToStore) "'+e+'" existed'),r=t.get(e)):(this.logger('(addToStore) create new Set for "'+e+'"'),r=new Set),r},e.prototype.addToStore=function(t,e){for(var r=[],o=arguments.length-2;o-- >0;)r[o]=arguments[o+2];var n=this.getStoreSet(t,e);if(r.length>2)if(Array.isArray(r[0])){var i=r[2];this.checkTypeInLazyStore(e,i)||n.add(r)}else this.checkContentExist(r,n)||(this.logger("(addToStore) insert new",r),n.add(r));else n.add(r);return t.set(e,n),[t,n.size]},e.prototype.checkContentExist=function(t,e){return!!Array.from(e).filter((function(e){return e[0]===t[0]})).length},e.prototype.checkTypeInStore=function(t,e){this.validateEvt(t,e);var r=this.$get(t,!0);return!1===r||!r.filter((function(t){var r=t[3];return e!==r})).length},e.prototype.checkTypeInLazyStore=function(t,e){this.validateEvt(t,e);var r=this.lazyStore.get(t);return this.logger("(checkTypeInLazyStore)",r),!!r&&!!Array.from(r).filter((function(t){return t[2]!==e})).length},e.prototype.addToNormalStore=function(t,e,r,o){if(void 0===o&&(o=null),this.logger('(addToNormalStore) try to add "'+e+'" --\x3e "'+t+'" to normal store'),this.checkTypeInStore(t,e)){this.logger("(addToNormalStore)",'"'+e+'" --\x3e "'+t+'" can add to normal store');var n=this.hashFnToKey(r),i=[this.normalStore,t,n,r,o,e],a=Reflect.apply(this.addToStore,this,i),s=a[0],u=a[1];return this.normalStore=s,u}return!1},e.prototype.addToLazyStore=function(t,e,r,o){void 0===e&&(e=[]),void 0===r&&(r=null),void 0===o&&(o=!1);var n=[this.lazyStore,t,this.toArray(e),r];o&&n.push(o);var i=Reflect.apply(this.addToStore,this,n),a=i[0],s=i[1];return this.lazyStore=a,this.logger("(addToLazyStore) size: "+s),s},e.prototype.toArray=function(t){return Array.isArray(t)?t:[t]},o.normalStore.set=function(t){s.set(this,t)},o.normalStore.get=function(){return s.get(this)},o.lazyStore.set=function(t){u.set(this,t)},o.lazyStore.get=function(){return u.get(this)},Object.defineProperties(e.prototype,o),e}(function(t){function e(){t.call(this),this.__suspend_state__=null,this.__pattern__=[],this.queueStore=new Set}t&&(e.__proto__=t),e.prototype=Object.create(t&&t.prototype),e.prototype.constructor=e;var r={$queues:{configurable:!0}};return e.prototype.$suspend=function(){this.logger("---\x3e SUSPEND ALL OPS <---"),this.__suspend__(!0)},e.prototype.$release=function(){this.logger("---\x3e RELEASE ALL SUSPENDED QUEUE <---"),this.__suspend__(!1)},e.prototype.$suspendEvent=function(t){var e=a(t);if(o(e))return!1===this.isPatternRegisterd(e)&&(this.__pattern__.push(e),this.$suspend());throw new Error('We expect a pattern variable to be string or RegExp, but we got "'+typeof e+'" instead')},e.prototype.$releaseEvent=function(t){var e=this,r=a(t);if(o(r)&&this.isPatternRegisterd(t)){var n=this,i=this.$queues.filter((function(t){return r.test(t[0])})).map((function(t){e.logger("[release] execute "+t[0]+" matches "+r,t),n.queueStore.delete(t),Reflect.apply(n.$trigger,n,t)})).length;return this.__pattern__=this.__pattern__.filter((function(t){return t!==r})),i}throw new Error('We expect a pattern variable to be string or RegExp, but we got "'+typeof r+'" instead')},e.prototype.$queue=function(t){for(var e=[],r=arguments.length-1;r-- >0;)e[r]=arguments[r+1];switch(this.logger("($queue) get called"),!0){case!0===this.__suspend_state__:return this.addToQueueStore(t,e);case!0==!!this.__pattern__.length:return this.__pattern__.filter((function(e){return e.test(t)})).length?(this.logger("($queue) "+t+" NOT added to $queueStore",e),!1):this.addToQueueStore(t,e);default:return!1}},r.$queues.get=function(){var t=this.queueStore.size;return this.logger("($queues)","size: "+t),t>0?Array.from(this.queueStore):[]},e.prototype.addToQueueStore=function(t,e){return this.logger("($queue) "+t+" added to $queueStore",e),this.queueStore.add([t].concat(e)),!0},e.prototype.isPatternRegisterd=function(t){return!!this.__pattern__.filter((function(e){return e===t})).length},e.prototype.__suspend__=function(t){if("boolean"!=typeof t)throw new Error("$suspend only accept Boolean value! we got "+typeof t);var e=this.__suspend_state__;this.__suspend_state__=t,this.logger('($suspend) Change from "'+e+'" --\x3e "'+t+'"'),!0===e&&!1===t&&this.__release__()},e.prototype.__release__=function(){var t=this,e=this.queueStore.size,r=this.__pattern__;if(this.__pattern__=[],this.logger("(release) was called with "+e+(r.length?' for "'+r.join(",")+'"':"")+" item"+(e>1?"s":"")),e>0){var o=Array.from(this.queueStore);this.logger("(release queue)",o),o.forEach((function(e){t.logger("[release] execute "+e[0],e),Reflect.apply(t.$trigger,t,e)})),this.queueStore.clear(),this.logger("Release size "+this.queueStore.size)}return e},Object.defineProperties(e.prototype,r),e}(l)));module.exports=p;
//# sourceMappingURL=to1source-event.cjs.js.map
