import type { Program, Identifier, VariableDeclarator } from 'estree'
import { simple } from 'acorn-walk'
import { SourceDescription, TransformResult } from 'rollup'
import { Plugin } from 'vite'
import { makeLegalIdentifier } from '@rollup/pluginutils'

export const drillDown = (obj: any, keys: Array<string>): any => {
  if (!obj) {
    return obj
  }
  const key = keys.shift()
  if (key) {
    if (!obj[key]) {
      obj[key] = {}
    }
    if (keys.length > 0) {
      return drillDown(obj[key], keys)
    } else {
      return obj[key]
    }
  } else {
    return obj
  }
}
export function clearExportNamedDeclaration(
  ast: Program,
  exclude?: RegExp
): void {
  const filteredNodeList: Array<unknown> = []
  simple(ast as any, {
    ExportNamedDeclaration(node) {
      simple(node, {
        //@ts-ignore acorn-walk v8.3.2, its type declaration is incorrect
        VariableDeclarator(variableDeclaratorNode: unknown) {
          let name = (<Identifier>(
            (<VariableDeclarator>variableDeclaratorNode).id
          )).name
          if (exclude && !exclude.test(name)) {
            filteredNodeList.push(node)
          }
        }
      })
    },
    ExportDefaultDeclaration(node) {
      filteredNodeList.push(node)
    }
  })
  ast.body = ast.body.filter((item) => filteredNodeList.indexOf(item) === -1)
}

export function isSourceDescription(
  obj: TransformResult
): obj is SourceDescription {
  return obj && typeof obj !== 'string' && typeof obj.code !== 'undefined'
}

export type PluginTransformHandler = (
  this: any,
  code: string,
  id: string,
  options?: {
    ssr?: boolean
  }
) => Promise<TransformResult> | TransformResult

export function getPluginTransformHandler(transform: Plugin['transform']) {
  if (typeof transform === 'function') {
    return transform as PluginTransformHandler
  } else {
    return transform.handler as PluginTransformHandler
  }
}

export function setPluginTransformHandler(
  plugin: Plugin,
  handler: PluginTransformHandler
) {
  if (typeof plugin.transform === 'function') {
    plugin.transform = handler
  } else {
    plugin.transform.handler = handler
  }
}

export function getCSSVirtualId(id: string) {
  const [filename] = id.split('?')
  const cssVirtualId = `${makeLegalIdentifier(filename)}?lang.css`
  return cssVirtualId
}
