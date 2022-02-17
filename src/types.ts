// 布局方向
export type LayoutDirection = 'vertical' | 'horizontal';

// 盒子
export type Shape = {
  width: number;
  height: number;
}

// 片段节点
export type Fragment = {
  type: 'fragment';
  width?: number;
  height?: number;
  key: number | string;
}

// 布局节点
export type Layout = {
  type: 'layout';
  width?: number;
  height?: number;
  children: Array<Fragment | Layout>;
  direction?: LayoutDirection;
}

// 渲染数据
export type Item = {
  key: number | string;
  width: number;
  height: number;
  x: number;
  y: number;
}
