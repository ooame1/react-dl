import { Component, PropsWithChildren, createRef, CSSProperties } from 'react';
import { Item, Layout as TypesLayout, Shape } from './types';
import { synchronizeLayoutWithChildren, convertLayoutToRenderData } from './utils';

type Props = {
  layout?: TypesLayout;
};

type State = {
  layout: TypesLayout;
  containerShape?: Shape;
};

class Layout extends Component<Props, State> {
  containerRef = createRef<HTMLDivElement>();

  containerStyle: CSSProperties = {
    height: '100%',
    width: '100%',
    position: 'relative',
  };

  constructor(props: PropsWithChildren<Props>) {
    super(props);
    this.state = {
      layout: props.layout || synchronizeLayoutWithChildren(props.children),
    };
  }

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
    return {
      layout: nextProps.layout || prevState.layout,
    };
  }

  renderItems() {
    const renderData: Array<Item> = this.state.containerShape
      ? convertLayoutToRenderData(this.state.layout, this.state.containerShape)
      : [];
    return renderData.map((item) => {
      const style: CSSProperties = {
        position: 'absolute',
        border: '1px solid pink',
        transform: `translate(${item.x}px, ${item.y}px)`,
        width: `${item.width}px`,
        height: `${item.height}px`,
      };
      return (
        <div key={item.key} style={style}>
          {item.key}
        </div>
      );
    });
  }

  render() {
    return (
      <div ref={this.containerRef} style={this.containerStyle}>
        {this.renderItems()}
      </div>
    );
  }
}

export default Layout;
