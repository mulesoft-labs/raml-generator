var pick = require('object.pick')
var arrify = require('arrify')

/**
 * Sanitize all documentation.
 *
 * @param  {Object} documentation
 * @return {Array}
 */
module.exports = function (documentation) {
  return arrify(documentation).map(function (item) {
    return pick(item, ['title', 'content'])
  })
}
