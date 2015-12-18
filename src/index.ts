export type Api = any
export type Data = any

/**
 * The template functions, from the user.
 */
export interface Templates {
  [name: string]: (api: Api, data: Data) => string
}

/**
 * A files object, should be returned by the user.
 */
export interface Files {
  [filename: string]: string
}

/**
 * Generation options.
 */
export interface Options {
  templates: Templates
  generate?: (templates: Templates, api: Api, data: Data) => Files
}

/**
 * The result of any generator function.
 */
export interface GeneratorResult {
  files: Files
  api: Api
  data: Data
  options: Options
}

/**
 * Type signature of a generator function.
 */
export type Generator = (api: Api, data?: Data) => GeneratorResult

/**
 * Create a generator using simple set up options.
 */
export function generator (options: Options): Generator {
  const generate = options.generate || defaultGenerate

  return function (api: Api, data?: Data) {
    const files = generate(options.templates, api, data)

    // Return access to all the information for runtime services.
    return { files, api, data, options }
  }
}

/**
 * Compile templates into files.
 */
function defaultGenerate (templates: Templates, api: any, data: any) {
  const files: Files = {}

  Object.keys(templates).forEach(function (key) {
    files[key] = templates[key](api, data)
  })

  return files
}
