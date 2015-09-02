'use strict'

var test = require('tape')
var control = require('./')
var level = require('level')
var tmp = require('tmp')
var parallel = require('fastparallel')()

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

test('work some cocktails', function (t) {
  t.plan(3)

  var dir = tmp.dirSync()
  var db = level(dir.name)
  var robot = control(db, defs)

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

  robot.once('bob', function (cocktails) {
    t.deepEqual(cocktails, {
      jobs: [{
        id: 0,
        name: 'Matteo',
        cocktail: 'spritz',
        pump: 1,
        activations: defs.cocktails.spritz.activations
      }, {
        id: 3,
        name: 'David',
        cocktail: 'bloody',
        pump: 0,
        activations: defs.cocktails.bloody.activations
      }]
    }, 'cocktails enqueued to bob matches')

    // this would be async in the real world
    setImmediate(robot.free.bind(robot, 'bob'))

    robot.once('bob', function (cocktails) {
      t.deepEqual(cocktails, {
        jobs: [{
          id: 4,
          name: 'Richard',
          cocktail: 'bloody',
          pump: 0,
          activations: defs.cocktails.bloody.activations
        }]
      }, 'cocktails enqueued to bob matches')

      // this would be async in the real world
      setImmediate(robot.free.bind(robot, 'bob'))
    })
  })

  robot.once('mark', function (cocktails) {
    t.deepEqual(cocktails, {
      jobs: [{
        id: 1,
        name: 'Cian',
        cocktail: 'spritz',
        pump: 0,
        activations: defs.cocktails.spritz.activations
      }, {
        id: 2,
        name: 'Tammy',
        cocktail: 'spritz',
        pump: 1,
        activations: defs.cocktails.spritz.activations
      }]
    }, 'cocktails enqueued to mark matches')

    // this would be async in the real world
    setImmediate(robot.free.bind(robot, 'mark'))
  })

  // kick off processing
  robot.free('bob') // let says that bob is free
  robot.free('mark') // let says that mark is free
})

test('restore state', function (t) {
  t.plan(3)

  var dir = tmp.dirSync()
  var db = level(dir.name)
  var robot = control(db, defs)

  parallel(null, function (job, cb) {
    robot.enqueue(job, cb)
  }, [{
    cocktail: 'spritz',
    name: 'Matteo'
  }, {
    cocktail: 'spritz',
    name: 'Cian'
  }, {
    cocktail: 'spritz',
    name: 'Tammy'
  }, {
    cocktail: 'bloody',
    name: 'David'
  }, {
    cocktail: 'bloody',
    name: 'Richard'
  }], function done () {

    var robot = control(db, defs)

    robot.once('bob', function (cocktails) {
      t.deepEqual(cocktails, {
        jobs: [{
          id: 0,
          name: 'Matteo',
          cocktail: 'spritz',
          pump: 1,
          activations: defs.cocktails.spritz.activations
        }, {
          id: 3,
          name: 'David',
          cocktail: 'bloody',
          pump: 0,
          activations: defs.cocktails.bloody.activations
        }]
      }, 'cocktails enqueued to bob matches')

      // this would be async in the real world
      setImmediate(robot.free.bind(robot, 'bob'))

      robot.once('bob', function (cocktails) {
        t.deepEqual(cocktails, {
          jobs: [{
            id: 4,
            name: 'Richard',
            cocktail: 'bloody',
            pump: 0,
            activations: defs.cocktails.bloody.activations
          }]
        }, 'cocktails enqueued to bob matches')

        // this would be async in the real world
        setImmediate(robot.free.bind(robot, 'bob'))
      })
    })

    robot.once('mark', function (cocktails) {
      t.deepEqual(cocktails, {
        jobs: [{
          id: 1,
          name: 'Cian',
          cocktail: 'spritz',
          pump: 0,
          activations: defs.cocktails.spritz.activations
        }, {
          id: 2,
          name: 'Tammy',
          cocktail: 'spritz',
          pump: 1,
          activations: defs.cocktails.spritz.activations
        }]
      }, 'cocktails enqueued to mark matches')

      // this would be async in the real world
      setImmediate(robot.free.bind(robot, 'mark'))
    })

    robot.on('ready', function () {
      // kick off processing
      robot.free('bob') // let says that bob is free
      robot.free('mark') // let says that mark is free
    })
  })
})
