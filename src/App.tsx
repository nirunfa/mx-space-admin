import {
  darkTheme,
  dateZhCN,
  lightTheme,
  NConfigProvider,
  NDialogProvider,
  NElement,
  NMessageProvider,
  NNotificationProvider,
  useDialog,
  useMessage,
  useNotification,
  useThemeVars,
  zhCN,
} from 'naive-ui'
import { defineComponent, onMounted } from 'vue'
import { RouterView } from 'vue-router'
import type { VNode } from 'vue'

import { PortalInjectKey } from '~/hooks/use-portal-element'

import { ThemeColorConfig } from '../theme.config'
import { useUIStore } from './stores/ui'
import { colorRef } from './utils/color'

const Root = defineComponent({
  name: 'RootView',

  setup() {
    onMounted(() => {
      const message = useMessage()
      const _error = message.error
      Object.assign(message, {
        error: (...rest: any[]) => {
          // @ts-ignore
          _error.apply(this, rest)
          throw rest[0]
        },
      })

      window.message = message
      window.notification = useNotification()
      window.dialog = useDialog()
    })
    const $portalElement = ref<VNode | null>(null)

    provide(PortalInjectKey, {
      setElement(el) {
        $portalElement.value = el
        return () => {
          $portalElement.value = null
        }
      },
    })

    return () => {
      return (
        <>
          <RouterView />
          {$portalElement.value}
        </>
      )
    }
  },
})

const App = defineComponent({
  setup() {
    const uiStore = useUIStore()
    return () => {
      const { isDark, naiveUIDark } = uiStore
      return (
        <NConfigProvider
          locale={zhCN}
          dateLocale={dateZhCN}
          themeOverrides={{
            common: colorRef.value,
          }}
          theme={naiveUIDark ? darkTheme : isDark ? darkTheme : lightTheme}
        >
          <NNotificationProvider>
            <NMessageProvider>
              <NDialogProvider>
                <AccentColorInjector />
                <NElement>
                  <Root />
                </NElement>
              </NDialogProvider>
            </NMessageProvider>
          </NNotificationProvider>
        </NConfigProvider>
      )
    }
  },
})

const AccentColorInjector = defineComponent({
  setup() {
    const vars = useThemeVars()
    watchEffect(() => {
      const { primaryColor, primaryColorHover, primaryColorSuppl } = vars.value

      document.documentElement.style.setProperty(
        '--color-primary',
        primaryColor,
      )
      document.documentElement.style.setProperty(
        '--color-primary-shallow',
        primaryColorHover,
      )
      document.documentElement.style.setProperty(
        '--color-primary-deep',
        primaryColorSuppl,
      )
    })

    return () => null
  },
})
// eslint-disable-next-line import/no-default-export
export default App
