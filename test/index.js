/* eslint-env node, mocha */
'use strict'
var path = require('path')
var sio = require('socket.io')
var assert = require('power-assert')
var connect = require('socket.io-client')

var wildcard = require(path.resolve(__dirname, '..'))

describe('server', function () {
  var io
  var nsp
  var client

  before(function () {
    var middleware = wildcard()
    io = sio()
    nsp = io.of('/foo')
    io.use(middleware)
    nsp.use(middleware)
    io.listen(8000)
  })

  after(function () {
    io.close()
  })

  afterEach(function () {
    client.close()
  })

  it('should work', function (done) {
    client = connect('http://localhost:8000')
    client.on('connect', function () {
      client.emit('foo', { bar: 'baz' })
    })

    io.on('connection', function (socket) {
      var seq = []

      function check (d) {
        seq.push(d)
        if (seq.length === 2) {
          assert.deepEqual(seq, ['*', 'foo'])
          done()
        }
      }

      socket.on('*', function (packet) {
        assert.equal(packet.data[0], 'foo')
        assert.deepEqual(packet.data[1], { bar: 'baz' })
        check('*')
      })

      socket.on('foo', function (data) {
        assert.deepEqual(data, { bar: 'baz' })
        check('foo')
      })
    })
  })

  it('should work within namespace', function (done) {
    client = connect('http://localhost:8000/foo')
    client.on('connect', function () {
      client.emit('foo', { bar: 'baz' })
    })

    nsp.on('connection', function (socket) {
      var seq = []

      function check (d) {
        seq.push(d)
        if (seq.length === 2) {
          assert.deepEqual(seq, ['*', 'foo'])
          done()
        }
      }

      socket.on('*', function (packet) {
        assert.equal(packet.data[0], 'foo')
        assert.deepEqual(packet.data[1], { bar: 'baz' })
        check('*')
      })

      socket.on('foo', function (data) {
        assert.deepEqual(data, { bar: 'baz' })
        check('foo')
      })
    })
  })
})

describe('client', function () {
  var io
  var client

  before(function () {
    io = sio()
    io.listen(8001)
    io.on('connection', function (socket) {
      socket.emit('foo', { bar: 'baz' })
    })
  })

  after(function () {
    io.close()
  })

  afterEach(function () {
    client.close()
  })

  it('should work', function (done) {
    var patch = wildcard(connect.Manager)
    client = connect('http://localhost:8001/')
    patch(client)

    var seq = []

    function check (d) {
      seq.push(d)
      if (seq.length === 2) {
        assert.deepEqual(seq, ['*', 'foo'])
        done()
      }
    }

    client.on('*', function (packet) {
      assert.equal(packet.data[0], 'foo')
      assert.deepEqual(packet.data[1], { bar: 'baz' })
      check('*')
    })

    client.on('foo', function (data) {
      assert.deepEqual(data, { bar: 'baz' })
      check('foo')
    })
  })
})
