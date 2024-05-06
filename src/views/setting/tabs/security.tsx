import { If } from '~/components/directives/if'
import { CheckIcon, PlusIcon as Plus } from '~/components/icons'
import { IpInfoPopover } from '~/components/ip-info'
import { RelativeTime } from '~/components/time/relative-time'
import { useStoreRef } from '~/hooks/use-store-ref'
import {
  NButton,
  NButtonGroup,
  NCard,
  NCollapse,
  NCollapseItem,
  NDataTable,
  NDatePicker,
  NForm,
  NFormItem,
  NH3,
  NInput,
  NLayoutContent,
  NList,
  NListItem,
  NModal,
  NP,
  NPopconfirm,
  NSpace,
  NSwitch,
  NText,
} from 'naive-ui'
import { RouteName } from '~/router/name'
import { UIStore } from '~/stores/ui'
import useSWRV from 'swrv'
import { RESTManager, parseDate, removeToken } from '~/utils'
import { defineComponent, onBeforeMount, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@vicons/utils'
import { AuthnUtils } from '~/utils/authn'
import { autosizeableProps } from './system'
import type { AuthnModel } from '~/models/authn'
import type { TokenModel } from '~/models/token'
import type { DialogReactive } from 'naive-ui'

type Session = {
  id: string
  ua?: string
  ip?: string
  date: string
  current?: boolean
}
export const TabSecurity = defineComponent(() => {
  const session = ref<Session[]>([])
  const fetchSession = async () => {
    const res = await RESTManager.api.user.session.get<{ data: Session[] }>({})
    session.value = [...res.data]
  }
  onMounted(() => {
    fetchSession()
  })
  const handleKick = async (current: boolean, id?: string) => {
    if (current) {
      await RESTManager.api.user.logout.post<{}>({})

      removeToken()
      window.location.reload()
    } else {
      await RESTManager.api.user.session(id).delete<{}>({})
      session.value = session.value.filter((item) => item.id !== id)
    }
  }
  const handleKickAll = async () => {
    await RESTManager.api.user.session.all.delete<{}>({})

    await fetchSession()
  }
  return () => (
    <Fragment>
      <NH3 class={'flex items-center justify-between'}>
        <span class={'ml-4'}>登录设备</span>

        <NPopconfirm onPositiveClick={handleKickAll}>
          {{
            trigger() {
              return (
                <NButton
                  size="small"
                  quaternary
                  type="error"
                  disabled={
                    session.value.length == 1 && session.value[0].current
                  }
                >
                  踢掉全部
                </NButton>
              )
            },
            default() {
              return '确定踢掉全部登录设备（除当前会话）？'
            },
          }}
        </NPopconfirm>
      </NH3>

      <NList bordered>
        {session.value.map(({ id, ua, ip, date, current }) => (
          <NListItem key={id}>
            {{
              prefix() {
                return (
                  <div class={'w-20 text-center'}>
                    {current ? '当前' : null}
                  </div>
                )
              },
              suffix() {
                return (
                  <NButtonGroup>
                    <NPopconfirm
                      onPositiveClick={() => handleKick(!!current, id)}
                    >
                      {{
                        trigger() {
                          return (
                            <NButton tertiary type="error">
                              {current ? '注销' : '踢'}
                            </NButton>
                          )
                        },
                        default() {
                          return current ? '登出？' : '确定要踢出吗？'
                        },
                      }}
                    </NPopconfirm>
                  </NButtonGroup>
                )
              },
              default() {
                return (
                  <NSpace vertical>
                    <If condition={!!ua}>
                      <NP>User Agent: {ua}</NP>
                    </If>

                    <If condition={!!ip}>
                      <NP>
                        IP:{' '}
                        <IpInfoPopover
                          ip={ip!}
                          triggerEl={
                            <NButton quaternary size="tiny" type="primary">
                              {ip}
                            </NButton>
                          }
                        ></IpInfoPopover>
                      </NP>
                    </If>

                    <NP>
                      {current ? '活跃时间' : '登录时间'}:{' '}
                      <RelativeTime time={date} />
                    </NP>
                  </NSpace>
                )
              },
            }}
          </NListItem>
        ))}
      </NList>

      <div class="pt-4"></div>
      <NCollapse defaultExpandedNames={['']} displayDirective="show">
        <NCollapseItem name="reset" title="修改密码">
          <ResetPass />
        </NCollapseItem>

        <NCollapseItem name="token" title="API Token">
          <ApiToken />
        </NCollapseItem>

        <NCollapseItem name="passkey" title="Passkey">
          <Passkey />
        </NCollapseItem>
      </NCollapse>
    </Fragment>
  )
})

const ApiToken = defineComponent(() => {
  const tokens = ref([] as TokenModel[])

  const defaultModel = () => ({
    name: '',
    expired: false,
    expiredTime: new Date(),
  })
  const dataModel = reactive(defaultModel())
  const fetchToken = async () => {
    const { data } = (await RESTManager.api.passkey.items.get()) as any
    tokens.value = data
  }

  onBeforeMount(() => {
    fetchToken()
  })
  const newTokenDialogShow = ref(false)
  const newToken = async () => {
    const payload = {
      name: dataModel.name,
      expired: dataModel.expired
        ? dataModel.expiredTime.toISOString()
        : undefined,
    }

    const response = (await RESTManager.api.auth.token.post({
      data: payload,
    })) as TokenModel

    await navigator.clipboard.writeText(response.token)

    newTokenDialogShow.value = false
    const n = defaultModel()
    for (const key in n) {
      dataModel[key] = n[key]
    }
    message.success(`生成成功，Token 已复制，${response.token}`)
    await fetchToken()
    // Backend bug.
    const index = tokens.value.findIndex((i) => i.name === payload.name)
    if (index !== -1) {
      tokens.value[index].token = response.token
    }
  }

  const onDeleteToken = async (id) => {
    await RESTManager.api.auth.token.delete({ params: { id } })
    message.success('删除成功')
    const index = tokens.value.findIndex((i) => i.id === id)
    if (index != -1) {
      tokens.value.splice(index, 1)
    }
  }
  const uiStore = useStoreRef(UIStore)
  return () => (
    <NLayoutContent class="!overflow-visible">
      <NModal
        transformOrigin="center"
        show={newTokenDialogShow.value}
        onUpdateShow={(e) => void (newTokenDialogShow.value = e)}
      >
        <NCard bordered={false} title="创建 Token" class="w-[500px] max-w-full">
          <NForm>
            <NFormItem label="名称" required>
              <NInput
                value={dataModel.name}
                onInput={(e) => void (dataModel.name = e)}
              ></NInput>
            </NFormItem>

            <NFormItem label="是否过期">
              <NSwitch
                value={dataModel.expired}
                onUpdateValue={(e) => void (dataModel.expired = e)}
              ></NSwitch>
            </NFormItem>

            <NFormItem label="过期时间">
              <NDatePicker
                disabled={!dataModel.expired}
                // @ts-expect-error
                value={dataModel.expiredTime}
                type="datetime"
                onUpdateValue={(e) =>
                  void (dataModel.expiredTime = new Date(e))
                }
              ></NDatePicker>
            </NFormItem>
          </NForm>
          <NSpace>
            <NButton
              round
              onClick={() => void (newTokenDialogShow.value = false)}
            >
              取消
            </NButton>
            <NButton round type="primary" onClick={newToken}>
              确定
            </NButton>
          </NSpace>
        </NCard>
      </NModal>

      <NButton
        class="absolute right-0 top-[-3rem]"
        round
        type="primary"
        onClick={() => {
          newTokenDialogShow.value = true
        }}
      >
        <Icon>
          <Plus />
        </Icon>
        <span class="ml-2">新增</span>
      </NButton>
      <NDataTable
        scrollX={Math.max(
          800,
          uiStore.contentWidth.value - uiStore.contentInsetWidth.value,
        )}
        remote
        bordered={false}
        data={tokens.value}
        columns={[
          { key: 'name', title: '名称' },
          {
            key: 'token',
            title: 'Token',
            render({ token }) {
              return token ?? '*'.repeat(40)
            },
          },
          {
            title: '创建时间',
            key: 'created',
            render({ created }) {
              return <RelativeTime time={created} />
            },
          },
          {
            title: '过期时间',
            key: 'expired',
            render({ expired }) {
              return parseDate(expired, 'yyyy 年 M 月 d 日 HH:mm:ss')
            },
          },
          {
            title: '操作',
            key: 'id',
            render({ id, name }) {
              return (
                <NSpace>
                  <NPopconfirm
                    positiveText={'取消'}
                    negativeText="删除"
                    onNegativeClick={() => {
                      onDeleteToken(id)
                    }}
                  >
                    {{
                      trigger: () => (
                        <NButton quaternary type="error">
                          删除
                        </NButton>
                      ),

                      default: () => (
                        <span class="max-w-48">确定要删除 Token "{name}"?</span>
                      ),
                    }}
                  </NPopconfirm>
                </NSpace>
              )
            },
          },
        ]}
      ></NDataTable>
    </NLayoutContent>
  )
})
const ResetPass = defineComponent(() => {
  const resetPassword = reactive({
    password: '',
    reenteredPassword: '',
  })
  const formRef = ref<typeof NForm>()
  const router = useRouter()
  const reset = async () => {
    if (!formRef.value) {
      return
    }

    formRef.value.validate(async (err) => {
      if (!err) {
        await RESTManager.api.master.patch({
          data: {
            password: resetPassword.password,
          },
        })
        message.success('更改成功')
        removeToken()
        router.push({ name: RouteName.Login })
      } else {
        console.log(err)
      }
    })
  }

  function validatePasswordSame(rule, value) {
    console.log(rule)

    return value === resetPassword.password
  }

  return () => (
    <NForm
      class="max-w-[300px]"
      ref={formRef}
      model={resetPassword}
      rules={{
        password: [
          {
            required: true,
            message: '请输入密码',
          },
        ],
        reenteredPassword: [
          {
            required: true,
            message: '请再次输入密码',
            trigger: ['input', 'blur'],
          },
          {
            validator: validatePasswordSame,
            message: '两次密码输入不一致',
            trigger: ['blur', 'password-input'],
          },
        ],
      }}
    >
      <NFormItem label="新密码" required path="password">
        <NInput
          {...autosizeableProps}
          value={resetPassword.password}
          onInput={(e) => void (resetPassword.password = e)}
          type="password"
        />
      </NFormItem>
      <NFormItem label="重复密码" required path="reenteredPassword">
        <NInput
          {...autosizeableProps}
          value={resetPassword.reenteredPassword}
          onInput={(e) => void (resetPassword.reenteredPassword = e)}
          type="password"
        />
      </NFormItem>
      <div class="quaternary-right w-full">
        <NButton onClick={reset} type="primary" round>
          保存
        </NButton>
      </div>
    </NForm>
  )
})

const Passkey = defineComponent(() => {
  const uiStore = useStoreRef(UIStore)
  const { data: passkeys, mutate: refetchTable } = useSWRV(
    'passkey-table',
    () => {
      return RESTManager.api.passkey.items.get<AuthnModel[]>()
    },
  )

  const onDeleteToken = (id: string) => {
    RESTManager.api.passkey
      .items(id)
      .delete<{}>()
      .then(() => {
        refetchTable()
      })
  }

  const NewModalContent = defineComponent(
    (props: { dialog: DialogReactive }) => {
      const name = ref('')
      const handleCreate = (e: Event) => {
        e.preventDefault()
        e.stopPropagation()
        AuthnUtils.createPassKey(name.value).then(() => {
          refetchTable()
          props.dialog.destroy()
        })
      }
      return () => (
        <NForm onSubmit={handleCreate}>
          <NFormItem label="名称" required>
            <NInput
              value={name.value}
              onUpdateValue={(e) => {
                name.value = e
              }}
            />
          </NFormItem>
          <div class={'flex justify-end'}>
            <NButton
              disabled={name.value.length === 0}
              type="primary"
              onClick={handleCreate}
              round
              size="small"
            >
              创建
            </NButton>
          </div>
        </NForm>
      )
    },
  )

  const { data: setting, mutate: refetchSetting } = useSWRV(
    'current-disable-status',
    async () => {
      const { data } = await RESTManager.api.options('authSecurity').get<{
        data: { disablePasswordLogin: boolean }
      }>()
      return data
    },
  )

  const updateSetting = (value: boolean) => {
    RESTManager.api
      .options('authSecurity')
      .patch({
        data: {
          disablePasswordLogin: value,
        },
      })
      .then(() => {
        refetchSetting()
      })
  }

  // @ts-ignore
  NewModalContent.props = ['dialog']

  return () => (
    <NLayoutContent embedded class="!overflow-visible">
      <NButtonGroup class="absolute right-0 top-[-3rem]">
        <NButton
          type="tertiary"
          onClick={() => {
            AuthnUtils.validate(true)
          }}
          round
        >
          <Icon>
            <CheckIcon />
          </Icon>
          <span class="ml-2">验证</span>
        </NButton>
        <NButton
          round
          type="primary"
          onClick={() => {
            const $dialog = dialog.create({
              title: '创建 Passkey',
              content: () => <NewModalContent dialog={$dialog} />,
            })
          }}
        >
          <Icon>
            <Plus />
          </Icon>
          <span class="ml-2">新增</span>
        </NButton>
      </NButtonGroup>

      <NForm class={'mt-4'} labelAlign="left" labelPlacement="left">
        <NFormItem label="禁止密码登入">
          <NSwitch
            value={setting.value?.disablePasswordLogin}
            onUpdateValue={(v) => {
              if (!passkeys.value?.length) {
                message.error('至少需要一个 Passkey 才能开启这个功能')
              }
              updateSetting(v)
            }}
          />
        </NFormItem>
        {/* FUCK you windicss */}
        <div style={{ marginTop: '-1.5rem' }}>
          <NText class="text-xs" depth={3}>
            <span>禁用密码登录需要至少开启 Clerk 或者 PassKey 登录的一项</span>
          </NText>
        </div>
      </NForm>
      <NDataTable
        scrollX={Math.max(
          800,
          uiStore.contentWidth.value - uiStore.contentInsetWidth.value,
        )}
        remote
        bordered={false}
        data={passkeys.value}
        columns={[
          { key: 'name', title: '名称' },

          {
            title: '创建时间',
            key: 'created',
            render({ created }) {
              return <RelativeTime time={created} />
            },
          },

          {
            title: '操作',
            key: 'id',
            render({ id, name }) {
              return (
                <NSpace>
                  <NPopconfirm
                    positiveText={'取消'}
                    negativeText="删除"
                    onNegativeClick={() => {
                      onDeleteToken(id)
                    }}
                  >
                    {{
                      trigger: () => (
                        <NButton quaternary type="error">
                          删除
                        </NButton>
                      ),

                      default: () => (
                        <span class="max-w-48">
                          确定要删除 Passkey "{name}"?
                        </span>
                      ),
                    }}
                  </NPopconfirm>
                </NSpace>
              )
            },
          },
        ]}
      ></NDataTable>
    </NLayoutContent>
  )
})
