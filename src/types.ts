export type Key = string;

export type Direction = 'vertical' | 'horizontal';

export type DragDirection = 'top' | 'right' | 'bottom' | 'left' | 'center';

// 盒子
export type Size = {
  width: number;
  height: number;
};

// 位置
export type Offset = {
  x: number;
  y: number;
};

// 布局容器
export type Layout = {
  key?: Key;
  type: 'layout';
  children?: Array<Layout | Item>;
  direction?: Direction;
  width?: number;
  height?: number;
};

// 布局元素
export type Item = {
  key: Key;
  type: 'item';
  width?: number;
  height?: number;
};

// 布局容器
export type RequiredLayout = {
  key: Key;
  type: 'layout';
  children: Array<RequiredLayout | RequiredItem>;
  direction: Direction;
  width: number;
  height: number;
}

// 布局元素
export type RequiredItem = {
  key: Key;
  type: 'item';
  width: number;
  height: number;
};

// 布局元素位置和尺寸
export type Position = {
  key: Key;
} & Size & Offset;

// 位置信息表
export type PositionMap = Map<Key, Position>;

// 父布局容器表
export type FatherLayoutMap = Map<Key, RequiredLayout>;

export type MousePosition = {
  x: number;
  y: number;
};

export type ResizeDetail = {
  baseLayout: RequiredLayout;
  mousePosition: MousePosition;
  oldMousePosition: MousePosition;
  resizeItemKey: Key | [Key, Key];
};
