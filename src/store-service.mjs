// break up the main file because its getting way too long
import {
  NB_EVENT_SERVICE_PRIVATE_STORE,
  NB_EVENT_SERVICE_PRIVATE_LAZY
} from './store.mjs'
import {
  NEG_RETURN,
  ON_MAX_TYPES
} from './constants.mjs'
import { isInt, inArray } from './utils.mjs'
// import SuspendClass from './suspend.mjs'
import BaseClass from './base.mjs'

// @TODO need to decoup this and make it standalone
export default class StoreService extends BaseClass {
  constructor (config = {}) {
    super(config)

    this.keep = config.keep
    // for the $done setter
    this.result = config.keep ? [] : null
    // we need to init the store first otherwise it could be a lot of checking later
    this.normalStore = new Map()
    this.lazyStore = new Map()
    // this is the new throw away map
    this.maxCountStore = new Map()
  }

  /**
   * We need this to pre-check the store, otherwise
   * the execution will be unable to determine the number of calls
   * @param {string} evtName event name
   * @return {number} the count of this store
   * @protected
   */
  getMaxStore (evtName) {
    return this.maxCountStore.get(evtName) || NEG_RETURN
  }

  /**
   * This is one stop shop to check and munipulate the maxStore
   * @param {*} evtName
   * @param {*} [max=null]
   * @return {number} when return -1 means removed
   * @protected
   */
  checkMaxStore (evtName, max = null) {
    this.logger('===========================================')
    this.logger('checkMaxStore start', evtName, max)
    // init the store
    if (max !== null && isInt(max)) {
      // because this is the setup phrase we just return the max value
      this.maxCountStore.set(evtName, max)
      this.logger(`Setup max store for ${evtName} with ${max}`)
      return max
    }
    if (max === null) {
      // first check if this exist in the maxStore
      let value = this.getMaxStore(evtName)
      this.logger('getMaxStore value', value)
      if (value !== NEG_RETURN) {
        if (value > 0) {
          --value
        }
        if (value > 0) {
          this.maxCountStore.set(evtName, value) // just update the value
        } else {
          this.maxCountStore.delete(evtName) // just remove it
          this.logger(`remove ${evtName} from maxStore`)
          return NEG_RETURN
        }
      }
      return value
    }
    throw new Error(`Expect max to be an integer, but we got ${typeof max} ${max}`)
  }

  /**
   * Wrap several get filter ops together to return the callback we are looking for
   * @param {string} evtName to search for
   * @return {array} empty array when not found
   */
  searchMapEvt (evtName) {
    const evts = this.$get(evtName, true) // return in full
    const search = evts.filter(result => {
      const [,,, type] = result
      return inArray(ON_MAX_TYPES, type)
    })
    return search.length ? search : []
  }

  /**
   * Take the content out and remove it from store id by the name
   * @param {string} evt event name
   * @param {string} [storeName = lazyStore] name of store
   * @return {object|boolean} content or false on not found
   */
  takeFromStore (evt, storeName = 'lazyStore') {
    const store = this[storeName] // it could be empty at this point
    if (store) {
      this.logger('(takeFromStore)', storeName, store)
      if (store.has(evt)) {
        const content = store.get(evt)
        this.logger(`(takeFromStore) has "${evt}"`, content)
        store.delete(evt)
        return content
      }
      return false
    }
    throw new Error(`"${storeName}" is not supported!`)
  }

  /**
   * This was part of the $get. We take it out
   * so we could use a regex to remove more than one event
   * @param {object} store the store to return from
   * @param {string} evt event name
   * @param {boolean} full return just the callback or everything
   * @return {array|boolean} false when not found
   */
  findFromStore (evt, store, full = false) {
    if (store.has(evt)) {
      return Array
        .from(store.get(evt))
        .map(list => {
          if (full) {
            return list
          }
          const [, callback] = list
          return callback
        })
    }
    return false
  }

  /**
   * Similar to the findFromStore, but remove
   * @param {string} evt event name
   * @param {object} store the store to remove from
   * @return {boolean} false when not found
   */
  removeFromStore (evt, store) {
    if (store.has(evt)) {
      this.logger('($off)', evt)
      store.delete(evt)
      return true
    }
    return false
  }

  /**
   * Take out from addToStore for reuse
   * @param {object} store the store to use
   * @param {string} evt event name
   * @return {object} the set within the store
   */
  getStoreSet (store, evt) {
    let fnSet
    if (store.has(evt)) {
      this.logger(`(addToStore) "${evt}" existed`)
      fnSet = store.get(evt)
    } else {
      this.logger(`(addToStore) create new Set for "${evt}"`)
      // this is new
      fnSet = new Set()
    }
    return fnSet
  }

  /**
   * The add to store step is similar so make it generic for resuse
   * @param {object} store which store to use
   * @param {string} evt event name
   * @param {spread} args because the lazy store and normal store store different things
   * @return {array} store and the size of the store
   */
  addToStore (store, evt, ...args) {
    const fnSet = this.getStoreSet(store, evt)
    // lazy only store 2 items - this is not the case in V1.6.0 anymore
    // we need to check the first parameter is string or not
    if (args.length > 2) {
      if (Array.isArray(args[0])) { // lazy store
        // check if this type of this event already register in the lazy store
        const [,, type] = args
        if (!this.checkTypeInLazyStore(evt, type)) {
          fnSet.add(args)
        }
      } else {
        if (!this.checkContentExist(args, fnSet)) {
          this.logger('(addToStore) insert new', args)
          fnSet.add(args)
        }
      }
    } else { // add straight to lazy store
      fnSet.add(args)
    }
    store.set(evt, fnSet)

    return [store, fnSet.size]
  }

  /**
   * @param {array} args for compare
   * @param {object} fnSet A Set to search from
   * @return {boolean} true on exist
   */
  checkContentExist (args, fnSet) {
    const list = Array.from(fnSet)
    return !!list.filter(_list => {
      const [hash] = _list
      return hash === args[0]
    }).length
  }

  /**
   * get the existing type to make sure no mix type add to the same store
   * @param {string} evtName event name
   * @param {string} type the type to check
   * @return {boolean} true you can add, false then you can't add this type
   */
  checkTypeInStore (evtName, type) {
    this._validateEvt(evtName, type)
    const all = this.$get(evtName, true)
    if (all === false) {
      // pristine it means you can add
      return true
    }
    // it should only have ONE type in ONE event store
    return !all.filter(list => {
      const [,,, t] = list
      return type !== t
    }).length
  }

  /**
   * This is checking just the lazy store because the structure is different
   * therefore we need to use a new method to check it
   */
  checkTypeInLazyStore (evtName, type) {
    this._validateEvt(evtName, type)
    const store = this.lazyStore.get(evtName)
    this.logger('(checkTypeInLazyStore)', store)
    if (store) {
      return !!Array
        .from(store)
        .filter(li => {
          const [,, t] = li
          return t !== type
        }).length
    }
    return false
  }

  /**
   * wrapper to re-use the addToStore,
   * V1.3.0 add extra check to see if this type can add to this evt
   * @param {string} evt event name
   * @param {string} type on or once
   * @param {function} callback function
   * @param {object} context the context the function execute in or null
   * @return {number} size of the store
   */
  addToNormalStore (evt, type, callback, context = null) {
    this.logger(`(addToNormalStore) try to add "${type}" --> "${evt}" to normal store`)
    // @TODO we need to check the existing store for the type first!
    if (this.checkTypeInStore(evt, type)) {
      this.logger('(addToNormalStore)', `"${type}" --> "${evt}" can add to normal store`)

      const key = this._hashFnToKey(callback)
      const args = [this.normalStore, evt, key, callback, context, type]
      const [_store, size] = Reflect.apply(this.addToStore, this, args)
      this.normalStore = _store

      return size
    }

    return false
  }

  /**
   * Add to lazy store this get calls when the callback is not register yet
   * so we only get a payload object or even nothing
   * @param {string} evt event name
   * @param {array} payload of arguments or empty if there is none
   * @param {object} [context=null] the context the callback execute in
   * @param {string} [type=false] register a type so no other type can add to this evt
   * @return {number} size of the store
   */
  addToLazyStore (evt, payload = [], context = null, type = false) {
    // this is add in V1.6.0
    // when there is type then we will need to check if this already added in lazy store
    // and no other type can add to this lazy store
    const args = [this.lazyStore, evt, this.toArray(payload), context]
    if (type) {
      args.push(type)
    }
    const [_store, size] = Reflect.apply(this.addToStore, this, args)
    this.lazyStore = _store
    this.logger(`(addToLazyStore) size: ${size}`)

    return size
  }

  /**
   * setter to store the Set in private
   * @param {object} obj a Set
   */
  set normalStore (obj) {
    NB_EVENT_SERVICE_PRIVATE_STORE.set(this, obj)
  }

  /**
   * @return {object} Set object
   */
  get normalStore () {
    return NB_EVENT_SERVICE_PRIVATE_STORE.get(this)
  }

  /**
   * setter to store the Set in lazy store
   * @param {object} obj a Set
   */
  set lazyStore (obj) {
    NB_EVENT_SERVICE_PRIVATE_LAZY.set(this, obj)
  }

  /**
   * @return {object} the lazy store Set
   */
  get lazyStore () {
    return NB_EVENT_SERVICE_PRIVATE_LAZY.get(this)
  }
}
