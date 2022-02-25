// layout或layoutItem的唯一键
export type Key = string;

// 布局方向
export type LayoutDirection = 'vertical' | 'horizontal';

// 盒子
export type Size = {
  width: number;
  height: number;
}

export type Resize = {
  width: number;
  height: number;
}

export type Reposition = {
  x: number;
  y: number;
}

// 布局节点
export type Layout = {
  type: 'layout';
  width?: number;
  height?: number;
  children: Array<LayoutItem | Layout>;
  direction?: LayoutDirection;
}

// 片段节点
export type LayoutItem = {
  type: 'fragment';
  width?: number;
  height?: number;
  key: Key;
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

/**
 * 数据结构
 * 1. 树状结构
 * 优点: 不需要维护position
 * 缺点: 难以复制和更新父级layout
 * {
 *   type: 'layout';
 *   width: number;
 *   height: number;
 *   direction: 'horizontal',
 *   children: [
 *     {
 *       type: 'fragment',
 *       width: number,
 *       height: number,
 *       key: string,
 *     }
 *   ]
 * }
 * 2. 图状结构
 * 优点: 容易复制和精确更新layout
 * 缺点: 更新时难以维护position
 */
