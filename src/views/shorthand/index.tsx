/**
 * 最近 & 速记
 */
import {
  NButton,
  NPopconfirm,
  NSpace,
  NTimeline,
  NTimelineItem,
} from 'naive-ui'
import { defineComponent, onMounted } from 'vue'
import type { RecentlyModel } from '~/models/recently'

import { Icon } from '@vicons/utils'

import {
  AddIcon,
  MaterialSymbolsThumbDownOutline,
  MaterialSymbolsThumbUpOutline,
  PenIcon,
} from '~/components/icons'
import { useShorthand } from '~/components/shorthand'
import { RelativeTime } from '~/components/time/relative-time'

import { HeaderActionButton } from '../../components/button/rounded-button'
import { ContentLayout } from '../../layouts/content'
import { RESTManager } from '../../utils/rest'
import styles from './index.module.css'

export default defineComponent({
  setup() {
    const data = ref([] as RecentlyModel[])
    const loading = ref(true)
    onMounted(async () => {
      RESTManager.api.recently.all
        .get<{ data: RecentlyModel[] }>()
        .then((res) => {
          data.value = res.data
          loading.value = false
        })
    })
    const { create } = useShorthand()
    return () => (
      <ContentLayout
        actionsElement={
          <>
            <HeaderActionButton
              onClick={() => {
                create().then((res) => {
                  if (res) {
                    data.value.unshift(res)
                  }
                })
              }}
              icon={<AddIcon />}
            />
          </>
        }
      >
        <NTimeline>
          {data.value.map((item) => {
            return (
              <NTimelineItem type="primary" key={item.id}>
                {{
                  icon() {
                    return (
                      <Icon>
                        <PenIcon />
                      </Icon>
                    )
                  },
                  default() {
                    return (
                      <div class={styles['timeline-grid']}>
                        <span>{item.content}</span>

                        <div class="action">
                          <NPopconfirm
                            placement="left"
                            positiveText="取消"
                            negativeText="删除"
                            onNegativeClick={async () => {
                              await RESTManager.api.recently(item.id).delete()
                              message.success('删除成功')
                              data.value.splice(data.value.indexOf(item), 1)
                            }}
                          >
                            {{
                              trigger: () => (
                                <NButton quaternary type="error" size="tiny">
                                  移除
                                </NButton>
                              ),

                              default: () => (
                                <span class={'max-w-48 break-all'}>
                                  确定要删除 {item.content} ?
                                </span>
                              ),
                            }}
                          </NPopconfirm>
                        </div>
                      </div>
                    )
                  },
                  footer() {
                    return (
                      <NSpace inline size={5}>
                        <RelativeTime time={item.created} />
                        <NSpace inline size={1} align="center">
                          <MaterialSymbolsThumbUpOutline /> {item.up}
                          <span class={'mx-2'}>/</span>
                          <MaterialSymbolsThumbDownOutline /> {item.down}
                        </NSpace>
                      </NSpace>
                    )
                  },
                }}
              </NTimelineItem>
            )
          })}
        </NTimeline>
      </ContentLayout>
    )
  },
})
