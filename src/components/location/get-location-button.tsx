import { LocationIcon } from '~/components/icons'
import { NButton, useMessage } from 'naive-ui'
import { RESTManager } from '~/utils/rest'
import { defineComponent, ref } from 'vue'
import { Icon } from '@vicons/utils'
import type { Amap, Regeocode } from '~/models/amap'
import type { PropType } from 'vue'

export const GetLocationButton = defineComponent({
  props: {
    onChange: {
      type: Function as PropType<
        (amap: Regeocode, coordinates: readonly [number, number]) => any
      >,
      required: true,
    },
  },
  setup(props) {
    const message = useMessage()
    const loading = ref(false)
    const handleGetLocation = async () => {
      const GetGeo = () =>
        new Promise<GeolocationPosition>((r, j) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              loading.value = true
              r(pos)
              loading.value = false
            },
            (err) => {
              loading.value = false
              j(err)
            },
          )
        })
      if (navigator.geolocation) {
        try {
          const coordinates = await GetGeo()
          // console.log(coordinates)

          const {
            coords: { latitude, longitude },
          } = coordinates

          const coo = [longitude, latitude] as const
          const res = await RESTManager.api
            .fn('built-in')
            .geocode_location.get<Amap>({
              params: {
                longitude,
                latitude,
              },
            })

          props.onChange(res.regeocode, coo)
        } catch (error: any) {
          console.error(error)

          if (error.code == 2) {
            message.error('获取定位失败，连接超时')
          } else {
            message.error('定位权限未打开')
          }
        }
      } else {
        message.error('浏览器不支持定位')
      }
    }
    return () => (
      <NButton
        ghost
        round
        type="primary"
        onClick={handleGetLocation}
        loading={loading.value}
      >
        {{
          icon() {
            return (
              <Icon>
                <LocationIcon />
              </Icon>
            )
          },
          default() {
            return '定位'
          },
        }}
      </NButton>
    )
  },
})
