import test = require('blue-tape')
import { generator } from './index'
import {join}  from 'path'
import parser = require('raml-1-parser')

test('raml generator', t => {
  t.test('basic generator', t => {
    const generate = generator({
      templates: {
        'test.js': function () {
          return 'success'
        }
      }
    });

    t.deepEqual(generate({}).files, { 'test.js': 'success' });

    t.end()
  });

  t.test('expand raml', t => {
    const musicRaml = join(__dirname, '../test/world-music-api/api.raml');

    const generate = generator({
      templates: {
        'test.js': function () {
          return 'success'
        }
      }
    });

    parser.loadApi(musicRaml).then(
      function(api: any) {
        const json = api.expand(true).toJSON();
        t.deepEqual(generate(json).files, { 'test.js': 'success' });

        t.end()
      }
    );
  })
});
