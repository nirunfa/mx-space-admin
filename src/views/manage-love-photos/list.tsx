import { AddIcon } from 'components/icons'
import { DeleteConfirmButton } from 'components/special-button/delete-confirm'
import { Table } from 'components/table'
import { RelativeTime } from 'components/time/relative-time'
import { useDataTableFetch } from 'hooks/use-table'
import { NButton, NPopconfirm, NSpace, useDialog, useMessage } from 'naive-ui'
import { defineComponent, onMounted, reactive, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import type { LovePhotoResponse } from 'models/lovePhoto'
import type { TableColumns } from 'naive-ui/lib/data-table/src/interface'

import { HeaderActionButton } from '../../components/button/rounded-button'
import { ContentLayout } from '../../layouts/content'
import { RESTManager } from '../../utils/rest'

const ManageLovePhotoListView = defineComponent({
  name: 'LovePhotoList',
  setup(props, ctx) {
    const { checkedRowKeys, data, pager, loading, fetchDataFn } =
      useDataTableFetch(
        (data, pager) =>
          async (page = route.query.page || 1, size = 30) => {
            const response = await RESTManager.api.lovePhotos.get<LovePhotoResponse>({
              params: {
                page,
                size,
                select: 'title text _id id created modified author source',
              },
            })
            data.value = response.data
            pager.value = response.pagination
          },
      )

    const message = useMessage()
    const dialog = useDialog()

    const route = useRoute()
    const fetchData = fetchDataFn
    watch(
      () => route.query.page,
      async (n) => {
        // @ts-expect-error
        await fetchData(n)
      },
    )

    onMounted(async () => {
      await fetchData()
    })

    const DataTable = defineComponent({
      setup() {
        const columns = reactive<TableColumns<any>>([
          {
            type: 'selection',
            options: ['none', 'all'],
          },
          {
            title: '创建于',
            key: 'created',
            width: 100,
            render(row) {
              return (
                <RouterLink to={`/love-photos/edit?id=${row.id}`}>
                  <RelativeTime time={row.created} />
                </RouterLink>
              )
            },
          },
          {
            title: '标题',
            key: 'title',
          },
          { title: '描述', key: 'descrip' },
          { title: '颜色值', key: 'colors' },
          { title: '日期', key: 'time' },
          { title: '标识tag', key: 'key' },
          { title: '相册', key: 'hasPhotos' },
          {
            title: '操作',
            fixed: 'right',
            key: 'id',
            width: 130,
            render(row) {
              return (
                <NSpace wrap={false}>
                  <RouterLink to={`/love-photos/edit?id=${row.id}`}>
                    <NButton quaternary type="primary" size="tiny">
                      编辑
                    </NButton>
                  </RouterLink>
                  <NPopconfirm
                    positiveText={'取消'}
                    negativeText="删除"
                    onNegativeClick={async () => {
                      await RESTManager.api.says(row.id).delete()
                      message.success('删除成功')
                      await fetchData(pager.value.currentPage)
                    }}
                  >
                    {{
                      trigger: () => (
                        <NButton quaternary type="error" size="tiny">
                          移除
                        </NButton>
                      ),

                      default: () => (
                        <span class="max-w-48">确定要删除“{row.text}” ?</span>
                      ),
                    }}
                  </NPopconfirm>
                </NSpace>
              )
            },
          },
        ])

        return () => (
          <Table
            loading={loading.value}
            columns={columns}
            data={data}
            onFetchData={fetchData}
            pager={pager}
            onUpdateCheckedRowKeys={(keys) => {
              checkedRowKeys.value = keys
            }}
          ></Table>
        )
      },
    })

    return () => {
      return (
        <ContentLayout>
          {{
            actions: () => (
              <>
                <DeleteConfirmButton
                  checkedRowKeys={checkedRowKeys.value}
                  onDelete={async () => {
                    const status = await Promise.allSettled(
                      checkedRowKeys.value.map((id) =>
                        RESTManager.api.says(id as string).delete(),
                      ),
                    )

                    for (const s of status) {
                      if (s.status === 'rejected') {
                        message.success(`删除失败，${s.reason.message}`)
                      }
                    }

                    checkedRowKeys.value.length = 0
                    fetchData()
                  }}
                />

                <HeaderActionButton to={'/love-photos/edit'} icon={<AddIcon />} />
              </>
            ),
            default: () => <DataTable />,
          }}
        </ContentLayout>
      )
    }
  },
})

export default ManageLovePhotoListView
