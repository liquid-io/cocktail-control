'use strict'

var EE = require('events').EventEmitter
var clone = require('clone')

function cocktailControl (defs) {
  var that = new EE()

  that.enqueue = enqueue
  that.free = free

  var jobs = []
  var count = 0

  return that

  function enqueue (job) {
    job.id = count++
    jobs.push(job)
    return this
  }

  function free (worker) {
    var wrap = defs.workers[worker]

    if (!wrap) {
      throw new Error('unknown worker')
    }

    var cocktails = wrap.cocktails
    var executable = []

    jobs.forEach(function (job) {
      var cocktail
      for (var i = 0; i < cocktails.length; i++) {
        cocktail = cocktails[i]

        if (job.cocktail !== cocktail) {
          continue
        }

        var isTaken = executable.reduce(function (acc, job) {
          return acc || job.pump === i
        }, false)

        if (isTaken) {
          continue
        }

        job.activations = clone(defs.cocktails[job.cocktail].activations)
        job.pump = i
        executable.push(job)

        break
      }
    })

    jobs = jobs.filter(function (job) {
      return executable.indexOf(job) < 0
    })

    that.emit(worker, {
      jobs: executable
    })

    return this
  }
}

module.exports = cocktailControl
