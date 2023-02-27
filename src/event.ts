// the core event class
import type {
  ClassConfig,
  ContextType,
  CallbackType,
  EvtName,
  StoreContent,
  StoreContentType
} from './lib/types'

import {
  ON_TYPE,
  ONLY_TYPE,
  ONCE_TYPE,
  ONLY_ONCE_TYPE,
  TAKEN_BY_OTHER_TYPE_ERR,
  NEG_RETURN
} from './lib/constants'
import { isInt } from './lib/utils'

import { BaseClass } from './base'
import { StoresClass } from './stores'

// def
export class EventClass extends BaseClass {

  protected $store: StoresClass

  constructor(config: ClassConfig) {
    super(config)
    // init the store engine
    this.$store = new StoresClass(config)
  }

  /**
   * Register your evt handler, note we don't check the type here,
   * we expect you to be sensible and know what you are doing.
   */
  $on<T, S> (
    evt: EvtName,
    callback: CallbackType<T, S>,
    context: ContextType = null
  ) {
    const type = ON_TYPE
    this._validate(evt, callback)
    // first need to check if this evt is in lazy store
    const lazyStoreContent = this.$store.takeFromStore(evt)
    // this is normal register first then call later
    if (lazyStoreContent === false) {
      this.logger(`($on) "${String(evt)}" is not in lazy store`)
      // @TODO we need to check if there was other listener to this
      // event and are they the same type then we could solve that
      // register the different type to the same event name
      return this.$store.addToNormalStore(evt, type, callback, context)
    }
    this.logger(`($on) ${String(evt)} found in lazy store`)
    // this is when they call $trigger before register this callback
    // @ts-ignore the number is callable?
    let size = 0
    (lazyStoreContent as unknown as StoreContentType)
      .forEach((content: Array<unknown>) => {
        const [payload, ctx, t] = content
        if (t && t !== type) {
          throw new Error(`${TAKEN_BY_OTHER_TYPE_ERR} ${t}`)
        }
        this.logger('($on)', `call run "${String(evt)}"`)
        // @ts-ignore @TODO
        this._run(callback, payload, context || ctx)
        size += this.$store.addToNormalStore(evt, type, callback, context || ctx)
    })
    this.logger(`($on) return size ${size}`)
    return size
  }

  /**
   * once only registered it once, there is no overwrite option here
   * @NOTE change in v1.3.0 $once can add multiple listeners
   *       but once the event fired, it will remove this event (see $only)
   */
  $once<T, S> (
    evt: EvtName,
    callback: CallbackType<T, S>,
    context: ContextType = null
  ) {
    this._validate(evt, callback)
    const lazyStoreContent = this.$store.takeFromStore(evt)
    // this is normal register before call $trigger
    // let nStore = this.normalStore
    if (lazyStoreContent === false) {
      this.logger(`($once) "${String(evt)}" is not in the lazy store`)
      // v1.3.0 $once now allow to add multiple listeners
      return this.$store.addToNormalStore(evt, ONCE_TYPE, callback, context)
    } else {
      // now this is the tricky bit
      // there is a potential bug here that cause by the developer
      // if they call $trigger first, the lazy won't know it's a once call
      // so if in the middle they register any call with the same evt name
      // then this $once call will be fucked - add this to the documentation
      this.logger('($once)', lazyStoreContent)
      const list = Array.from(lazyStoreContent as unknown as StoreContent)
      // should never have more than 1
      const [payload, ctx, t] = list[0] as Array<StoreContentType>
      if (t && t !== ONCE_TYPE) {
        throw new Error(`${TAKEN_BY_OTHER_TYPE_ERR} ${t}`)
      }
      this.logger('($once)', `call run "${String(evt)}"`)
      // @ts-ignore
      this._run(callback, payload, context || ctx)
      // remove this evt from store
      this.$off(evt)
    }
  }

  /**
   * This one event can only bind one callbackback
   */
  $only<T, S> (
    evt: EvtName,
    callback: CallbackType<T, S>,
    context: ContextType = null
  ) {
    this._validate(evt, callback)
    let added = false
    const lazyStoreContent = this.$store.takeFromStore(evt)
    // this is normal register before call $trigger
    if (!this.$store.has(evt)) {
      this.logger(`($only) "${String(evt)}" add to normalStore`)
      added = this.$store.addToNormalStore(evt, ONLY_TYPE, callback, context)
    }
    if (lazyStoreContent !== false) {
      // there are data store in lazy store
      this.logger(`($only) "${String(evt)}" found data in lazy store to execute`)
      const list = Array.from(lazyStoreContent as unknown as Array<StoreContentType>)
      // $only allow to trigger this multiple time on the single handler
      list.forEach(li => {
        const [payload, ctx, t] = li as unknown as Array<unknown>
        if (t && t !== ONLY_TYPE) {
          throw new Error(`${TAKEN_BY_OTHER_TYPE_ERR} ${t}`)
        }
        this.logger(`($only) call run "${String(evt)}"`)
        // @ts-ignore
        this._run(callback, payload, context || ctx)
      })
    }
    return added
  }

  /**
   * $only + $once this is because I found a very subtile bug when we pass a
   * resolver, rejecter - and it never fire because that's OLD added in v1.4.0
   */
  $onlyOnce<T, S> (
    evt: EvtName,
    callback: CallbackType<T, S>,
    context: ContextType = null
  ) {
    this._validate(evt, callback)
    let added = false
    const lazyStoreContent = this.$store.takeFromStore(evt)
    // this is normal register before call $trigger
    if (!this.$store.has(evt)) {
      this.logger(`($onlyOnce) "${String(evt)}" add to normalStore`)
      added = this.$store.addToNormalStore(evt, ONLY_ONCE_TYPE, callback, context)
    }
    if (lazyStoreContent !== false) {
      // there are data store in lazy store
      this.logger('($onlyOnce)', lazyStoreContent)
      const list = Array.from(lazyStoreContent as unknown as Array<StoreContentType>)
      // should never have more than 1
      const [payload, ctx, t] = list[0] as unknown as Array<unknown>
      if (t && t !== ONLY_ONCE_TYPE) {
        throw new Error(`${TAKEN_BY_OTHER_TYPE_ERR} ${t}`)
      }
      this.logger(`($onlyOnce) call run "${String(evt)}"`)
      // @ts-ignore
      this._run(callback, payload, context || ctx)
      // remove this evt from store
      this.$off(evt)
    }
    return added
  }

  /**
   * change the way how it suppose to work, instead of create another new store
   * We perform this check on the trigger end, so we set the number max
   * whenever we call the callback, we increment a value in the store
   * once it reaches that number we remove that event from the store,
   * also this will not get add to the lazy store,
   * which means the event must register before we can fire it
   * therefore we don't have to deal with the backward check
   */
  $max (
    evtName: EvtName,
    max: number,
    ctx: ContextType = null
  ) {
    this._validateEvt(evtName)
    if (isInt(max) && max > 0) {
      // find this in the normalStore
      const fnSet = this.$get(evtName, true)
      if (fnSet !== false) {
        const evts = this.$store.searchMapEvt(evtName)
        if (evts.length) {
          // should only have one anyway
          const [,,, type] = evts[0]
          // now init the max store
          this.$store.checkMaxStore(evtName, max)
          // this.logger('$max value', value)
          const _self = this
          /**
           * construct the callback
           */
          return function executeMaxCall (...args: Array<unknown>) {
            const ctn = _self.$store.getMaxStore(evtName)
            let value = NEG_RETURN
            if (ctn > 0) {
              const fn = _self.$call(evtName, type, ctx)
              Reflect.apply(fn, _self, args)

              value = _self.$store.checkMaxStore(evtName)
              if (value === NEG_RETURN) {
                _self.$off(evtName)
                return NEG_RETURN
              }
            }
            return value
          }
        }
      }
      // change in 1.1.1 because we might just call it without knowing if it's register or not
      this.logger(`The ${String(evtName)} is not registered, can not execute non-existing event at the moment`)
      return NEG_RETURN
    }
    throw new Error(`Expect max to be an integer and greater than zero! But we got [${typeof max}]${max} instead`)
  }

  /**
   * This is a shorthand of $off + $on added in V1.5.0
   */
  $replace<T, S> (
    evt: EvtName,
    callback: CallbackType<T, S>,
    context: ContextType = null,
    type: string = ON_TYPE
  ) {
    if (this._validateEvtType(type)) {
      this.$off(evt)
      // @ts-ignore @TODO map all keys
      const method = this[('$' + type)]
      this.logger('($replace)', evt, callback)
      return Reflect.apply(method, this, [evt, callback, context])
    }
    throw new Error(`${type} is not supported!`)
  }

  /**
   * trigger the event
   * @param {string} evt name NOT allow array anymore!
   * @param {mixed} [payload = []] pass to fn
   * @param {object|string} [context = null] overwrite what stored
   * @param {string} [type=false] if pass this then we need to add type to store too
   * @return {number} if it has been execute how many times
   */
  $trigger (
    evt: EvtName,
    payload: Array<unknown> = [],
    context: ContextType = null,
    type: string | boolean = false
  ) {
    this._validateEvt(evt)
    let found = 0
    // first check the normal store
    this.logger('($trigger) normalStore', nStore)
    if (this.$store.has(evt)) {
      this.logger(`($trigger) "${String(evt)}" found`)
      // @1.8.0 to add the suspend queue
      const added = this.$queue(evt, payload, context, type)
      if (added) {
        this.logger(`($trigger) Currently suspended "${String(evt)}" added to queue, nothing executed. Exit now.`)
        return false // not executed
      }
      const nSet = Array.from(nStore.get(evt))
      const ctn = nSet.length
      let hasOnce = false
      // let hasOnly = false
      for (let i = 0; i < ctn; ++i) {
        ++found
        // this.logger('found', found)
        const [, callback, ctx, _type] = nSet[i]
        this.logger(`($trigger) call run for ${type}:${evt}`)
        this._run(callback, payload, context || ctx)
        if (_type === 'once' || _type === 'onlyOnce') {
          hasOnce = true
        }
      }
      if (hasOnce) {
        nStore.delete(evt)
      }
      return found
    }
    // now this is not register yet
    this.addToLazyStore(evt, payload, context, type)
    return found
  }

  /**
   * this is an alias to the $trigger - with a different, it returns a fn to call
   * @NOTE breaking change in V1.6.0 we swap the parameter around
   * @NOTE breaking change: v1.9.1 it return an function to accept the params as spread
   * @param {string} evt event name
   * @param {string} type of call
   * @param {object} context what context callback execute in
   * @return {*} from $trigger
   */
  $call (evt, type = false, context = null) {
    const ctx = this
    return function executeCall (...args) {
      const _args = [evt, args, context, type]
      return Reflect.apply(ctx.$trigger, ctx, _args)
    }
  }

  /**
   * remove the evt from all the stores
   * @param {string} evt name
   * @return {boolean} true actually delete something
   */
  $off (evt) {
    // @TODO we will allow a regex pattern to mass remove event
    this._validateEvt(evt)
    const stores = [this.lazyStore, this.normalStore]

    return !!stores
      .filter(store => store.has(evt))
      .map(store => this.removeFromStore(evt, store))
      .length
  }

  /**
   * return all the listener bind to that event name
   * @param {string} evtName event name
   * @param {boolean} [full=false] if true then return the entire content
   * @return {array|boolean} listerner(s) or false when not found
   */
  $get (evt, full = false) {
    // @TODO should we allow the same Regex to search for all?
    this._validateEvt(evt)
    const store = this.normalStore
    return this.findFromStore(evt, store, full)
  }

  /**
   * store the return result from the run
   * @param {*} value whatever return from callback
   */
  set $done (value) {
    this.logger('($done) set value: ', value)
    if (this.keep) {
      this.result.push(value)
    } else {
      this.result = value
    }
  }

  /**
   * @TODO is there any real use with the keep prop?
   * getter for $done
   * @return {*} whatever last store result
   */
  get $done () {
    this.logger('($done) get result:', this.result)
    if (this.keep) {
      return this.result[this.result.length - 1]
    }
    return this.result
  }

  /**
   * Take a look inside the stores
   * @param {number|null} idx of the store, null means all
   * @return {void}
   */
  $debug (idx = null) {
    const names = ['lazyStore', 'normalStore']
    const stores = [this.lazyStore, this.normalStore]
    if (stores[idx]) {
      this.logger(names[idx], stores[idx])
    } else {
      stores.map((store, i) => {
        this.logger(names[i], store)
      })
    }
  }

}