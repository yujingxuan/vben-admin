<script setup lang="ts">
import type { ProTableProps } from './types';

import { computed, onMounted, ref } from 'vue';

import { usePermission } from '@vben/access';
import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Button, message, Modal, Upload } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { $t } from '#/locales';

const props = withDefaults(defineProps<ProTableProps>(), {
  rowKey: 'id',
  showSelection: true,
  showPagination: true,
});

const emits = defineEmits<{
  refresh: [];
  selectionChange: [selectedRows: any[]];
}>();

const { hasPermission } = usePermission();
const selectedRows = ref<any[]>([]);
const loading = ref(false);

// 表格配置
const [Grid, gridApi] = useVbenVxeGrid({
  tableTitle: props.title,
  tableTitleHelp: props.titleHelp,
  formOptions: props.searchFormProps,
  gridOptions: {
    ...props.gridOptions,
    columns: [
      ...(props.showSelection
        ? [
            {
              type: 'checkbox',
              width: 60,
              fixed: 'left',
            },
          ]
        : []),
      ...props.columns.map((col) => ({
        title: col.title,
        field: col.field,
        width: col.width,
        minWidth: col.minWidth || 120,
        fixed: col.fixed,
        cellRender: col.cellRender,
        sortable: col.sortable,
        filters: col.filters,
      })),
      ...(props.rowActions?.length
        ? [
            {
              title: $t('common.action'),
              field: 'actions',
              width: props.rowActions.length * 80 + 40,
              fixed: 'right',
              cellRender: {
                name: 'CellOperation',
                props: {
                  options: props.rowActions
                    .filter(
                      (action) =>
                        !action.permission || hasPermission(action.permission),
                    )
                    .map((action) => ({
                      code: action.code,
                      text: action.label,
                      icon: action.icon,
                      type: action.type || 'default',
                    })),
                },
                events: {
                  onClick: ({ code, row }: any) => {
                    const action = props.rowActions?.find(
                      (a) => a.code === code,
                    );
                    action?.onClick?.(row);
                  },
                },
              },
            },
          ]
        : []),
    ],
    proxyConfig: {
      ajax: {
        query: async ({ page }: any, formValues: any) => {
          const params = {
            page: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          };
          const result = await props.api.list(params);
          return {
            result: result.items,
            page: {
              total: result.total,
            },
          };
        },
      },
    },
    checkboxConfig: props.showSelection
      ? {
          checkMethod: ({ row }: any) => !row.disabled,
        }
      : undefined,
    toolbarConfig: {
      slots: {
        buttons: 'toolbar-buttons',
      },
    },
  },
  gridEvents: {
    checkboxChange: ({ records }: any) => {
      selectedRows.value = records;
      emits('selectionChange', records);
    },
    checkboxAll: ({ records }: any) => {
      selectedRows.value = records;
      emits('selectionChange', records);
    },
  },
});

// 表单弹窗
const formData = ref<any>({});
const isEdit = ref(false);

const [FormModal, formModalApi] = useVbenModal({
  title: computed(() =>
    isEdit.value ? $t('common.edit') : $t('common.create'),
  ),
  onConfirm: async () => {
    const { valid } = await formApi.validate();
    if (!valid) return;

    const values = await formApi.getValues();
    formModalApi.lock();

    try {
      await (isEdit.value && formData.value[props.rowKey]
        ? props.api.update?.(formData.value[props.rowKey], values)
        : props.api.create?.(values));

      message.success($t('common.operationSuccess'));
      formModalApi.close();
      gridApi.reload();
      emits('refresh');
    } catch {
      formModalApi.unlock();
    }
  },
  onOpenChange: (isOpen) => {
    if (isOpen) {
      formApi.resetForm();
      if (isEdit.value && formData.value) {
        formApi.setValues(formData.value);
      }
    }
  },
});

const [Form, formApi] = useVbenForm({
  schema: props.formSchema || [],
  showDefaultActions: false,
});

// 操作方法
const handleCreate = () => {
  if (!hasPermission(props.permissions?.create)) {
    message.warning($t('common.noPermission'));
    return;
  }

  isEdit.value = false;
  formData.value = {};
  formModalApi.open();
};

const handleEdit = (record: any) => {
  if (!hasPermission(props.permissions?.update)) {
    message.warning($t('common.noPermission'));
    return;
  }

  isEdit.value = true;
  formData.value = record;
  formModalApi.open();
};

const handleDelete = async (record: any) => {
  if (!hasPermission(props.permissions?.delete)) {
    message.warning($t('common.noPermission'));
    return;
  }

  Modal.confirm({
    title: $t('common.confirmDelete'),
    content: $t('common.confirmDeleteContent'),
    onOk: async () => {
      try {
        await props.api.delete?.(record[props.rowKey]);
        message.success($t('common.operationSuccess'));
        gridApi.reload();
        emits('refresh');
      } catch {
        // Error handled by global handler
      }
    },
  });
};

const handleBatchDelete = async () => {
  if (!hasPermission(props.permissions?.delete)) {
    message.warning($t('common.noPermission'));
    return;
  }

  if (selectedRows.value.length === 0) {
    message.warning($t('common.pleaseSelectData'));
    return;
  }

  Modal.confirm({
    title: $t('common.confirmBatchDelete'),
    content: $t('common.confirmBatchDeleteContent', {
      count: selectedRows.value.length,
    }),
    onOk: async () => {
      try {
        const ids = selectedRows.value.map((row) => row[props.rowKey]);
        await props.api.batchDelete?.(ids);
        message.success($t('common.operationSuccess'));
        gridApi.reload();
        selectedRows.value = [];
        emits('refresh');
      } catch {
        // Error handled by global handler
      }
    },
  });
};

const handleExport = async () => {
  if (!hasPermission(props.permissions?.export)) {
    message.warning($t('common.noPermission'));
    return;
  }

  try {
    const formValues = (await gridApi.formApi?.getValues()) || {};
    await props.api.export?.(formValues);
    message.success($t('common.exportSuccess'));
  } catch {
    // Error handled by global handler
  }
};

const handleImport = async (file: File) => {
  if (!hasPermission(props.permissions?.import)) {
    message.warning($t('common.noPermission'));
    return;
  }

  try {
    await props.api.import?.(file);
    message.success($t('common.importSuccess'));
    gridApi.reload();
    emits('refresh');
  } catch {
    // Error handled by global handler
  }
};

// 注册行操作事件
onMounted(() => {
  // 注册默认的编辑和删除操作
  if (props.rowActions?.some((action) => action.code === 'edit')) {
    const editAction = props.rowActions.find(
      (action) => action.code === 'edit',
    );
    if (editAction && !editAction.onClick) {
      editAction.onClick = handleEdit;
    }
  }

  if (props.rowActions?.some((action) => action.code === 'delete')) {
    const deleteAction = props.rowActions.find(
      (action) => action.code === 'delete',
    );
    if (deleteAction && !deleteAction.onClick) {
      deleteAction.onClick = handleDelete;
    }
  }
});
</script>

<template>
  <div class="pro-table">
    <Grid>
      <template #toolbar-buttons>
        <!-- 工具栏操作按钮 -->
        <div class="flex gap-2">
          <!-- 创建按钮 -->
          <Button
            v-if="api.create && hasPermission(permissions?.create)"
            type="primary"
            @click="handleCreate"
          >
            <IconifyIcon icon="mdi:plus" class="mr-1" />
            {{ $t('common.create') }}
          </Button>

          <!-- 批量删除 -->
          <Button
            v-if="api.batchDelete && hasPermission(permissions?.delete)"
            type="primary"
            danger
            :disabled="selectedRows.length === 0"
            @click="handleBatchDelete"
          >
            <IconifyIcon icon="mdi:delete" class="mr-1" />
            {{ $t('common.batchDelete') }}
          </Button>

          <!-- 导出 -->
          <Button
            v-if="api.export && hasPermission(permissions?.export)"
            @click="handleExport"
          >
            <IconifyIcon icon="mdi:download" class="mr-1" />
            {{ $t('common.export') }}
          </Button>

          <!-- 导入 -->
          <Upload
            v-if="api.import && hasPermission(permissions?.import)"
            :show-upload-list="false"
            :before-upload="
              (file) => {
                handleImport(file);
                return false;
              }
            "
            accept=".xlsx,.xls,.csv"
          >
            <Button>
              <IconifyIcon icon="mdi:upload" class="mr-1" />
              {{ $t('common.import') }}
            </Button>
          </Upload>

          <!-- 自定义工具栏操作 -->
          <template v-for="action in toolbarActions" :key="action.code">
            <Button
              v-if="!action.permission || hasPermission(action.permission)"
              :type="action.type || 'default'"
              @click="action.onClick"
            >
              <IconifyIcon
                v-if="action.icon"
                :icon="action.icon"
                class="mr-1"
              />
              {{ action.label }}
            </Button>
          </template>

          <!-- 批量操作 -->
          <template v-for="action in batchActions" :key="action.code">
            <Button
              v-if="!action.permission || hasPermission(action.permission)"
              :type="action.type || 'default'"
              :disabled="selectedRows.length === 0"
              @click="() => action.onClick?.(selectedRows)"
            >
              <IconifyIcon
                v-if="action.icon"
                :icon="action.icon"
                class="mr-1"
              />
              {{ action.label }}
            </Button>
          </template>
        </div>
      </template>
    </Grid>

    <!-- 表单弹窗 -->
    <FormModal>
      <Form v-if="formSchema?.length">
        <template v-for="(_, name) in $slots" :key="name" #[name]="slotData">
          <slot :name="name" v-bind="slotData"></slot>
        </template>
      </Form>
      <component
        v-else-if="formComponent"
        :is="formComponent"
        :data="formData"
        :is-edit="isEdit"
      />
    </FormModal>
  </div>
</template>
