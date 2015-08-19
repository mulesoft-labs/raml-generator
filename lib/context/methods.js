var pick = require('object.pick')
var arrify = require('arrify')
var extend = require('xtend')
var sanitizeParameters = require('./parameters')

/**
 * Sanitize a method into a flatter, more readable structure.
 *
 * @param  {Object} method
 * @param  {Object} resource
 * @param  {Object} spec
 * @return {Object}
 */
function sanitizeMethod (method, resource, spec, security) {
  // Pick only the usable properties.
  var obj = pick(method, [
    'method',
    'protocols',
    'responses',
    'body',
    'headers'
  ])

  // Attach a unique id to every method.
  obj.id = spec.format.uniqueId('method')
  obj.resource = resource
  obj.queryParameters = sanitizeParameters(method.queryParameters)
  obj.description = (method.description || '').trim()
  obj.displayName = (method.displayName || '').trim()

  // Array of securedBy schemes and merged `securitySchemes` objects.
  obj.securedBy = []
  obj.security = {}

  arrify(method.securedBy).forEach(function (securedBy) {
    if (securedBy == null) {
      obj.securedBy.push(null)
      return
    }

    if (typeof securedBy === 'string') {
      obj.securedBy.push(securedBy)
      obj.security[securedBy] = security[securedBy]
      return
    }

    // Merge settings when using object notation.
    Object.keys(securedBy).forEach(function (key) {
      obj.securedBy.push(key)
      obj.security[key] = extend(security[key])
      obj.security[key].settings = extend(obj.security[key].settings, securedBy[key])
    })
  })

  // TODO: Automatically infer content-type header from body.

  return obj
}

/**
 * Sanitize a methods array into a more reusable object.
 *
 * @param  {Array}  methods
 * @param  {Object} resource
 * @param  {Object} spec
 * @return {Object}
 */
module.exports = function (methods, resource, spec, security) {
  var obj = {}

  if (!methods) {
    return obj
  }

  methods.forEach(function (method) {
    var verb = method.method
    var sanitizedMethod = sanitizeMethod(method, resource, spec, security)

    obj[verb] = sanitizedMethod
    sanitizedMethod.key = verb
  })

  return obj
}
