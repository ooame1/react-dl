import React, { Component, CSSProperties, MouseEventHandler } from 'react';
import { LayoutDirection, Position } from '../types';
import { renderPosition } from '../utils';

type MousePosition = {
  x: number;
  y: number;
};

type Props = {
  dividerHidden?: boolean;
  itemPosition: Position;
  direction: LayoutDirection;
  onDragStart: () => void;
  onDrag: (moved: number) => void;
  onDragEnd: (moved: number) => void;
};

type State = {};

const DIVIDER_WIDTH = 5;

/**
 * 1. 从child解析出位置
 * 2. 根据方向确定拖拽线的position
 * 3. 监听鼠标按下事件，抛出onDragStart
 * 4. 监听鼠标滑动事件，抛出onDrag
 * 5. 监听鼠标释放事件，抛出onDragEnd
 */
class Draggable extends Component<Props, State> {
  dragStartMouse!: MousePosition;

  ownDocument!: Document;

  getChildPosition(): Position {
    return this.props.itemPosition;
  }

  getDividerPosition(): Position {
    let { width = 0, height = 0, x = 0, y = 0 } = this.getChildPosition() || {};
    const { direction } = this.props;
    x += direction === 'horizontal' ? width - DIVIDER_WIDTH / 2 : 0;
    y += direction === 'vertical' ? height - DIVIDER_WIDTH / 2 : 0;
    width = direction === 'horizontal' ? DIVIDER_WIDTH : width;
    height = direction === 'vertical' ? DIVIDER_WIDTH : height;
    return {
      width,
      height,
      x,
      y,
    };
  }

  getDividerStyle(): CSSProperties {
    const position = this.getDividerPosition();
    const { direction } = this.props;
    return {
      ...renderPosition(position),
      position: 'absolute',
      cursor: direction === 'horizontal' ? 'ew-resize' : 'ns-resize',
    };
  }

  handleDragStart: MouseEventHandler<HTMLDivElement> = (e) => {
    this.dragStartMouse = {
      x: e.clientX,
      y: e.clientY,
    };
    this.ownDocument = e.currentTarget.ownerDocument;
    this.props.onDragStart();
    this.patchEvent(e);
  };

  handleDrag = (e: MouseEvent) => {
    const { direction } = this.props;
    const moved =
      direction === 'horizontal'
        ? e.clientX - this.dragStartMouse.x
        : e.clientY - this.dragStartMouse.y;
    this.props.onDrag(moved);
  };

  handleDragEnd = (e: MouseEvent) => {
    const { direction } = this.props;
    const moved =
      direction === 'horizontal'
        ? e.clientX - this.dragStartMouse.x
        : e.clientY - this.dragStartMouse.y;
    this.props.onDragEnd(moved);
    this.patchEvent(e as any, true);
  };

  patchEvent(e: React.MouseEvent<HTMLDivElement>, remove = false) {
    if (remove) {
      this.ownDocument.removeEventListener('mousemove', this.handleDrag);
      this.ownDocument.removeEventListener('mouseup', this.handleDragEnd);
    } else {
      this.ownDocument = e.currentTarget.ownerDocument;
      e.currentTarget.ownerDocument.addEventListener('mousemove', this.handleDrag);
      e.currentTarget.ownerDocument.addEventListener('mouseup', this.handleDragEnd);
    }
  }

  render() {
    const { children, dividerHidden } = this.props;

    return (
      <>
        {children}
        <div hidden={dividerHidden} style={this.getDividerStyle()} onMouseDown={this.handleDragStart} />
      </>
    );
  }
}

export default Draggable;
