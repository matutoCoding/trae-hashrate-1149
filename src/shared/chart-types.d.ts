declare module '@ant-design/charts' {
  import { FC } from 'react';
  interface ChartConfig {
    data?: any[];
    xField?: string;
    yField?: string;
    color?: string;
    columnStyle?: any;
    yAxis?: any;
    height?: number;
    [key: string]: any;
  }
  export const Column: FC<ChartConfig>;
  export const Line: FC<ChartConfig>;
  export const Pie: FC<ChartConfig>;
  export const Bar: FC<ChartConfig>;
}
