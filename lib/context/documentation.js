var pick = require('object.pick')

/**
 * Sanitize all documentation.
 *
 * @param  {Object} documentation
 * @return {Array}
 */
module.exports = function (documentation) {
  return Array.isArray(documentation) ? documentation.map(function (item) {
    return pick(item, ['title', 'content'])
  }) : []
}
