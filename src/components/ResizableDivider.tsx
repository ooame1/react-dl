import React, { CSSProperties } from 'react';
import classNames from 'classnames';
import { Position, RequiredLayout, FatherLayoutMap, MousePosition } from '../types';
import { resizeElement, cloneNodeWith, typeToLayout } from '../utils';
import ResizableHandler from './ResizableHandler';

type Props = {
  active?: boolean;
  className?: string;
  style?: CSSProperties;
  position: Position;
  layout: RequiredLayout;
  baseLayout: RequiredLayout;
  baseFatherLayoutMap: FatherLayoutMap;
  onResizeStart?: () => void;
  onResize?: () => void;
  onResizeEnd?: () => void;
  onLayoutChange: (layout: RequiredLayout) => void;
  onBaseLayoutChange: (layout: RequiredLayout) => void;
};

type State = {};

class ResizableDivider extends React.PureComponent<Props, State> {
  handleResizeStart = (mousePosition: MousePosition) => {
    const { onResizeStart, onBaseLayoutChange, layout } = this.props;
    onBaseLayoutChange(layout);
    onResizeStart?.();
  };

  handleResize = (mousePosition: MousePosition, oldMousePosition: MousePosition) => {
    const { position, baseLayout, onLayoutChange, onResize } = this.props;
    const baseFatherLayout = this.baseFatherLayout();
    const moved =
      baseFatherLayout.direction === 'horizontal'
        ? mousePosition.x - oldMousePosition.x
        : mousePosition.y - oldMousePosition.y;
    const [newFatherLayout] = resizeElement(baseFatherLayout, position.key, moved);
    const newLayout = cloneNodeWith(baseLayout, (child) => {
      if (child === baseFatherLayout) {
        return newFatherLayout;
      }
      return undefined;
    });
    if (typeToLayout(newLayout)) {
      onLayoutChange(newLayout);
    }
    onResize?.();
  };

  handleResizeEnd = (mousePosition: MousePosition, oldMousePosition) => {
    const { onResizeEnd, onBaseLayoutChange, layout } = this.props;
    onBaseLayoutChange(layout);
    onResizeEnd?.();
  };

  createBodyClassNameWhenResizing(): string {
    const baseFatherLayout = this.baseFatherLayout();
    return classNames('react-drag-body-resizing', {
      'react-drag-vertical': baseFatherLayout.direction === 'vertical',
      'react-drag-horizontal': baseFatherLayout.direction === 'horizontal',
    });
  }

  createClassName(): string {
    const { className, active } = this.props;
    const baseFatherLayout = this.baseFatherLayout();
    return classNames(className, 'react-drag-divider', {
      'react-drag-vertical': baseFatherLayout.direction === 'vertical',
      'react-drag-horizontal': baseFatherLayout.direction === 'horizontal',
      'react-drag-active': active,
    });
  }

  createStyle(): CSSProperties {
    const { position, style } = this.props;
    const { x, y, width, height } = position;
    const baseFatherLayout = this.baseFatherLayout();
    if (baseFatherLayout.direction === 'horizontal') {
      return {
        left: `${x + width}px`,
        top: `${y}px`,
        height: `${height}px`,
        ...style,
      };
    }
    return {
      left: `${x}px`,
      top: `${y + height}px`,
      width: `${width}px`,
      ...style,
    };
  }

  baseFatherLayout(): RequiredLayout {
    const { baseFatherLayoutMap, position } = this.props;
    return baseFatherLayoutMap.get(position.key)!;
  }

  render() {
    return (
      <ResizableHandler
        onResize={this.handleResize}
        onResizeEnd={this.handleResizeEnd}
        onResizeStart={this.handleResizeStart}
        bodyClassNameWhenResizing={this.createBodyClassNameWhenResizing()}
      >
        <div className={this.createClassName()} style={this.createStyle()} />
      </ResizableHandler>
    );
  }
}

export default ResizableDivider;
