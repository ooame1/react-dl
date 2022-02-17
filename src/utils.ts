import React, { ReactNode } from 'react';
import { Layout, Fragment, Item, Shape, LayoutDirection } from './types';

// children缓存
const ChildrenKeyMap = new WeakMap<any, any>();

/**
 * 类型断言
 * @param node 布局节点或片段节点
 */
export function typeToLayout(node: Layout | Fragment): node is Layout {
  return node.type === 'layout';
}

/**
 * 从children中解析初始布局结构
 * @param children react元素的children对象
 */
export function synchronizeLayoutWithChildren(children: ReactNode | undefined): Layout {
  return {
    type: 'layout',
    direction: 'horizontal',
    children:
      React.Children.map<Fragment, any>(
        children,
        (child, index) =>
          ({
            type: 'fragment',
            key: child?.key || index,
          } as Fragment)
      ) || [],
  };
}

/**
 * 从children中获取child
 * @param key
 * @param children
 */
export function getChild(key: number | string, children: ReactNode | undefined) {
  if (!children || typeof children !== 'object') {
    return null;
  }
  let keyChildMap: Map<number | string, any> = null!;
  if (ChildrenKeyMap.has(children)) {
    keyChildMap = ChildrenKeyMap.get(children);
  } else {
    keyChildMap = new Map<number | string, any>();
    React.Children.forEach<any>(children, (child, index) => {
      keyChildMap.set(child?.key || index, child);
    });
    ChildrenKeyMap.set(children, keyChildMap);
  }
  return keyChildMap.get(key);
}

/**
 * 格式化Layout的children
 * @param layoutChildren
 * @param layoutDirection
 * @param layoutShape
 */
export function formatLayoutChildren(
  layoutChildren: Array<Fragment | Layout>,
  layoutDirection: LayoutDirection,
  layoutShape: Shape
): Array<Required<Fragment> | Required<Layout>> {
  const formatChildren: Array<Fragment | Layout> = [...layoutChildren];
  const reShapeChildren: Array<Fragment | Layout> = [];
  let reShapeCount = layoutDirection === 'horizontal' ? layoutShape.width : layoutShape.height;
  for (let i = 0; i < formatChildren.length; i++) {
    const newChild =  {...formatChildren[i]};
    formatChildren[i] = newChild;
    if (layoutDirection === 'vertical' && !newChild.width) {
      newChild.width = layoutShape.width;
    }
    if (layoutDirection === 'horizontal' && !newChild.height) {
      newChild.height = layoutShape.height;
    }
    if (layoutDirection === 'vertical' && newChild.height) {
      reShapeCount -= newChild.height;
    } else if (layoutDirection === 'horizontal' && newChild.width) {
      reShapeCount -= newChild.width;
    } else {
      reShapeChildren.push(newChild);
    }
    if (typeToLayout(newChild) && !newChild.direction) {
      newChild.direction = 'horizontal';
    }
  }
  reShapeChildren.forEach(child => {
    if (layoutDirection === 'vertical') {
      Object.assign(child, {
        height: reShapeCount / reShapeChildren.length,
      });
    } else {
      Object.assign(child, {
        width: reShapeCount / reShapeChildren.length,
      });
    }
  });
  return formatChildren as Array<Required<Fragment> | Required<Layout>>;
}

/**
 * 将树形结构转换为渲染数据
 * @param layout 树形布局数据
 * @param containerShape 父级形状
 * @returns
 */
export function convertLayoutToRenderData(layout: Layout, containerShape: Shape): Array<Item> {
  const result: Array<Item> = [];
  const direction = layout.direction || 'horizontal';
  let offset = 0;
  formatLayoutChildren(layout.children, direction, containerShape).forEach(
    (cur, index) => {
      if (typeToLayout(cur)) {
        result.push(
          ...convertLayoutToRenderData(cur, {
            width: cur.width,
            height: cur.height,
          }).map(item => ({
            ...item,
            x: direction === 'horizontal' ? item.x + offset : item.x,
            y: direction === 'vertical' ? item.y + offset: item.y,
          }))
        );
      } else {
        result.push({
          key: cur.key,
          width: cur.width,
          height: cur.height,
          x: direction === 'horizontal' ? offset : 0,
          y: direction === 'vertical' ? offset : 0,
        });
      }
      if (direction === 'horizontal') {
        offset += cur.width;
      } else {
        offset += cur.height;
      }
    }
  );
  return result;
}
