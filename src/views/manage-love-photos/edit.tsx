import { HeaderActionButton } from 'components/button/rounded-button'
import { CommentIcon, SendIcon } from 'components/icons'
import { fetchHitokoto, SentenceType } from 'external/api/hitokoto'
import { useParsePayloadIntoData } from 'hooks/use-parse-payload'
import { ContentLayout } from 'layouts/content'
import { isString, transform } from 'lodash-es'
import { NForm, NFormItem, NInput, useDialog,NSwitch } from 'naive-ui'
import { RouteName } from 'router/name'
import { RESTManager } from 'utils'
import {
  computed,
  defineComponent,
  onBeforeMount,
  onMounted,
  reactive,
  ref,
  toRaw,
} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { LovePhotoModel } from 'models/lovePhoto'

type LovePhotoReactiveType = {
  title: string
  descip: string
  colors: string
  time: string
  key: string
  hasPhotos: boolean
}

const EditLovePhoto = defineComponent({
  setup() {
    const route = useRoute()
    const router = useRouter()

    const resetReactive: () => LovePhotoReactiveType = () => ({
      title: '',
      descip: '',
      colors: '',
      time: '',
      key: '',
      hasPhotos: true,
    })

    const placeholder = ref({} as LovePhotoModel)

    onBeforeMount(() => {
    })
    const dialog = useDialog()

    const parsePayloadIntoReactiveData = (payload: LovePhotoModel) =>
      useParsePayloadIntoData(data)(payload)
    const data = reactive<LovePhotoReactiveType>(resetReactive())
    const id = computed(() => route.query.id)

    onMounted(async () => {
      const $id = id.value
      if ($id && typeof $id == 'string') {
        const payload = (await RESTManager.api.says($id).get({})) as any

        const data = payload.data
        parsePayloadIntoReactiveData(data as LovePhotoModel)
      }
    })

    const handleSubmit = async () => {
      const parseDataToPayload = (): { [key in keyof LovePhotoModel]?: any } => {
        try {
          if (!data.descip || data.descip.trim().length == 0) {
            throw '描述为空'
          }

          return {
            ...transform(
              toRaw(data),
              (res, v, k) => (
                (res[k] =
                  typeof v == 'undefined'
                    ? null
                    : typeof v == 'string' && v.length == 0
                      ? ''
                      : v),
                res
              ),
            ),
            // descip: data.descip.trim(),
          }
        } catch (e) {
          message.error(e as any)

          throw e
        }
      }
      if (id.value) {
        // update
        if (!isString(id.value)) {
          return
        }
        const $id = id.value as string
        await RESTManager.api.lovePhotos($id).put({
          data: parseDataToPayload(),
        })
        message.success('修改成功')
      } else {
        // create
        await RESTManager.api.lovePhotos.post({
          data: parseDataToPayload(),
        })
        message.success('发布成功')
      }

      router.push({ name: RouteName.ListLovePhoto })
    }

    return () => (
      <ContentLayout
        actionsElement={
          <Fragment>
            {isString(id) ? (
              <HeaderActionButton
                name="更新"
                variant="info"
                onClick={handleSubmit}
                icon={<SendIcon></SendIcon>}
              ></HeaderActionButton>
            ) : (
              <>
                <HeaderActionButton
                  name="发布爱的相册"
                  variant={'primary'}
                  onClick={handleSubmit}
                  icon={<SendIcon></SendIcon>}
                ></HeaderActionButton>
              </>
            )}
          </Fragment>
        }
      >
        <NForm>
          <NFormItem
            label="标题"
            labelPlacement="left"
            labelStyle={{ width: '4rem' }}
          >
            <NInput
              placeholder={placeholder.value.title}
              value={data.title}
              onInput={(e) => void (data.title = e)}
            ></NInput>
          </NFormItem>
          <NFormItem
            label="描述"
            required
            labelPlacement="left"
            labelStyle={{ width: '4rem' }}
          >
            <NInput
              type="textarea"
              autofocus
              autosize={{ minRows: 6, maxRows: 8 }}
              placeholder={placeholder.value.descrip}
              value={data.descrip}
              onInput={(e) => void (data.descrip = e)}
            ></NInput>
          </NFormItem>
          <NFormItem
            label="颜色值"
            labelPlacement="left"
            labelStyle={{ width: '4rem' }}
          >
            <NInput
              placeholder={placeholder.value.colors}
              value={data.colors}
              onInput={(e) => void (data.colors = e)}
            ></NInput>
          </NFormItem>
          <NFormItem
            label="日期"
            labelPlacement="left"
            labelStyle={{ width: '4rem' }}
          >
            <NInput
              placeholder={placeholder.value.time}
              value={data.time}
              onInput={(e) => void (data.time = e)}
            ></NInput>
          </NFormItem>
          <NFormItem
            label="关键词"
            labelPlacement="left"
            labelStyle={{ width: '4rem' }}
          >
            <NInput
              placeholder={placeholder.value.key}
              value={data.key}
              onInput={(e) => void (data.key = e)}
            ></NInput>
          </NFormItem>
          <NFormItem label="有相册">
              <NSwitch
                value={data.hasPhotos}
                onUpdateValue={(e) => void (data.hasPhotos = e)}
              />
            </NFormItem>
        </NForm>
      </ContentLayout>
    )
  },
})

export default EditLovePhoto
