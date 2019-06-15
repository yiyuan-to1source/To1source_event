# nb-event-service

> A universal Event Service for Javascript.

## Installation

    $ npm install nb-event-service --save

This module works in browser as well as node.js
The main different between this module and the other event emitter out there is this:

**We don't care about the order of event registration and handling**

Basically you can trigger an event that doesn't exist (well, sort of, its magic)

*Please note the new version is using ES6 features heavily (WeakMap, Set, Map, Array.from etc) if you need to
use this module on older platform, please provide polyfill accordingly*

## API

#### $on(eventName, callback, context)

* eventName (string || array) now you can pass one, or many (array) to listen to multiple events.
* callback (function) it will receive the `params` that call.
* context (object|null) optional, we will pass it like this `Reflect.apply(callback, context, args)`

It will return the total number of events that get registered.

#### $once(eventName , callback, context)

* eventName (string || array) now you can pass one, or many (array) to listen to multiple events.
* callback (function) it will receive the `params` that call.
* context (object|null) optional same as above

Binded it and will get call only $once. But there is a potential problem.
This library does not care about the order of the event emitter and binding.

What that mean is - you can emit an event before it even exist.
For example:

```js
//  other library like EventEmitter

ee.emitEvent('someEvent')

ee.addListener('someEvent', function() {
  console.log('I am called')
})

```

The above example, the callback never works and you will never see the message. But our can do it:

```js

es.$trigger('someEvent') // <-- not yet exist

ee.$on('someEvent', function() {
  console.log('Hello world!')
})

```

The message will show. Now back to our problem.

```js
ee.$trigger('someEvent')

ee.$on('someEvent', function() {
  console.log('call me second')
})

ee.$once('someEvent', function() {
  console.log('call me first')
})

```

The message print out will be `call me second` because event name is first come first serve.
And `$once` will only register a callback once - and remove it after you call.

But `$on` is different. You can keep adding listener to the same event, as long as the callback is not the same.
Internally we hash the function to compare if you add the same function or not. That greatly reduce browser reload
bug. At the same time, we allow you to work in a real reactive way.

You can clone this git, and run the `npm run test:once` to see the problem.

#### $off(eventName)

* eventName (string) event to remove from internal store  

It will return

* true - event been clear
* false - such even doesn't exist

#### $trigger(eventName, params , context)

* eventName (string) this will trigger the callback that register with this `eventName` whether that actually exist or not
* params (mixed) optional - data you want to pass to your callback method
* context (object || null) optional - When we execute the callback, we will add this context to the `Reflect.apply` or default to null

This method will return

* false - if there is nothing to call
* i - the total events been called

#### $get(evt)

* return all the listeners for that particular event name from the internal store. Handy for debug.

Or it will return `false` if there is nothing

#### $call

This is an alias to `$trigger`

## Alias version

For browser you can include the `nb-event-service/dist/alias.js` for node you can `require('nb-event-service/alias')`

And that will gives you the following alias version:

- on --> $on
- once --> $once
- off --> $off
- emit --> $trigger
- get --> $get

If you don't like the `$`

## $done getter

This is a feature that you don't see in other Event Emitter library.

Whenever you execute the callback, the result will store in the internal `$done` setter.

So you can call the `$done` getter to get back the last result.

Example:

```js
es.$on('add', function add(val) {
  return val + 1;
})

es.$trigger('add', 1000)

console.log(es.$done)

```

You will get a 1001. This might be useful in some situation. Please note, it will get call
whenever a event got trigger, so if at the same time some other event trigger then your value
might be different from what you expected. So use this with caution.

## Examples

Coming soon with more update to date example.

## Test

```sh
$ npm test  
```

We use ava for testing

## Build

```sh
$ npm run build
```

It will kick start the rollup building process

---

[Joel Chu](https://joelchu.com) [NEWBRAN LTD](https://newbran.ch) (c) 2019
