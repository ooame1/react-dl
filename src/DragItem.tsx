import React, { Component, CSSProperties } from 'react';
import Draggable from './components/Draggable';
import { Key, RequiredLayout, RequiredLayoutItem, RequiredLayoutMap } from './types';

type Props = {
  hidden?: boolean;
  index: number;
  requiredLayout: RequiredLayout | null;
  requiredLayoutItem: RequiredLayoutItem | null;
  requiredLayoutMap: RequiredLayoutMap;
  onDrag: (
    requiredLayoutMap: RequiredLayoutMap,
    layoutKey: Key,
    index: number,
    dragged: number
  ) => void;
  onDragEnd: (
    requiredLayoutMap: RequiredLayoutMap,
    layoutKey: Key,
    index: number,
    dragged: number
  ) => void;
};

type State = {
  startRequiredLayout: RequiredLayout | null;
  startRequiredLayoutItem: RequiredLayoutItem | null;
  startMousePosition: {
    x: number;
    y: number;
  } | null;
};

// 拖拽会影响当前布局，只需更改当前布局对象
class DragItem extends Component<Props, State> {
  startRequiredLayoutMap!: RequiredLayoutMap;

  get hidden(): boolean {
    return !this.props.requiredLayout || !this.props.requiredLayoutItem;
  }

  get dividerHidden(): boolean {
    return this.hidden || this.props.index === this.props.requiredLayout!.children.length - 1;
  }

  handleDragStart = () => {
    this.startRequiredLayoutMap = this.props.requiredLayoutMap!;
  };

  handleDrag = (moved: number) => {
    const { index, onDrag, requiredLayout } = this.props;
    onDrag(this.startRequiredLayoutMap, requiredLayout!.key, index, moved);
  };

  handleDragEnd = (moved: number) => {
    const { index, onDragEnd, requiredLayout } = this.props;
    onDragEnd(this.startRequiredLayoutMap, requiredLayout!.key, index, moved);
  };

  createStyle(): CSSProperties {
    const { width = 0, height = 0, x = 0, y = 0 } = this.props.requiredLayoutItem?.position || {};
    return {
      position: 'absolute',
      border: '1px solid pink',
      transform: `translate(${x}px, ${y}px)`,
      width: `${width}px`,
      height: `${height}px`,
    };
  }

  mixinDraggable(child: any) {
    return (
      <Draggable
        dividerHidden={this.dividerHidden}
        direction={this.props.requiredLayout?.direction || 'horizontal'}
        itemPosition={this.props.requiredLayoutItem?.position!}
        onDragStart={this.handleDragStart}
        onDrag={this.handleDrag}
        onDragEnd={this.handleDragEnd}
      >
        {child}
      </Draggable>
    );
  }

  render() {
    const child = React.Children.only(this.props.children as any);
    const newChild = React.cloneElement(child, {
      hidden: this.hidden,
      style: {
        ...child.props.style,
        ...this.createStyle(),
      },
    });

    return this.mixinDraggable(newChild);
  }
}

export default DragItem;
