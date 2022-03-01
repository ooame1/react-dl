import React, { CSSProperties, MouseEventHandler } from 'react';
import { Position, RequiredLayout } from '../types';
import {
  renderPosition,
  findChildIndex,
  getFatherLayoutByItemKey,
  dragItem,
  cloneLayoutWith,
} from '../utils';

type MousePosition = {
  x: number;
  y: number;
};

type Props = {
  position?: Position;
  baseLayout: RequiredLayout;
  layout: RequiredLayout;
  onDragStart?: () => void;
  onDrag?: () => void;
  onDragEnd?: () => void;
  onBaseLayoutChange: (baseLayout: RequiredLayout) => void;
  onLayoutChange: (layout: RequiredLayout) => void;
};

type State = {};

const DIVIDER_WIDTH = 5;

class Draggable extends React.Component<Props, State> {
  dragStartMouse!: MousePosition;

  ownDocument!: Document;

  getDividerPosition(): Position | undefined {
    const { position } = this.props;
    if (!position) {
      return undefined;
    }
    const fatherLayout = this.getCurrentFatherLayout();
    if (!fatherLayout) {
      return undefined;
    }
    const { direction } = fatherLayout;
    let { width, height, x, y } = position;
    x += direction === 'horizontal' ? width - DIVIDER_WIDTH / 2 : 0;
    y += direction === 'vertical' ? height - DIVIDER_WIDTH / 2 : 0;
    width = direction === 'horizontal' ? DIVIDER_WIDTH : width;
    height = direction === 'vertical' ? DIVIDER_WIDTH : height;
    return {
      ...position,
      x,
      y,
      width,
      height,
    };
  }

  getBaseFatherLayout(): RequiredLayout | undefined {
    const { position, baseLayout } = this.props;
    if (!position) {
      return undefined;
    }
    const { key } = position;
    return getFatherLayoutByItemKey(key, baseLayout)!;
  }

  getCurrentFatherLayout(): RequiredLayout | undefined {
    const { position, layout } = this.props;
    if (!position) {
      return undefined;
    }
    const { key } = position;
    return getFatherLayoutByItemKey(key, layout)!;
  }

  handleDragStart: MouseEventHandler<HTMLDivElement> = (e) => {
    this.dragStartMouse = {
      x: e.clientX,
      y: e.clientY,
    };
    this.ownDocument = e.currentTarget.ownerDocument;
    const { onDragStart, onBaseLayoutChange, layout } = this.props;
    onDragStart?.();
    onBaseLayoutChange(layout);
    this.patchEvent(e);
  };

  handleDrag = (e: MouseEvent) => {
    const { position, baseLayout, onLayoutChange } = this.props;
    const currentFatherLayout = this.getCurrentFatherLayout();
    const baseFatherLayout = this.getBaseFatherLayout();
    if (!position || !currentFatherLayout || !baseFatherLayout) {
      return;
    }
    const moved =
      currentFatherLayout.direction === 'horizontal'
        ? e.clientX - this.dragStartMouse.x
        : e.clientY - this.dragStartMouse.y;
    const [newFatherLayout] = dragItem(baseFatherLayout, position.key, moved);
    const newLayout = cloneLayoutWith(baseLayout, (child) => {
      if (child === baseFatherLayout) {
        return newFatherLayout;
      }
      return undefined;
    });
    onLayoutChange(newLayout);
  };

  handleDragEnd = (e: MouseEvent) => {
    const { onBaseLayoutChange, layout } = this.props;
    onBaseLayoutChange(layout);
    this.patchEvent(e as any, true);
  };

  createDividerStyle(): CSSProperties {
    const position = this.getDividerPosition();
    if (!position) {
      return {
        display: 'none',
      };
    }
    const { key } = position;
    const fatherLayout = this.getCurrentFatherLayout()!;
    const itemIndex = findChildIndex(fatherLayout, key);
    if (itemIndex === fatherLayout.children.length - 1) {
      return {
        display: 'none',
      };
    }
    const { direction } = fatherLayout;
    return {
      ...renderPosition(position),
      cursor: direction === 'horizontal' ? 'ew-resize' : 'ns-resize',
    };
  }

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
    const { children } = this.props;
    return (
      <>
        {children}
        <div style={this.createDividerStyle()} onMouseDown={this.handleDragStart} />
      </>
    );
  }
}

export default Draggable;
