# cocktail-control&nbsp;&nbsp;[![Build Status](https://travis-ci.org/mcollina/cocktail-control.png)](https://travis-ci.org/mcollina/cocktail-control)

The control logic for some bots that makes cocktail

## Install

```
npm i level @matteo.collina/cocktail-control --save
```

## Example

```js
var level = require('level')
var control = require('@matteo.collina/cocktail-control')
var cocktails = {
  bloody: {
    activations: [
      20, // milleseconds
      10,
      50
    ]
  },
  spritz: {
    activations: [
      10, // milleseconds
      20,
      30
    ]
  }
}
var defs = {
  cocktails: cocktails,
  workers: {
    bob: {
      cocktails: ['bloody', 'spritz']
    },
    mark: {
      cocktails: ['spritz', 'spritz']
    }
  }
}

// the leveldb is used for persitence
var db = level(dir.name)
var robot = control(db, defs)

// enqueue also accepts a callback
robot.enqueue({
  cocktail: 'spritz',
  name: 'Matteo'
}).enqueue({
  cocktail: 'spritz',
  name: 'Cian'
}).enqueue({
  cocktail: 'spritz',
  name: 'Tammy'
}).enqueue({
  cocktail: 'bloody',
  name: 'David'
}).enqueue({
  cocktail: 'bloody',
  name: 'Richard'
})

robot.on('bob', function (cocktails) {
  console.log('bob making', cocktails)

  // this would be async in the real world
  setImmediate(robot.free.bind(robot, 'bob'))
})

robot.on('mark', function (cocktails) {
  console.log('mark making', cocktails)

  // this would be async in the real world
  setImmediate(robot.free.bind(robot, 'mark'))
})

// kick off processing of cocktails
robot.free('bob') // let says that bob is free
robot.free('mark') // let says that mark is free
```

## Acknowledgements

This library was built for [NodeConf.eu](http://nodeconf.eu), and it was
sponsored by [nearForm](http://nearform.com)

## License

MIT
