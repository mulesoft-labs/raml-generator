var extend = require('xtend')
var sanitizeUri = require('./uri')
var sanitizeSecurity = require('./security')
var sanitizeResources = require('./resources')
var sanitizeParameters = require('./parameters')
var sanitizeDocumentation = require('./documentation')

/**
 * Validate (and sanitize) the passed in spec object.
 *
 * @param  {Obejct} spec
 * @return {Obejct}
 */
function validateSpec (spec) {
  // Reset the id generations.
  var paramIds = {}

  return extend(spec, {
    format: extend({
      uniqueId: function (prefix) {
        var id = ++paramIds[prefix] || (paramIds[prefix] = 0)

        return prefix + id
      }
    }, spec && spec.format)
  })
}

/**
 * Flatten the resources object tree into an array.
 *
 * @param  {Object} resources
 * @return {Array}
 */
function flattenResources (resources) {
  var array = []

  // Recursively push all resources into a single flattened array.
  function recurse (resource) {
    array.push(resource)

    Object.keys(resource.children).forEach(function (key) {
      recurse(resource.children[key])
    })
  }

  recurse(resources)

  return array
}

/**
 * Flatten the resources object into an array of methods.
 *
 * @param  {Object} resources
 * @return {Array}
 */
function flattenMethods (resources) {
  var array = []

  // Recursively push all methods into a single flattened array.
  function recurse (resource) {
    if (resource.methods) {
      Object.keys(resource.methods).forEach(function (key) {
        array.push(resource.methods[key])
      })
    }

    Object.keys(resource.children).forEach(function (key) {
      recurse(resource.children[key])
    })
  }

  recurse(resources)

  return array
}

/**
 * Create a context object for the templates to use during compilation.
 *
 * @param  {Object} ast
 * @param  {Object} spec
 * @return {Object}
 */
module.exports = function (ast, opts) {
  var spec = validateSpec(opts)
  var security = sanitizeSecurity(ast.securitySchemes, spec)

  // Create an empty context object.
  var context = {
    id: spec.format.uniqueId('client'),
    title: ast.title || 'API Client',
    version: ast.version,
    baseUri: sanitizeUri(ast.baseUri, spec),
    security: security,
    resources: sanitizeResources(ast.resources, spec, security),
    baseUriParameters: sanitizeParameters(ast.baseUriParameters, spec),
    documentation: sanitizeDocumentation(ast.documentation)
  }

  context.allMethods = flattenMethods(context.resources)
  context.allResources = flattenResources(context.resources)
  context.supportedMethods = require('methods')

  return context
}
