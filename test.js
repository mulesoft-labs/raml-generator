/* global describe, it */

var expect = require('chai').expect
var generator = require('./')
var context = require('./lib/context')

describe('raml generator', function () {
  it('should compile a specification', function () {
    var generate = generator({
      templates: {
        out: '{{baseUri}}'
      }
    })

    expect(generate({
      baseUri: 'http://example.com'
    }).files.out).to.equal('http://example.com')
  })

  it('should iterate over resources', function () {
    var generate = generator({
      templates: {
        out: '{{#each allResources}}{{#each methods}}{{@key}}{{/each}}{{/each}}'
      }
    })

    expect(generate({
      resources: [{
        relativeUri: '/',
        methods: [
          { method: 'get' },
          { method: 'post' }
        ]
      }]
    }).files.out).to.equal('getpost')
  })

  it('should support partially conflicting top level resources', function () {
    var generate = generator({
      templates: {
        out: '{{#each allResources}}{{relativeUri}} {{originalRelativeUri}}\n{{/each}}'
      }
    })

    expect(generate({
      resources: [{
        relativeUri: '/test'
      }, {
        relativeUri: '/test/{id}'
      }, {
        relativeUri: '/test/{id}/test'
      }]
    }).files.out).to.equal([
      ' ',
      '/test /test',
      '/{0} /{id}',
      '/test /test',
      ''
    ].join('\n'))
  })

  it('should support absolute uris', function () {
    var generate = generator({
      templates: {
        out: '{{#each allResources}}{{absoluteUri}} {{originalAbsoluteUri}}\n{{/each}}'
      }
    })

    expect(generate({
      resources: [{
        relativeUri: '/test'
      }, {
        relativeUri: '/test/{id}'
      }, {
        relativeUri: '/test/{id}/test'
      }]
    }).files.out).to.equal([
      ' ',
      '/test /test',
      '/test/{0} /test/{id}',
      '/test/{0}/test /test/{id}/test',
      ''
    ].join('\n'))
  })

  describe('helpers', function () {
    describe('json', function () {
      it('should stringify', function () {
        var generate = generator({
          templates: {
            out: '{{json baseUri}}'
          }
        })

        expect(generate({
          baseUri: 'http://example.com'
        }).files.out).to.equal('"http://example.com"')
      })
    })
  })

  describe('context', function () {
    it('should add security to methods', function () {
      var obj = context({
        title: 'Test API',
        securitySchemes: [{
          oauth_2_0: {
            type: 'OAuth 2.0',
            settings: {
              authorizationUri: 'https://example.com/oauth/authorize',
              scopes: ['profile', 'history']
            }
          }
        }],
        resources: [{
          relativeUri: '/users',
          methods: [{
            method: 'get',
            securedBy: [null, { oauth_2_0: { scopes: ['admin'] } }]
          }]
        }]
      })

      expect(obj.allMethods).to.have.length(1)
      expect(obj.allResources).to.have.length(2)

      var method = obj.allMethods[0]

      expect(method.securedBy).to.deep.equal([null, 'oauth_2_0'])
      expect(method.security).to.deep.equal({
        oauth_2_0: {
          type: 'OAuth 2.0',
          settings: {
            authorizationUri: 'https://example.com/oauth/authorize',
            scopes: ['admin']
          }
        }
      })
    })
  })
})
