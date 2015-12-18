import test = require('blue-tape')
import { generator } from './index'

test('raml generator', t => {
  t.test('basic generator', t => {
    const generate = generator({
      templates: {
        'test.js': function () {
          return 'success'
        }
      }
    })

    t.deepEqual(generate({}).files, { 'test.js': 'success' })

    t.end()
  })
})
