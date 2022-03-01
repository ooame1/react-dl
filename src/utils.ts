import { CSSProperties } from 'react';
import {
  Layout,
  RequiredLayout,
  Size,
  Direction,
  Item,
  RequiredItem,
  PositionMap,
  Position,
  Offset,
  Key,
} from './types';

// 父布局容器表: 布局节点key -> 父布局容器
type FatherLayoutMap = Map<Key, RequiredLayout>;

// 根布局表: 根布局容器 -> 父布局容器表
type RequiredLayoutToKeyMap = WeakMap<RequiredLayout, FatherLayoutMap>;

// 缓存根布局表
const cacheMap: RequiredLayoutToKeyMap = new WeakMap<RequiredLayout, FatherLayoutMap>();

// 未设置布局方向时使用的默认布局方向
const default_direction: Direction = 'horizontal';

// 最小宽/高
const ITEM_MIN_SIZE = 50;

// 根布局key
export const ROOT_LAYOUT_KEY = '__REACT_DRAG_LAYOUT_ROOT';

/**
 * 类型断言: 判断是布局容器还是布局元素
 * @param node 布局容器或布局元素
 */
export function typeToLayout(node: Layout | Item): node is Layout {
  return node.type === 'layout';
}

/**
 * 合并map
 */
export function assignMap(targetMap: Map<any, any>, ...fromMap: Map<any, any>[]) {
  fromMap.forEach((map) => {
    map.forEach((value, key) => {
      targetMap.set(key, value);
    });
  });
  return targetMap;
}

/**
 * 缓存父布局容器表
 */
export function cacheFatherLayoutMap(
  requiredLayout: RequiredLayout,
  fatherLayoutMap: FatherLayoutMap
) {
  cacheMap.set(requiredLayout, fatherLayoutMap);
}

/**
 * 获取父布局容器表
 */
export function getFatherLayoutMapFromCache(requiredLayout: RequiredLayout) {
  return cacheMap.get(requiredLayout);
}

/**
 * 根据布局元素key和根布局容器获取该布局容器的父容器
 */
export function getFatherLayoutByItemKey(
  itemKey: Key,
  layout: RequiredLayout
): RequiredLayout | undefined {
  const fatherLayoutMap = getFatherLayoutMapFromCache(layout);
  return fatherLayoutMap?.get(itemKey);
}

/**
 * 根据布局元素key查找其在父容器中的位置
 */
export function findChildIndex(fatherLayout: RequiredLayout, childKey: Key) {
  return fatherLayout.children.findIndex((child) => child.key === childKey);
}

/**
 * 将元素位置转换为CSS属性
 */
export function renderPosition(position: Position): CSSProperties {
  const { width, height, x, y } = position;
  return {
    position: 'absolute',
    width: `${width}px`,
    height: `${height}px`,
    top: `${y}px`,
    left: `${x}px`,
  };
}

/**
 * 复制布局元素
 *
 * 不修改原对象
 */
export function cloneItem(item: RequiredItem): RequiredItem {
  return {
    ...item,
  };
}

/**
 * 复制布局容器
 *
 * 不修改原对象
 */
export function cloneLayoutWith(
  layout: RequiredLayout,
  customizer: (child: RequiredLayout) => RequiredLayout | undefined = () => undefined
): RequiredLayout {
  const _layout = customizer(layout);
  if (_layout) {
    return _layout;
  }
  const newLayout: RequiredLayout = {
    ...layout,
    children: [],
  };
  layout.children.forEach((child) => {
    if (typeToLayout(child)) {
      const childLayout = customizer(child);
      if (!childLayout) {
        newLayout.children.push(cloneLayoutWith(child, customizer));
      } else {
        newLayout.children.push(childLayout);
      }
    } else {
      newLayout.children.push(cloneItem(child));
    }
  });
  return newLayout;
}

/**
 * 根据布局容器的宽和高计算每个子节点的宽和高
 */
export function getLayoutChildrenShapes(layout: Layout, shape: Size): Array<Size> {
  const direction: Direction = layout.direction || default_direction;
  const children: Layout['children'] = layout.children || [];
  const shapes: Array<Size> = [];
  const reshapeAttr = direction === 'horizontal' ? 'width' : 'height';
  const unReshapeAttr = direction === 'horizontal' ? 'height' : 'width';
  let reshapeCount = shape[reshapeAttr];
  const shouldReshapeItems: Size[] = [];
  for (let i = 0; i < children.length; i++) {
    const _shape: Size = {} as any;
    const child = children[i];
    if (typeof child[reshapeAttr] === 'number') {
      _shape[reshapeAttr] = <number>child[reshapeAttr];
      reshapeCount -= <number>child[reshapeAttr];
    } else {
      shouldReshapeItems.push(_shape);
    }
    if (typeof child[unReshapeAttr] === 'number') {
      _shape[unReshapeAttr] = <number>child[unReshapeAttr];
    } else {
      _shape[unReshapeAttr] = shape[unReshapeAttr];
    }
    shapes.push(_shape);
  }
  shouldReshapeItems.forEach((_shape) => {
    Object.assign(_shape, {
      [reshapeAttr]: reshapeCount / shouldReshapeItems.length,
    });
  });
  return shapes;
}

/**
 * 填充布局容器和布局元素属性
 */
export function formatLayout(
  layout: Layout,
  shape: Size,
  rootKey: Key = ROOT_LAYOUT_KEY
): [RequiredLayout, FatherLayoutMap] {
  const fatherLayoutMap: FatherLayoutMap = new Map<Key, RequiredLayout>();
  const factShape: Size = {
    width: layout.width ?? shape.width,
    height: layout.height ?? shape.height,
  };
  const requiredLayout: RequiredLayout = {
    key: rootKey,
    type: 'layout',
    direction: layout.direction || default_direction,
    children: [],
    width: factShape.width,
    height: factShape.height,
  };
  const children: Layout['children'] = layout.children || [];
  getLayoutChildrenShapes(layout, factShape).forEach((_shape, index) => {
    const child = children[index];
    if (!child) {
      return;
    }
    if (typeToLayout(child)) {
      const childLayoutKey = `${rootKey}_${index}`;
      fatherLayoutMap.set(childLayoutKey, requiredLayout);
      const [_layout, map] = formatLayout(child, _shape, childLayoutKey);
      requiredLayout.children.push(_layout);
      assignMap(fatherLayoutMap, map);
    } else {
      fatherLayoutMap.set(child.key, requiredLayout);
      requiredLayout.children.push({
        ...child,
        ..._shape,
      });
    }
  });
  cacheFatherLayoutMap(requiredLayout, fatherLayoutMap);
  return [requiredLayout, fatherLayoutMap];
}

/**
 * 计算布局容器中所有布局元素的位置和尺寸
 */
export function convertLayoutToPositionMap(
  layout: RequiredLayout,
  offset: Offset = {
    x: 0,
    y: 0,
  }
): [PositionMap, PositionMap] {
  const itemPositionMap: PositionMap = new Map<string, Position>();
  const layoutPositionMap: PositionMap = new Map<string, Position>();
  layoutPositionMap.set(layout.key, {
    key: layout.key,
    width: layout.width,
    height: layout.height,
    x: offset.x,
    y: offset.y,
  });
  const childOffset: Offset = {
    ...offset,
  };
  layout.children.forEach((child) => {
    if (typeToLayout(child)) {
      const [itemMap, layoutMap] = convertLayoutToPositionMap(child, childOffset);
      assignMap(itemPositionMap, itemMap);
      assignMap(layoutPositionMap, layoutMap);
    } else {
      itemPositionMap.set(child.key, {
        key: child.key,
        width: child.width,
        height: child.height,
        ...childOffset,
      });
    }
    if (layout.direction === 'horizontal') {
      childOffset.x += child.width;
    } else {
      childOffset.y += child.height;
    }
  });
  return [itemPositionMap, layoutPositionMap];
}

/**
 * 修改布局元素尺寸
 *
 * 不改变原对象
 */
export function resizeItem(item: RequiredItem, resize: Size): [RequiredItem, Size] {
  const newItem = cloneItem(item);
  const resized: Size = {
    width: 0,
    height: 0,
  };
  ['width', 'height'].forEach((key) => {
    if (item[key] + resize[key] < ITEM_MIN_SIZE) {
      newItem[key] = ITEM_MIN_SIZE;
      resized[key] = newItem[key] - item[key];
    } else {
      newItem[key] = item[key] + resize[key];
      resized[key] = resize[key];
    }
  });
  return [newItem, resized];
}

/**
 * 修改布局容器或布局元素的宽和高
 *
 * 不修改原对象
 */
export function resizeLayoutOrItem(child: RequiredLayout | RequiredItem, resize: Partial<Size>) {
  const requiredResize: Size = {
    width: 0,
    height: 0,
    ...resize,
  };
  if (typeToLayout(child)) {
    return resizeLayout(child, requiredResize);
  }
  return resizeItem(child, requiredResize);
}

/**
 * 修改布局容器尺寸：
 *   布局方向的尺寸变化按比例分配给每一个子节点，某一子节点超出的部分会继续分配给其他子节点
 *   非布局方向的尺寸变化传递给所有子节点，最终按最小子节点变化计算
 *
 * 不改变原对象
 */
export function resizeLayout(layout: RequiredLayout, resize: Size): [RequiredLayout, Size] {
  const newLayout: RequiredLayout = {
    ...layout,
    children: [],
  };
  const resized: Size = {
    width: 0,
    height: 0,
  };
  const directionAttr = layout.direction === 'horizontal' ? 'width' : 'height';
  const notDirectionAttr = layout.direction === 'vertical' ? 'width' : 'height';
  resized[notDirectionAttr] = Infinity;
  // 非布局方向取可变最小的一个
  layout.children.forEach((child) => {
    const [, _resized] = resizeLayoutOrItem(child, {
      [notDirectionAttr]: resize[notDirectionAttr],
    });
    if (Math.abs(_resized[notDirectionAttr]) < Math.abs(resized[notDirectionAttr])) {
      resized[notDirectionAttr] = _resized[notDirectionAttr];
    }
  });
  newLayout.children = layout.children.map((child) => {
    return resizeLayoutOrItem(child, {
      [notDirectionAttr]: resized[notDirectionAttr],
    })[0];
  });
  // 布局方向按比例分配
  const directionResizeArr = Array(layout.children.length).fill(0);
  let directionAllResize = resize[directionAttr];
  let filledResize = 0;
  let i = 0;
  const overSet = new Set<Layout | Item>();
  while (directionAllResize !== 0 && overSet.size < layout.children.length) {
    const child = layout.children[i];
    if (!overSet.has(child)) {
      const _resize: Size = {
        width: 0,
        height: 0,
        [directionAttr]: directionAllResize / (layout.children.length - overSet.size),
      };
      const [, _resized] = resizeLayoutOrItem(child, _resize);
      if (_resized[directionAttr] !== _resize[directionAttr]) {
        overSet.add(child);
        filledResize += _resized[directionAttr];
      }
      directionResizeArr[i] = _resized[directionAttr];
    }
    if (i === layout.children.length - 1) {
      if (filledResize === resize[directionAttr] - directionAllResize) {
        break;
      }
      i = 0;
      directionAllResize = resize[directionAttr] - filledResize;
    } else {
      i++;
    }
  }
  resized[directionAttr] = directionResizeArr.reduce((pre, cur) => pre + cur, 0);
  newLayout.children = newLayout.children.map((child, index) => {
    return resizeLayoutOrItem(child, {
      [directionAttr]: directionResizeArr[index],
    })[0];
  });
  newLayout.width += resized.width;
  newLayout.height += resized.height;
  return [newLayout, resized];
}

/**
 * 拖拽调整布局元素的宽或高
 *
 * 不修改原对象
 */
export function dragItem(
  fatherLayout: RequiredLayout,
  itemKey: Key,
  dragged: number
): [RequiredLayout, number] {
  const itemIndex = findChildIndex(fatherLayout, itemKey);
  const newLayout: RequiredLayout = cloneLayoutWith(fatherLayout);
  const resizeKey = newLayout.direction === 'horizontal' ? 'width' : 'height';
  let leftIndex = itemIndex;
  let rightIndex = itemIndex + 1;
  let leftWillResize = dragged;
  let rightWillResize = 0;
  while (
    (leftWillResize !== 0 && leftIndex > -1) ||
    (rightWillResize !== 0 && rightIndex < newLayout.children.length)
  ) {
    if (rightWillResize !== 0) {
      const [newChild, _resized] = resizeLayoutOrItem(newLayout.children[rightIndex], {
        [resizeKey]: rightWillResize,
      });
      newLayout.children[rightIndex] = newChild;
      rightWillResize -= _resized[resizeKey];
      if (rightWillResize !== 0) {
        rightIndex++;
      }
    } else {
      const [newChild, _resized] = resizeLayoutOrItem(newLayout.children[leftIndex], {
        [resizeKey]: leftWillResize,
      });
      newLayout.children[leftIndex] = newChild;
      leftWillResize -= _resized[resizeKey];
      rightWillResize -= _resized[resizeKey];
      if (leftWillResize !== 0) {
        leftIndex--;
      }
    }
  }
  if (rightWillResize !== 0) {
    const lastLeftChange = leftWillResize === 0 ? leftIndex : leftIndex + 1;
    leftWillResize -= rightWillResize;
    [newLayout.children[lastLeftChange]] = resizeLayoutOrItem(newLayout.children[lastLeftChange], {
      [resizeKey]: rightWillResize,
    });
  }
  return [newLayout, dragged - leftWillResize];
}

export const noop = () => {};
