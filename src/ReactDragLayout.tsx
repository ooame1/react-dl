import React, { Component, PropsWithChildren, createRef, CSSProperties, ReactElement } from 'react';
import DragItem from './DragItem';
import { convertLayoutToMap } from './utils';
import {
  Layout,
  RequiredLayoutMap,
  Size,
  RequiredLayoutItemMap,
  Key,
  RequiredLayout,
  RequiredLayoutItem,
} from './types';

type Props = {
  layout?: Layout;
  onDrag?: () => void;
  onDividerDragging?: () => void;
  onDividerDragEnd?: () => void;
  onResize?: () => void;
};

type State = {
  layout: Layout;
  containerShape?: Size;
  requiredLayoutMap: RequiredLayoutMap;
  requiredLayoutItemMap: RequiredLayoutItemMap;
};

class ReactDragLayout extends Component<Props, State> {
  containerRef = createRef<HTMLDivElement>();

  containerStyle: CSSProperties = {
    height: '100%',
    width: '100%',
    position: 'relative',
  };

  state: State = {
    layout: this.props.layout || {
      children: [],
      direction: 'horizontal',
      type: 'layout',
    },
    requiredLayoutMap: new Map<Key, RequiredLayout>(),
    requiredLayoutItemMap: new Map<Key, RequiredLayoutItem>(),
  };

  componentDidMount() {
    this.setState({
      containerShape: {
        width: this.containerRef.current!.clientWidth,
        height: this.containerRef.current!.clientHeight,
      },
    });
  }

  static getDerivedStateFromProps(
    nextProps: PropsWithChildren<Props>,
    prevState: State
  ): Partial<State> {
    if (!prevState.containerShape) {
      return {
        layout: nextProps.layout || prevState.layout,
      };
    }
    const layout = nextProps.layout || prevState.layout;
    const position = {
      x: 0,
      y: 0,
      ...prevState.containerShape,
    };
    const [requiredLayoutMap, requiredLayoutItemMap] = convertLayoutToMap(layout, position);
    return {
      layout,
      requiredLayoutMap,
      requiredLayoutItemMap,
    };
  }

  getRequiredLayout(key: Key | null): RequiredLayout | null {
    if (!key || !this.state.requiredLayoutMap.has(key)) {
      return null;
    }
    return this.state.requiredLayoutMap.get(key)!;
  }

  getRequiredLayoutItem(key: Key | null): RequiredLayoutItem | null {
    if (!key || !this.state.requiredLayoutItemMap.has(key)) {
      return null;
    }
    return this.state.requiredLayoutItemMap.get(key)!;
  }

  processLayoutItem(child: ReactElement<any>) {
    const requiredLayoutItem = this.getRequiredLayoutItem(child.key as string);
    const requiredLayout = requiredLayoutItem
      ? this.getRequiredLayout(requiredLayoutItem.layout)
      : null;
    return (
      <DragItem
        key={child.key}
        requiredLayout={requiredLayout}
        requiredLayoutItem={requiredLayoutItem}
      >
        {child}
      </DragItem>
    );
  }

  render() {
    return (
      <div ref={this.containerRef} style={this.containerStyle}>
        {React.Children.map(this.props.children, (child) => this.processLayoutItem(child as any))}
      </div>
    );
  }
}

export default ReactDragLayout;
