import type { App } from 'vue'
import { vLazy } from './lazy'

export const setupDirectives = (app: App) => {
  app.directive('lazy', vLazy)
}

export { vLazy }
export default setupDirectives
