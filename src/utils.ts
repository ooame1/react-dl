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
} from './types';

// 根布局key
export const ROOT_LAYOUT_KEY = 'ROOT';

/**
 * 类型断言
 * @param node 布局节点或片段节点
 */
export function typeToLayout(node: Layout | LayoutItem): node is Layout {
  return node.type === 'layout';
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
        subLayoutMap.forEach((value, key) => {
          requiredLayoutMap.set(key, value);
        });
        subLayoutItemMap.forEach((value, key) => {
          requiredLayoutItemMap.set(key, value);
        });
      } else {
        requiredLayoutItemMap.set(cur.key, {
          key: cur.key,
          layout: rootLayoutKey,
          position: subPosition,
        });
      }
    }
  );
  return [requiredLayoutMap, requiredLayoutItemMap];
}
