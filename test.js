/* global describe, it */

var expect = require('chai').expect
var generator = require('./')

describe('raml generator', function () {
  it('should compile a specification', function () {
    var generate = generator({
      templates: {
        out: '{{@getBaseUri}}'
      }
    })

    expect(generate({
      baseUri: 'http://example.com'
    }).files.out).to.equal('http://example.com')
  })

  it('should iterate over resources', function () {
    var generate = generator({
      templates: {
        out: '{{#each @getResources}}{{#each (@getResourceMethods .)}}{{.}}{{..}}{{/each}}{{/each}}'
      }
    })

    expect(generate({
      resources: {
        '/': {
          get: null,
          post: null
        }
      }
    }).files.out).to.equal('get/post/')
  })
})
