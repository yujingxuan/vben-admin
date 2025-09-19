<script setup lang="ts">
import useTable from './ProTable/useTable';
import { formOptions, gridOptions } from './useSchema';

const { ProTable } = useTable({
  formOptions,
  gridOptions,
});
</script>

<template>
  <ProTable />
</template>
