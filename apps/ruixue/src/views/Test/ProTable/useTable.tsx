import type { SlotsType } from 'vue';

import type { ProTableProps } from './types';

import { defineComponent } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Button, message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';

export default function useTable(config: ProTableProps) {
  const { formOptions, gridOptions } = config;
  const [Grid, gridApi] = useVbenVxeGrid({
    gridOptions,
    formOptions,
  });
  const [Form, formApi] = useVbenForm({
    handleSubmit: onSubmit,
    schema: [
      {
        component: 'Input',
        componentProps: {
          placeholder: '请输入',
        },
        fieldName: 'field1',
        label: '字段1',
        rules: 'required',
      },
      {
        component: 'Input',
        componentProps: {
          placeholder: '请输入',
        },
        fieldName: 'field2',
        label: '字段2',
        rules: 'required',
      },
      {
        component: 'Select',
        componentProps: {
          options: [
            { label: '选项1', value: '1' },
            { label: '选项2', value: '2' },
          ],
          placeholder: '请输入',
        },
        fieldName: 'field3',
        label: '字段3',
        rules: 'required',
      },
    ],
    showDefaultActions: false,
  });

  const [Modal, modalApi] = useVbenModal({
    fullscreenButton: false,
    onCancel() {
      modalApi.close();
    },
    onConfirm: async () => {
      await formApi.validateAndSubmitForm();
      // modalApi.close();
    },
    onOpenChange(isOpen: boolean) {
      if (isOpen) {
        const { values } = modalApi.getData<Record<string, any>>();
        console.log('values', values);
        if (values) {
          formApi.setValues({ ...values, field3: '1' });
        }
      }
    },
    title: '内嵌表单示例',
  });

  function onSubmit(values: Record<string, any>) {
    message.loading({
      content: '正在提交中...',
      duration: 0,
      key: 'is-form-submitting',
    });
    modalApi.lock();
    setTimeout(() => {
      modalApi.close();
      message.success({
        content: `提交成功：${JSON.stringify(values)}`,
        duration: 2,
        key: 'is-form-submitting',
      });
    }, 3000);
  }

  const ProTable = defineComponent({
    name: 'ProTable',
    inheritAttrs: false,
    props: {} as Record<string, never>,
    setup(_props, { attrs, slots }) {
      return () => (
        <div>
          <Modal>
            <Form />
          </Modal>
          <Grid
            {...attrs}
            v-slots={{
              ...slots,
              'toolbar-actions': (sp: SlotsType) => (
                <>
                  <Button
                    class="mr-2"
                    onClick={() => modalApi.open()}
                    type="primary"
                  >
                    新增
                  </Button>
                  {slots['toolbar-actions']?.(sp)}
                </>
              ),
              'toolbar-tools': (sp: SlotsType) => (
                <>{slots['toolbar-tools']?.(sp)}</>
              ),
            }}
          />
        </div>
      );
    },
  });

  return { ProTable, gridApi };
}
