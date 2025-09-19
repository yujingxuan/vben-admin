<script setup lang="ts">
import { Button, Tag } from 'ant-design-vue';

import { formOptions, gridOptions } from '../useSchema';
import useTable from './useTable';

const { ProTable, gridApi } = useTable({
  formOptions,
  gridOptions,
});

const onBatchDelete = () => {
  console.log('onBatchDelete', gridApi.grid.getCheckboxRecords());
};
</script>

<template>
  <div class="vp-raw w-full">
    <ProTable>
      <template #toolbar-actions>
        <Button type="primary" @click="onBatchDelete"> 批量删除 </Button>
      </template>
      <template #status="{ row }">
        <Tag :color="row.color">{{ row.status }}</Tag>
      </template>
    </ProTable>
  </div>
</template>
