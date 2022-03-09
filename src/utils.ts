import { CSSProperties } from 'react';
import { ROOT_LAYOUT_KEY, MIN_WIDTH, MIN_HEIGHT, DEFAULT_DIRECTION } from './constants';
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
  FatherLayoutMap,
  DragDirection,
  DragDetail,
  ResizeDetail,
  ScaleDetail,
} from './types';

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
function assignMap(targetMap: Map<any, any>, ...fromMap: Map<any, any>[]) {
  fromMap.forEach((map) => {
    map.forEach((value, key) => {
      targetMap.set(key, value);
    });
  });
  return targetMap;
}

/**
 * 从布局容器构建父布局容器表
 */
export function convertLayoutToFatherLayoutMap(requiredLayout: RequiredLayout): FatherLayoutMap {
  const fatherLayoutMap: FatherLayoutMap = new Map<Key, RequiredLayout>();
  requiredLayout.children.forEach((child) => {
    fatherLayoutMap.set(child.key, requiredLayout);
    if (typeToLayout(child)) {
      const map = convertLayoutToFatherLayoutMap(child);
      assignMap(fatherLayoutMap, map);
    }
  });
  return fatherLayoutMap;
}

/**
 * 从容器布局获取所有分割线对应节点的位置信息
 */
export function convertLayoutToDividerPositions(
  requiredLayout: RequiredLayout,
  positionMap: PositionMap
): Array<Position> {
  const positions: Array<Position> = [];
  requiredLayout.children.forEach((child, index) => {
    if (index !== requiredLayout.children.length - 1) {
      positions.push(positionMap.get(child.key)!);
    }
    if (typeToLayout(child)) {
      const childLayoutPositions = convertLayoutToDividerPositions(child, positionMap);
      positions.push(...childLayoutPositions);
    }
  });
  return positions;
}

/**
 * 从容器布局获取所有交叉点对应节点的位置信息
 *
 * @returns 返回一个元组数组，元组第一项为横向调整节点的位置信息，元组第二项为纵向调整节点的位置信息
 */
export function convertLayoutToPointerPositionTuples(
  requiredLayout: RequiredLayout,
  positionMap: PositionMap
): Array<[Position, Position]> {
  const positionTuples: Array<[Position, Position]> = [];
  requiredLayout.children.forEach((child, index) => {
    if (!typeToLayout(child)) {
      return;
    }
    const lastChild = requiredLayout.children[index - 1];
    const nextChild = requiredLayout.children[index + 1];
    if (lastChild) {
      child.children.forEach((_child, _index) => {
        if (_index === child.children.length - 1) {
          return;
        }
        const lastChildPosition = positionMap.get(lastChild.key)!;
        const curPosition = positionMap.get(_child.key)!;
        if (requiredLayout.direction === 'horizontal') {
          positionTuples.push([lastChildPosition, curPosition]);
        } else {
          positionTuples.push([curPosition, lastChildPosition]);
        }
      });
    }
    if (nextChild) {
      child.children.forEach((_child, _index) => {
        if (_index === child.children.length - 1) {
          return;
        }
        const childPosition = positionMap.get(child.key)!;
        const curPosition = positionMap.get(_child.key)!;
        if (requiredLayout.direction === 'horizontal') {
          positionTuples.push([childPosition, curPosition]);
        } else {
          positionTuples.push([curPosition, childPosition]);
        }
      });
    }
    const childPositionTuples = convertLayoutToPointerPositionTuples(child, positionMap);
    positionTuples.push(...childPositionTuples);
  });
  return positionTuples;
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
function cloneItem(item: RequiredItem): RequiredItem {
  return {
    ...item,
  };
}

/**
 * 复制布局容器
 *
 * 不修改原对象
 */
function cloneNodeWith(
  node: RequiredLayout | RequiredItem,
  customizer: (
    child: RequiredLayout | RequiredItem
  ) => RequiredLayout | RequiredItem | undefined = () => undefined
): RequiredLayout | RequiredItem {
  const _node = customizer(node);
  if (_node) {
    return _node;
  }
  if (!typeToLayout(node)) {
    return cloneItem(node);
  }
  const newLayout: RequiredLayout = {
    ...node,
    children: [],
  };
  node.children.forEach((child) => {
    newLayout.children.push(cloneNodeWith(child, customizer));
  });
  return newLayout;
}

/**
 * 根据布局容器的宽和高计算每个子节点的宽和高
 */
function getLayoutChildrenShapes(layout: Layout, shape: Size): Array<Size> {
  const direction: Direction = layout.direction || DEFAULT_DIRECTION;
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
): RequiredLayout {
  const factShape: Size = {
    width: layout.width ?? shape.width,
    height: layout.height ?? shape.height,
  };
  const requiredLayout: RequiredLayout = {
    key: rootKey,
    type: 'layout',
    direction: layout.direction || DEFAULT_DIRECTION,
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
      const _layout = formatLayout(child, _shape, childLayoutKey);
      requiredLayout.children.push(_layout);
    } else {
      requiredLayout.children.push({
        ...child,
        ..._shape,
      });
    }
  });
  return requiredLayout;
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
): PositionMap {
  const positionMap: PositionMap = new Map<string, Position>();
  positionMap.set(layout.key, {
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
      const map = convertLayoutToPositionMap(child, childOffset);
      assignMap(positionMap, map);
    } else {
      positionMap.set(child.key, {
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
  return positionMap;
}

/**
 * 修改布局元素尺寸
 *
 * 不改变原对象
 */
function scaleItem(item: RequiredItem, resize: Size): [RequiredItem, Size] {
  const newItem = cloneItem(item);
  const resized: Size = {
    width: 0,
    height: 0,
  };
  const minSize = [MIN_WIDTH, MIN_HEIGHT];
  ['width', 'height'].forEach((key, index) => {
    const min = minSize[index];
    if (item[key] + resize[key] < min) {
      newItem[key] = min;
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
function scaleNode(child: RequiredLayout | RequiredItem, resize: Partial<Size>) {
  const requiredResize: Size = {
    width: 0,
    height: 0,
    ...resize,
  };
  if (typeToLayout(child)) {
    return scaleLayout(child, requiredResize);
  }
  return scaleItem(child, requiredResize);
}

/**
 * 修改布局容器尺寸：
 *   布局方向的尺寸变化按比例分配给每一个子节点，某一子节点超出的部分会继续分配给其他子节点
 *   非布局方向的尺寸变化传递给所有子节点，最终按最小子节点变化计算
 *
 * 不改变原对象
 */
function scaleLayout(layout: RequiredLayout, resize: Size): [RequiredLayout, Size] {
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
    const [, _resized] = scaleNode(child, {
      [notDirectionAttr]: resize[notDirectionAttr],
    });
    if (Math.abs(_resized[notDirectionAttr]) < Math.abs(resized[notDirectionAttr])) {
      resized[notDirectionAttr] = _resized[notDirectionAttr];
    }
  });
  newLayout.children = layout.children.map((child) => {
    return scaleNode(child, {
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
      const [, _resized] = scaleNode(child, _resize);
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
    return scaleNode(child, {
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
function resizeElement(
  fatherLayout: RequiredLayout,
  itemKey: Key,
  dragged: number
): [RequiredLayout, number] {
  const itemIndex = findChildIndex(fatherLayout, itemKey);
  const newLayout: RequiredLayout = cloneNodeWith(fatherLayout) as RequiredLayout;
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
      const [newChild, _resized] = scaleNode(newLayout.children[rightIndex], {
        [resizeKey]: rightWillResize,
      });
      newLayout.children[rightIndex] = newChild;
      rightWillResize -= _resized[resizeKey];
      if (rightWillResize !== 0) {
        rightIndex++;
      }
    } else {
      const [newChild, _resized] = scaleNode(newLayout.children[leftIndex], {
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
    [newLayout.children[lastLeftChange]] = scaleNode(newLayout.children[lastLeftChange], {
      [resizeKey]: rightWillResize,
    });
  }
  return [newLayout, dragged - leftWillResize];
}

/**
 * 从布局中删除一个节点
 *
 * 不修改原对象
 */
function removeElement(layout: RequiredLayout, removedItemKey: Key): RequiredLayout {
  const fatherLayoutMap = convertLayoutToFatherLayoutMap(layout);
  const fatherLayout = fatherLayoutMap.get(removedItemKey);
  if (!fatherLayout) {
    return cloneNodeWith(layout) as RequiredLayout;
  }
  const removedItem = fatherLayout.children.find((c) => c.key === removedItemKey)!;
  if (fatherLayout.children.length === 2 && fatherLayout !== layout) {
    const anotherChild = fatherLayout.children.find((c) => c.key !== removedItemKey)!;
    const [newChild] = scaleNode(anotherChild, {
      width: fatherLayout.width - anotherChild.width,
      height: fatherLayout.height - anotherChild.height,
    });
    return cloneNodeWith(layout, (child) => {
      if (child === fatherLayout) {
        return newChild;
      }
      return undefined;
    }) as RequiredLayout;
  }
  let newFatherLayout: RequiredLayout = {
    ...fatherLayout,
    children: fatherLayout.children.filter((c) => c.key !== removedItemKey),
    width:
      fatherLayout.direction === 'horizontal'
        ? fatherLayout.width - removedItem.width
        : fatherLayout.width,
    height:
      fatherLayout.direction === 'vertical'
        ? fatherLayout.height - removedItem.height
        : fatherLayout.height,
  };
  [newFatherLayout] = scaleLayout(newFatherLayout, {
    width: fatherLayout.direction === 'horizontal' ? removedItem.width : 0,
    height: fatherLayout.direction === 'vertical' ? removedItem.height : 0,
  });
  return cloneNodeWith(layout, (child) => {
    if (child === fatherLayout) {
      return newFatherLayout;
    }
    return undefined;
  }) as RequiredLayout;
}

/**
 * 拖拽调整布局
 *
 * 不修改原对象
 */
function dragElement(
  layout: RequiredLayout,
  draggedItemKey: Key,
  targetItemKey: Key,
  dragDirection: DragDirection
): RequiredLayout {
  const layoutWithoutDraggedItem = removeElement(layout, draggedItemKey);
  const fatherLayoutMap = convertLayoutToFatherLayoutMap(layoutWithoutDraggedItem);
  const fatherLayout = fatherLayoutMap.get(targetItemKey)!;
  let newFatherLayout: RequiredLayout = null!;
  if (dragDirection === 'center') {
    // 替换
    newFatherLayout = cloneNodeWith(fatherLayout, (child) => {
      if (child.key === targetItemKey) {
        return {
          ...child,
          key: draggedItemKey,
        };
      }
      return undefined;
    }) as RequiredLayout;
  } else if (
    (fatherLayout.direction === 'horizontal' && ['left', 'right'].includes(dragDirection)) ||
    (fatherLayout.direction === 'vertical' && ['top', 'bottom'].includes(dragDirection))
  ) {
    // 新增
    const targetIndex = findChildIndex(fatherLayout, targetItemKey);
    const targetChild = fatherLayout.children[targetIndex] as RequiredItem;
    const [newTargetChild] = scaleItem(targetChild, {
      width: fatherLayout.direction === 'horizontal' ? -targetChild.width / 2 : 0,
      height: fatherLayout.direction === 'vertical' ? -targetChild.height / 2 : 0,
    });
    const draggedChild: RequiredItem = {
      key: draggedItemKey,
      type: 'item',
      width: fatherLayout.direction === 'horizontal' ? targetChild.width / 2 : targetChild.width,
      height: fatherLayout.direction === 'vertical' ? targetChild.height / 2 : targetChild.height,
    };
    const { children } = fatherLayout;
    const before = children.filter((_, i) => i < targetIndex);
    const after = children.filter((_, i) => i > targetIndex);
    newFatherLayout = cloneNodeWith({
      ...fatherLayout,
      children: ['left', 'top'].includes(dragDirection)
        ? [...before, draggedChild, newTargetChild, ...after]
        : [...before, newTargetChild, draggedChild, ...after],
    }) as RequiredLayout;
  } else {
    // 新增布局
    const targetIndex = findChildIndex(fatherLayout, targetItemKey);
    const targetChild = fatherLayout.children[targetIndex] as RequiredItem;
    const direction: Direction =
      fatherLayout.direction === 'horizontal' ? 'vertical' : 'horizontal';
    const [newTargetChild] = scaleItem(targetChild, {
      width: direction === 'horizontal' ? -targetChild.width / 2 : 0,
      height: direction === 'vertical' ? -targetChild.height / 2 : 0,
    });
    const draggedChild: RequiredItem = {
      key: draggedItemKey,
      type: 'item',
      width: direction === 'horizontal' ? targetChild.width / 2 : targetChild.width,
      height: direction === 'vertical' ? targetChild.height / 2 : targetChild.height,
    };
    const newLayout: RequiredLayout = {
      key: `${fatherLayout.key}_${targetIndex}`,
      type: 'layout',
      direction,
      width: targetChild.width,
      height: targetChild.height,
      children: ['left', 'top'].includes(dragDirection)
        ? [draggedChild, newTargetChild]
        : [newTargetChild, draggedChild],
    };
    newFatherLayout = cloneNodeWith(fatherLayout, (child) => {
      if (child === targetChild) {
        return newLayout;
      }
      return undefined;
    }) as RequiredLayout;
  }
  return cloneNodeWith(layoutWithoutDraggedItem, (child) => {
    if (child === fatherLayout) {
      return newFatherLayout;
    }
    return undefined;
  }) as RequiredLayout;
}

export function applyScale(scaleDetail: ScaleDetail): RequiredLayout {
  const { baseLayout, size, oldSize } = scaleDetail;
  const scale: Size = {
    width: size.width - oldSize.width,
    height: size.height - oldSize.height,
  };
  return scaleLayout(baseLayout, scale)[0];
}

export function applyResize(resizeDetail: ResizeDetail): RequiredLayout {
  const { baseLayout, mousePosition, oldMousePosition, resizeWidthNode, resizeHeightNode } =
    resizeDetail;
  let newLayout: RequiredLayout = baseLayout;
  const resizeWidth = mousePosition.x - oldMousePosition.x;
  const resizeHeight = mousePosition.y - oldMousePosition.y;
  if (resizeWidth !== 0 && resizeWidthNode) {
    const fatherLayoutMap = convertLayoutToFatherLayoutMap(newLayout);
    const fatherLayout = fatherLayoutMap.get(resizeWidthNode.key)!;
    const [newFatherLayout] = resizeElement(fatherLayout, resizeWidthNode.key, resizeWidth);
    newLayout = cloneNodeWith(newLayout, (child) => {
      if (child === fatherLayout) {
        return newFatherLayout;
      }
      return undefined;
    }) as RequiredLayout;
  }
  if (resizeHeight !== 0 && resizeHeightNode) {
    const fatherLayoutMap = convertLayoutToFatherLayoutMap(newLayout);
    const fatherLayout = fatherLayoutMap.get(resizeHeightNode.key)!;
    const [newFatherLayout] = resizeElement(fatherLayout, resizeHeightNode.key, resizeHeight);
    newLayout = cloneNodeWith(newLayout, (child) => {
      if (child === fatherLayout) {
        return newFatherLayout;
      }
      return undefined;
    }) as RequiredLayout;
  }
  return newLayout;
}

export function applyDrag(dragDetail: DragDetail): RequiredLayout {
  const { layout, draggedItem, targetItem, dragDirection } = dragDetail;
  return dragElement(layout, draggedItem.key, targetItem.key, dragDirection);
}

export const noop = () => {};
