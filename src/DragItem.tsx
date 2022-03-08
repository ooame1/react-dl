import React, { CSSProperties } from 'react';
import { Position } from './types';
import { renderPosition } from './utils';

type Props = {
  position?: Position;
};

type State = {};

class DragItem extends React.Component<Props, State> {
  createStyle(): CSSProperties {
    const { position } = this.props;
    if (!position) {
      return {
        display: 'none',
      };
    }
    return {
      ...renderPosition(position),
    };
  }

  render() {
    const child = React.Children.only(this.props.children as any);
    return React.cloneElement(child, {
      style: {
        ...child.props.style,
        ...this.createStyle(),
      },
    });
  }
}

export default DragItem;
