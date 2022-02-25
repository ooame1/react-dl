import { CSSProperties } from 'react';
import {
  Layout,
  LayoutItem,
  Position,
  Size,
  LayoutDirection,
  RequiredLayoutMap,
  RequiredLayoutItemMap,
  RequiredLayout,
  Key,
  RequiredLayoutItem,
  Resize,
} from './types';

// 根布局key
export const ROOT_LAYOUT_KEY = 'ROOT';

// 每个布局元素的最小宽/高
export const MIN_SIZE = 50;

/**
 * 类型断言
 * @param node 布局节点或片段节点
 */
export function typeToLayout(node: Layout | LayoutItem): node is Layout {
  return node.type === 'layout';
}

/**
 * 复制布局容器
 * @param requiredLayout 布局容器
 * @returns 新的布局容器
 */
export function cloneRequiredLayout(requiredLayout: RequiredLayout): RequiredLayout {
  return {
    ...requiredLayout,
    children: [...requiredLayout.children],
    position: {
      ...requiredLayout.position,
    },
  };
}

/**
 * 复制布局单位
 * @param requiredLayoutItem 布局单位
 * @returns 新的布局单位
 */
export function cloneRequiredLayoutItem(
  requiredLayoutItem: RequiredLayoutItem
): RequiredLayoutItem {
  return {
    ...requiredLayoutItem,
    position: {
      ...requiredLayoutItem.position,
    },
  };
}

/**
 * 复制布局容器表
 * @param requiredLayoutMap
 * @returns
 */
export function cloneRequiredLayoutMap(requiredLayoutMap: RequiredLayoutMap): RequiredLayoutMap {
  return new Map(requiredLayoutMap);
}

/**
 * 格式化Layout的children
 * @param layoutChildren
 * @param layoutDirection
 * @param layoutShape
 */
export function formatLayoutChildren(
  layoutChildren: Array<LayoutItem | Layout>,
  layoutDirection: LayoutDirection,
  layoutShape: Size
): Array<Required<LayoutItem> | Required<Layout>> {
  const formatChildren: Array<LayoutItem | Layout> = [...layoutChildren];
  const reShapeChildren: Array<LayoutItem | Layout> = [];
  let reShapeCount = layoutDirection === 'horizontal' ? layoutShape.width : layoutShape.height;
  for (let i = 0; i < formatChildren.length; i++) {
    const newChild = { ...formatChildren[i] };
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
  reShapeChildren.forEach((child) => {
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
  return formatChildren as Array<Required<LayoutItem> | Required<Layout>>;
}

/**
 * 将布局参数转换为内部布局对象
 * @param layout 布局参数
 * @param position 布局容器位置
 * @param rootLayoutKey 该布局容器的键
 * @returns
 */
export function convertLayoutToMap(
  layout: Layout,
  position: Position,
  rootLayoutKey = ROOT_LAYOUT_KEY
): [RequiredLayoutMap, RequiredLayoutItemMap] {
  const requiredLayoutMap: RequiredLayoutMap = new Map<Key, RequiredLayout>();
  const requiredLayoutItemMap: RequiredLayoutItemMap = new Map<Key, RequiredLayoutItem>();
  const direction = layout.direction || 'horizontal';
  const requiredLayout: RequiredLayout = {
    key: rootLayoutKey,
    position,
    direction,
    children: [],
  };
  let offset = direction === 'horizontal' ? position.x : position.y;
  requiredLayoutMap.set(rootLayoutKey, requiredLayout);
  formatLayoutChildren(layout.children, layout.direction || 'horizontal', position).forEach(
    (cur, index) => {
      const subPosition: Position = {
        width: cur.width,
        height: cur.height,
        x: direction === 'horizontal' ? offset : position.x,
        y: direction === 'horizontal' ? position.y : offset,
      };
      offset += direction === 'horizontal' ? cur.width : cur.height;
      if (typeToLayout(cur)) {
        const layoutKey = `${rootLayoutKey}_${index}`;
        const [subLayoutMap, subLayoutItemMap] = convertLayoutToMap(cur, subPosition, layoutKey);
        requiredLayout.children.push(layoutKey);
        mergeRequiredLayoutMap(requiredLayoutMap, subLayoutMap);
        mergeRequiredLayoutItemMap(requiredLayoutItemMap, subLayoutItemMap);
      } else {
        const requiredLayoutItem: RequiredLayoutItem = {
          key: cur.key,
          layout: rootLayoutKey,
          position: subPosition,
        };
        requiredLayoutItemMap.set(cur.key, requiredLayoutItem);
        requiredLayout.children.push(requiredLayoutItem);
      }
    }
  );
  return [requiredLayoutMap, requiredLayoutItemMap];
}

export function convertMapToLayout(
  requiredLayoutMap: RequiredLayoutMap,
  rootLayoutKey = ROOT_LAYOUT_KEY
): Layout {
  const requiredLayout: RequiredLayout = requiredLayoutMap.get(rootLayoutKey)!;
  const layout: Layout = {
    type: 'layout',
    width: requiredLayout.position.width,
    height: requiredLayout.position.height,
    children: [],
    direction: requiredLayout.direction,
  };
  requiredLayout.children.forEach((cur) => {
    if (typeof cur === 'string') {
      layout.children.push(convertMapToLayout(requiredLayoutMap, cur));
    } else {
      layout.children.push({
        type: 'fragment',
        width: cur.position.width,
        height: cur.position.height,
        key: cur.key,
      });
    }
  });
  return layout;
}

// 拖拽调整宽/高
export function dragElement(
  requiredLayoutMap: RequiredLayoutMap,
  dragLayoutKey: Key,
  dragItemIndex: number,
  dragged: number
): [RequiredLayoutMap, number] {
  const newMap: RequiredLayoutMap = new Map<Key, RequiredLayout>();
  const newLayout = cloneRequiredLayout(requiredLayoutMap.get(dragLayoutKey)!);
  const resizeKey = newLayout.direction === 'horizontal' ? 'width' : 'height';
  let leftIndex = dragItemIndex;
  let rightIndex = dragItemIndex + 1;
  let leftShouldResize = dragged;
  let rightShouldResize = 0;
  while (leftIndex > -1 && rightIndex < newLayout.children.length && leftShouldResize !== 0) {
    const leftChild = newLayout.children[leftIndex];
    const leftResize: Resize = {
      width: 0,
      height: 0,
      [resizeKey]: leftShouldResize,
    };
    if (typeof leftChild === 'string') {
      const [map, resized] = resizeLayout(requiredLayoutMap, leftChild, leftResize);
      leftShouldResize -= resized[resizeKey];
      rightShouldResize -= resized[resizeKey];
      mergeRequiredLayoutMap(newMap, map);
      if (resized[resizeKey] !== leftResize[resizeKey]) {
        leftIndex --;
      }
    } else {
      const [item, resized] = resizeLayoutItem(leftChild, leftResize);
      leftShouldResize -= resized[resizeKey];
      rightShouldResize -= resized[resizeKey];
      newLayout.children[leftIndex] = item;
      if (resized[resizeKey] !== leftResize[resizeKey]) {
        leftIndex --;
      }
    }
    while (rightIndex < newLayout.children.length && rightShouldResize !== 0) {
      const rightChild = newLayout.children[rightIndex];
      const rightResize: Resize = {
        width: 0,
        height: 0,
        [resizeKey]: rightShouldResize,
      };
      if (typeof rightChild === 'string') {
        const [map, resized] = resizeLayout(requiredLayoutMap, rightChild, rightResize);
        rightShouldResize -= resized[resizeKey];
        mergeRequiredLayoutMap(newMap, map);
        if (resized[resizeKey] !== rightResize[resizeKey]) {
          rightIndex ++;
        }
      } else {
        const [item, resized] = resizeLayoutItem(rightChild, rightResize);
        rightShouldResize -= resized[resizeKey];
        newLayout.children[rightIndex] = item;
        if (resized[resizeKey] !== rightResize[resizeKey]) {
          rightIndex ++;
        }
      }
    }
    if (rightShouldResize !== 0) {
      const index = leftChild === newLayout.children[leftIndex] ? leftIndex : (leftIndex + 1);
      const child = newLayout.children[index];
      if (typeof child === 'string') {
        const [map] = resizeLayout(newMap, child, {
          width: 0,
          height: 0,
          [resizeKey]: -rightShouldResize,
        });
        mergeRequiredLayoutMap(newMap, map);
      } else {
        const [item] = resizeLayoutItem(child, {
          width: 0,
          height: 0,
          [resizeKey]: -rightShouldResize,
        });
        newLayout.children[index] = item;
      }
      leftShouldResize += rightShouldResize;
    }
  }
  newMap.set(dragLayoutKey, newLayout);
  return [newMap, dragged - leftShouldResize];
}

// 移动元素
export function moveElement() {}

export function moveLayout(requiredLayoutMap: RequiredLayoutMap, layoutKey: Key) {
}

export function mergeRequiredLayoutItemMap(baseItemMap: RequiredLayoutItemMap, itemMap: RequiredLayoutItemMap) {
  itemMap.forEach((value, key) => {
    baseItemMap.set(key, value);
  });
}

export function mergeRequiredLayoutMap(baseMap: RequiredLayoutMap, map: RequiredLayoutMap) {
  map.forEach((value, key) => {
    baseMap.set(key, value);
  });
}

/**
 * 修改一个布局元素的尺寸
 * @param requiredLayoutItem 需要修改尺寸的布局元素
 * @param resize 需要修改的尺寸
 * @returns 更新尺寸后的布局元素、实际更新的尺寸
 */
export function resizeLayoutItem(requiredLayoutItem: RequiredLayoutItem, resize: Resize): [RequiredLayoutItem, Resize] {
  const newItem = cloneRequiredLayoutItem(requiredLayoutItem);
  const resized: Resize = {
    width: 0,
    height: 0,
  };
  const { position } = newItem;
  ['width', 'height'].forEach((key) => {
    if (resize[key] < 0 && resize[key] + position[key] < MIN_SIZE) {
      resized[key] = MIN_SIZE - position[key];
      position[key] = MIN_SIZE;
    } else {
      resized[key] = resize[key];
      position[key] += resize[key];
    }
  });
  return [newItem, resized];
}

/**
 * 修改一个布局容器的尺寸。按当前比例调整元素尺寸，元素到达极限尺寸后附加到其他元素。
 * @param requiredLayoutMap 所有的布局容器
 * @param layoutKey 需要修改尺寸的布局容器的键
 * @param resize 需要修改的尺寸
 * @returns 所有更新了尺寸的布局容器、实际更新的尺寸
 */
export function resizeLayout(requiredLayoutMap: RequiredLayoutMap, layoutKey: Key, resize: Resize): [RequiredLayoutMap, Resize] {
  const newMap: RequiredLayoutMap = new Map<Key, RequiredLayout>();
  const layout = requiredLayoutMap.get(layoutKey)!;
  const newLayout = cloneRequiredLayout(layout);
  const resized: Resize = {
    width: 0,
    height: 0,
  };
  // 不用更新位置
  ['width', 'height'].forEach((key) => {
    let count = newLayout.children.length;
    let size = resize[key];
    let nextSize = 0;
    let i = 0;
    const overSet = new Set<number>();
    while (count > 0 && size !== 0) {
      const avgResize: Resize = {
        width: 0,
        height: 0,
        [key]: size / count,
      }
      const child = newLayout.children[i];
      if (!overSet.has(i)) {
        if (typeof child === 'string') {
          const [map, actResize] = resizeLayout(requiredLayoutMap, child, avgResize);
          if (actResize[key] !== avgResize[key]) {
            overSet.add(i);
            nextSize += avgResize[key] - actResize[key];
          }
          mergeRequiredLayoutMap(newMap, map);
        } else {
          const [item, actResize] = resizeLayoutItem(child, avgResize);
          if (actResize[key] !== avgResize[key]) {
            overSet.add(i);
            nextSize += avgResize[key] - actResize[key];
          }
          newLayout.children[i] = item;
        }
      }
      i++;
      if (i === newLayout.children.length) {
        count = newLayout.children.length - overSet.size;
        size = nextSize;
      }
    }
    resized[key] = resize[key] - size;
    newLayout.position[key] += resized[key];
  });
  newMap.set(layoutKey, newLayout);
  return [newMap, resized];
}

// 将位置渲染为样式
export function renderPosition(position: Position): CSSProperties {
  const { width, height, x, y } = position;
  return {
    width: `${width}px`,
    height: `${height}px`,
    top: `${y}px`,
    left: `${x}px`,
  };
}

// 从样式解析出位置
export function parsePosition(style: CSSProperties): Position {
  const { width = '0px', height = '0px', top = '0px', left = '0px' } = style;
  return {
    width: parseInt(width as string, 10) || 0,
    height: parseInt(height as string, 10) || 0,
    x: parseInt(left as string, 10) || 0,
    y: parseInt(top as string, 10) || 0,
  };
}

export const noop = () => {};
