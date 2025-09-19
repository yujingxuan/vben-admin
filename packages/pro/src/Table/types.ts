import type { Component } from 'vue';

import type { VbenFormProps } from '@vben-core/form-ui';

export interface ProTableColumn {
  cellRender?: any;
  field: string;
  filters?: any[];
  fixed?: 'left' | 'right';
  minWidth?: number;
  sortable?: boolean;
  title: string;
  width?: number;
}

export interface ProTableAction {
  code: string;
  icon?: string;
  label: string;
  onClick?: (record: any) => void;
  permission?: string;
  type?: 'danger' | 'default' | 'primary';
}

export interface ProTableBatchAction {
  code: string;
  icon?: string;
  label: string;
  onClick?: (selectedRows: any[]) => void;
  permission?: string;
  type?: 'danger' | 'default' | 'primary';
}

export interface ProTableProps {
  api: {
    batchDelete?: (ids: (number | string)[]) => Promise<any>;
    create?: (data: any) => Promise<any>;
    delete?: (id: number | string) => Promise<any>;
    export?: (params: any) => Promise<any>;
    import?: (file: File) => Promise<any>;
    list: (params: any) => Promise<{ items: any[]; total: number }>;
    update?: (id: number | string, data: any) => Promise<any>;
  };
  batchActions?: ProTableBatchAction[];

  // 表格配置
  columns: ProTableColumn[];
  formComponent?: Component;

  // 表单配置
  formSchema?: any[];
  // VxeGrid 原生配置
  gridOptions?: Partial<any['gridOptions']>;

  // 权限配置
  permissions?: {
    create?: string;
    delete?: string;
    export?: string;
    import?: string;
    update?: string;
  };
  // 操作配置
  rowActions?: ProTableAction[];
  // 其他配置
  rowKey?: string;

  searchFormProps?: VbenFormProps;

  showPagination?: boolean;
  showSelection?: boolean;
  // 基础配置
  title?: string;
  titleHelp?: string;

  toolbarActions?: ProTableAction[];
}
