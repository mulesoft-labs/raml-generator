var parser = require('raml-1-parser')
var join = require('path').join
var assert = require('assert')

parser.loadApi(join(__dirname, 'overlay.raml'))
  .then(function (api) {
    console.log(JSON.stringify(api.toJSON(), null, 2))
  })
  .catch(function (err) {
    console.log(err)
    process.exit(1)
  })
