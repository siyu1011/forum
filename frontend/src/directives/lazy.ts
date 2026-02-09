import type { Directive, DirectiveBinding } from 'vue'

interface LazyOptions {
  src: string
  placeholder?: string
  error?: string
}

const imageCache = new Set<string>()

const loadImage = (el: HTMLImageElement, src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.src = src
    img.onload = () => {
      imageCache.add(src)
      resolve()
    }
    img.onerror = reject
  })
}

const createObserver = (el: HTMLImageElement, binding: DirectiveBinding<LazyOptions>) => {
  const options = {
    root: null,
    rootMargin: '50px 0px',
    threshold: 0.01,
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const { src, placeholder, error } = binding.value

        if (!src) {
          console.warn('v-lazy: src is required')
          return
        }

        // 如果已经缓存，直接显示
        if (imageCache.has(src)) {
          el.src = src
          el.classList.add('lazy-loaded')
          observer.unobserve(el)
          return
        }

        // 设置占位图
        if (placeholder) {
          el.src = placeholder
        }

        // 加载图片
        loadImage(el, src)
          .then(() => {
            el.src = src
            el.classList.add('lazy-loaded')
          })
          .catch(() => {
            if (error) {
              el.src = error
            }
            el.classList.add('lazy-error')
          })
          .finally(() => {
            observer.unobserve(el)
          })
      }
    })
  }, options)

  observer.observe(el)

  return observer
}

export const vLazy: Directive<HTMLImageElement, LazyOptions> = {
  mounted(el, binding) {
    // 设置默认占位图
    const { placeholder } = binding.value
    if (placeholder) {
      el.src = placeholder
    }

    // 添加懒加载样式
    el.classList.add('lazy-image')

    // 创建观察器
    const observer = createObserver(el, binding)

    // 保存观察器实例以便清理
    ;(el as any)._lazyObserver = observer
  },

  unmounted(el) {
    // 清理观察器
    const observer = (el as any)._lazyObserver
    if (observer) {
      observer.disconnect()
    }
  },
}

export default vLazy
