'use strict'

var EE = require('events').EventEmitter
var clone = require('clone')
var fastparallel = require('fastparallel')
var JOBS = 'JOBS::'

function cocktailControl (db, defs) {
  var that = new EE()
  var parallel = fastparallel()

  that.enqueue = deferredEnqueue
  that.free = deferredFree

  var jobs = []
  var count = 0
  var deferred = []

  that.queue = jobs

  var stream = db.createValueStream({
    gt: JOBS,
    lt: JOBS + '\xff',
    valueEncoding: 'json'
  })

  stream.on('data', function (job) {
    count = job.id
    jobs.push(job)
  })

  stream.on('end', function () {
    that.enqueue = enqueue
    that.free = free

    parallel(that, function (task, cb) {
      this[task.method](task.job, function (err) {
        if (task.cb) {
          task.cb(err)
        }
        cb(err)
      })
    }, deferred, function (err) {
      if (err) {
        that.emit('error', err)
      }

      that.emit('ready')
    })
  })

  return that

  function deferredEnqueue (job, cb) {
    deferred.push({ method: 'enqueue', job: job, cb: cb })
    return this
  }

  function deferredFree (worker, cb) {
    deferred.push({ method: 'free', job: worker, cb: cb })
    return this
  }

  function enqueue (job, cb) {
    job.id = count++
    jobs.push(job)
    db.put(JOBS + job.id, job, {
      valueEncoding: 'json'
    }, cb)
    return this
  }

  function free (worker, cb) {
    var wrap = defs.workers[worker]

    if (!wrap) {
      throw new Error('unknown worker')
    }

    var cocktails = wrap.cocktails
    var executables = []

    jobs.forEach(function (job) {
      var cocktail
      for (var i = 0; i < cocktails.length; i++) {
        cocktail = cocktails[i]

        if (job.cocktail !== cocktail) {
          continue
        }

        var isTaken = executables.reduce(function (acc, job) {
          return acc || job.pump === i
        }, false)

        if (isTaken) {
          continue
        }

        job.activations = clone(defs.cocktails[job.cocktail].activations)
        job.pump = i
        executables.push(job)

        break
      }
    })

    db.batch(executables.map(function (job) {
      return {
        type: 'del',
        key: JOBS + job.id
      }
    }), cb)
    
    // splice the new exectuables from the jobs queue. :D
    executables.forEach(function(executable){
      jobs.splice(jobs.indexOf(executable), 1);
    })

    if (executables.length > 0) {
      that.emit(worker, {
        jobs: executables
      })
    }

    return this
  }
}

module.exports = cocktailControl
