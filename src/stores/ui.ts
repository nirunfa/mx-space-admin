/*
 * @Author: Innei
 * @Date: 2021-03-22 11:41:32
 * @LastEditTime: 2021-03-22 11:41:32
 * @LastEditors: Innei
 * @FilePath: /admin-next/src/stores/ui.ts
 * Mark: Coding with Love
 */
import { debounce } from 'lodash-es'
import { computed, onMounted, ref, watch } from 'vue'

import { useDark, useToggle } from '@vueuse/core'

export interface ViewportRecord {
  w: number
  h: number
  mobile: boolean
  pad: boolean
  hpad: boolean
  wider: boolean
  widest: boolean
  phone: boolean
}

export const useUIStore = defineStore('ui', () => {
  const viewport = ref<ViewportRecord>({} as any)
  const sidebarWidth = ref(250)
  const sidebarCollapse = ref(viewport.value.mobile ? true : false)

  const isDark = useDark()
  const toggleDark = useToggle(isDark)

  onMounted(() => {
    const resizeHandler = debounce(updateViewport, 500, { trailing: true })
    window.addEventListener('resize', resizeHandler)
    updateViewport()
  })
  const updateViewport = () => {
    const innerHeight = window.innerHeight
    const width = document.documentElement.getBoundingClientRect().width
    const { hpad, pad, mobile } = viewport.value

    // 忽略移动端浏览器 上下滚动 导致的视图大小变化
    if (
      viewport.value.h &&
      // chrome mobile delta == 56
      Math.abs(innerHeight - viewport.value.h) < 80 &&
      width === viewport.value.w &&
      (hpad || pad || mobile)
    ) {
      return
    }
    viewport.value = {
      w: width,
      h: innerHeight,
      mobile: window.screen.width <= 568 || window.innerWidth <= 568,
      pad: window.innerWidth <= 768 && window.innerWidth > 568,
      hpad: window.innerWidth <= 1024 && window.innerWidth > 768,
      wider: window.innerWidth > 1024 && window.innerWidth < 1920,
      widest: window.innerWidth >= 1920,

      phone: window.innerWidth <= 768,
    }
  }

  const contentWidth = computed(
    () =>
      viewport.value.w -
      sidebarWidth.value +
      (sidebarCollapse.value
        ? Number.parseInt(
            getComputedStyle(document.documentElement).getPropertyValue(
              '--sidebar-collapse-width',
            ),
          )
        : 0),
  )

  const contentInsetWidth = computed(
    () =>
      contentWidth.value -
      Number.parseInt(getComputedStyle(document.documentElement).fontSize) * 6,
  )

  watch(
    () => isDark.value,
    (isDark) => {
      if (isDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    },
  )

  const naiveUIDark = ref(false)
  return {
    viewport,
    contentWidth,
    sidebarWidth,
    contentInsetWidth,
    sidebarCollapse,

    isDark,
    toggleDark,

    naiveUIDark,
    onlyToggleNaiveUIDark: (dark?: boolean) => {
      naiveUIDark.value = dark ?? !naiveUIDark.value
    },
  }
})

export { useUIStore as UIStore }
