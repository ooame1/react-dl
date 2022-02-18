// layout或layoutItem的唯一键
export type Key = string;

// 布局方向
export type LayoutDirection = 'vertical' | 'horizontal';

// 盒子
export type Size = {
  width: number;
  height: number;
}

// 布局节点
export type Layout = {
  type: 'layout';
  width?: number;
  height?: number;
  children: Array<LayoutItem | Layout>;
  direction?: LayoutDirection;
  father?: Layout;
  index?: number;
}

// 片段节点
export type LayoutItem = {
  type: 'fragment';
  width?: number;
  height?: number;
  key: Key;
  father: Layout;
  index: number;
}

// 位置
export type Position = {
  width: number;
  height: number;
  x: number;
  y: number;
}

// 包含位置的布局
export type RequiredLayout = {
  key: Key;
  direction: LayoutDirection;
  position: Position;
  children: Array<Key | RequiredLayoutItem>;
}

// 包含位置信息的布局单位
export type RequiredLayoutItem = {
  key: Key;
  position: Position;
  layout: Key;
}

// 保存全部布局的表
export type RequiredLayoutMap = Map<Key, RequiredLayout>;

// 保存全部布局单位的表
export type RequiredLayoutItemMap = Map<Key, RequiredLayoutItem>;
