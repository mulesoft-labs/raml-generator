import Promise = require('any-promise')
import thenify = require('thenify')
import { dirname, resolve } from 'path'
import { loadApi } from 'raml-1-parser'
import yargs = require('yargs')
import mkdrp = require('mkdirp')
import fs = require('fs')
import parseJson = require('parse-json')
import { Generator, Files, GeneratorResult } from './index'

const mkdirp = thenify(mkdrp)
const readFile = thenify<string, string, string>(fs.readFile)
const writeFile = thenify<string, any, void>(fs.writeFile)

/**
 * Simple `package.json` interface.
 */
export interface Pkg {
  name: string
  description: string
  version: string
}

/**
 * Run the `bin` command for a consumer of the generator.
 */
export function bin (generator: Generator, pkg: Pkg, argv: string[]): Promise<void> {
  const cwd = process.cwd()

  interface Args {
    include: string[]
    data: string
    out: string
    expand: boolean
  }

  const args = yargs
    .usage(`${pkg.description}\n\n$0 api.raml --out [directory]`)
    .version(pkg.version, 'version')
    .demand('o')
    .alias('o', 'out')
    .describe('o', 'Out directory')
    .alias('d', 'data')
    .describe('d', 'Path to JSON configuration file')
    .array('include')
    .alias('i', 'include')
    .describe('i', 'Include additional RAML files (E.g. extensions)')
    .alias('e', 'expand')
    .describe('e', 'Expand libraries')
    .parse<Args>(argv)

  return loadApi(args._[2], args.include || [], { rejectOnErrors: true })
    .then(function (api: any) {
      const json = api.expand(args.expand ? true : false).toJSON()

      if (args.data == null) {
        return Promise.resolve(generator(json))
      }

      const path = resolve(cwd, args.data)

      return readFile(path, 'utf8')
        .then(contents => parseJson(contents, null, path))
        .then(data => generator(json, data))
    })
    .then(function (output: GeneratorResult) {
      return objectToFs(resolve(cwd, args.out), output.files)
    })
    .then(function () {
      process.exit(0)
    })
    .catch(function (err: any) {
      if (err.parserErrors) {
        err.parserErrors.forEach((parserError: any) => {
          console.error(`${parserError.path} (${parserError.line + 1}, ${parserError.column + 1}): ${parserError.message}`)
        })
      }

      console.error(err.stack || err.message || err)
      process.exit(1)
    })
}

/**
 * Save on object structure to the file system.
 */
function objectToFs (path: string, object: Files) {
  return Object.keys(object).reduce(
    function (promise, file) {
      const content = object[file]
      const filename = resolve(path, file)
      const output = dirname(filename)

      return promise
        .then(function () {
          return mkdirp(output)
        })
        .then(function () {
          return writeFile(filename, content)
        })
    },
    mkdirp(path).then(() => undefined)
  )
}
