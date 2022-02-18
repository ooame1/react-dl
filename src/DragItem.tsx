import React, { Component, CSSProperties } from 'react';
import { RequiredLayout, RequiredLayoutItem } from './types';

type Props = {
  hidden?: boolean;
  requiredLayout: RequiredLayout | null;
  requiredLayoutItem: RequiredLayoutItem | null;
};

type State = {};

// 拖拽会影响当前布局，只需更改当前布局对象
class DragItem extends Component<Props, State> {
  state: State = {};

  get hidden(): boolean {
    return !this.props.requiredLayout || !this.props.requiredLayoutItem;
  }

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

  createDividerStyle(): CSSProperties {
    let { width = 0, height = 0, x = 0, y = 0 } = this.props.requiredLayoutItem?.position || {};
    const direction = this.props.requiredLayout?.direction || 'horizontal';
    x += direction === 'horizontal' ? width - 2 : 0;
    y += direction === 'vertical' ? height - 2 : 0;
    width = direction === 'horizontal' ? 4 : width;
    height = direction === 'vertical' ? 4 : height;
    return {
      position: 'absolute',
      backgroundColor: 'blue',
      transform: `translate(${x}px, ${y}px)`,
      width: `${width}px`,
      height: `${height}px`,
    };
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

    return (
      <>
        {newChild}
        <div style={this.createDividerStyle()} />
      </>
    );
  }
}

export default DragItem;
