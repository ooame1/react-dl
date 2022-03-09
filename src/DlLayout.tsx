import React, { CSSProperties, PropsWithChildren, ReactElement, Ref, RefCallback } from 'react';
import memoize from 'memoize-one';
import classNames from 'classnames';
import Droppable from './components/Droppable';
import Resizable from './components/Resizable';
import Scalable from './components/Scalable';
import DlItem from './DlItem';
import { ROOT_LAYOUT_KEY } from './constants';
import {
  Layout,
  Size,
  RequiredLayout,
  ResizeDetail,
  DragDetail,
  ScaleDetail,
  OptionHandler,
} from './types';
import { formatLayout, convertLayoutToPositionMap, noop } from './utils';

type Props = {
  initLayout?: Layout;
  layout?: Layout;
  baseLayout?: Layout;
  innerRef?: Ref<HTMLDivElement>;
  onLayoutChange?: (layout: RequiredLayout) => void;
  onBaseLayoutChange?: (layout: RequiredLayout) => void;
  className?: string;
  style?: CSSProperties;
  autoSize?: boolean;
  height?: number;
  width?: number;
  onDrag?: OptionHandler<DragDetail>; // 拖拽调整布局
  onResize?: OptionHandler<ResizeDetail>; // 拖拽调整布局元素尺寸
  onScale?: OptionHandler<ScaleDetail>; // 自动填满父窗口
};

type State = {
  baseLayout: RequiredLayout;
  containerShape?: Size;
  layout: RequiredLayout;
};

const emptyLayout: RequiredLayout = {
  key: ROOT_LAYOUT_KEY,
  type: 'layout',
  children: [],
  direction: 'horizontal',
  height: 0,
  width: 0,
};

class DlLayout extends React.Component<Props, State> {
  static defaultProps: Partial<Props> = {
    initLayout: emptyLayout,
    onLayoutChange: noop,
    onBaseLayoutChange: noop,
    autoSize: true,
    onDrag: noop,
    onResize: noop,
    onScale: noop,
  };

  createPositionMap = memoize(convertLayoutToPositionMap);

  dom: HTMLDivElement | null = null;

  state: State = {
    baseLayout: emptyLayout,
    layout: emptyLayout,
  };

  static getDerivedStateFromProps(
    nextProps: PropsWithChildren<Props>,
    prevState: State
  ): Partial<State> {
    // 未初始化或非受控时不修改state
    if (!prevState.containerShape || !nextProps.layout || !nextProps.baseLayout) {
      return {};
    }
    const layout = formatLayout(nextProps.layout, prevState.containerShape);
    const baseLayout = formatLayout(nextProps.baseLayout, prevState.containerShape);
    return {
      layout,
      baseLayout,
    };
  }

  componentDidMount() {
    const { initLayout, layout } = this.props;
    const containerShape: Size = {
      width: this.dom!.clientWidth,
      height: this.dom!.clientHeight,
    };
    const formattedLayout = formatLayout(layout || initLayout || emptyLayout, containerShape);
    this.setState({
      containerShape,
      layout: formattedLayout,
      baseLayout: formattedLayout,
    });
  }

  handleBaseLayoutChange = (baseLayout: RequiredLayout) => {
    this.setState({
      baseLayout,
    });
    this.props.onBaseLayoutChange?.(baseLayout);
  };

  handleContainerShapeChange = (containerShape: Size) => {
    this.setState({
      containerShape,
    });
  };

  handleLayoutChange = (layout: RequiredLayout) => {
    this.setState({
      layout,
    });
    this.props.onLayoutChange?.(layout);
  };

  handleRef: RefCallback<HTMLDivElement> = (element) => {
    this.dom = element;
    const { innerRef } = this.props;
    if (!innerRef) {
      return;
    }
    if (typeof innerRef === 'function') {
      innerRef(element);
    } else {
      Object.assign(innerRef, {
        current: element,
      });
    }
  };

  createClassName() {
    return classNames(this.props.className, 'react-drag-container');
  }

  createStyle(): CSSProperties {
    const { style, height, width, autoSize } = this.props;
    const returnStyle: CSSProperties = {
      ...style,
    };
    if (height !== undefined) {
      Object.assign(returnStyle, {
        height: `${height}px`,
      });
    }
    if (width !== undefined) {
      Object.assign(returnStyle, {
        width: `${width}px`,
      });
    }
    if (autoSize) {
      returnStyle.width = '100%';
      returnStyle.height = '100%';
    }
    return returnStyle;
  }

  processItem(child: ReactElement<any>) {
    const { onDrag } = this.props;
    const { layout, baseLayout } = this.state;
    const { handleLayoutChange, handleBaseLayoutChange } = this;
    const position = this.createPositionMap(layout).get(child.key as string);
    return (
      <DlItem key={child.key} position={position}>
        <Droppable
          position={position}
          layout={layout}
          baseLayout={baseLayout}
          onLayoutChange={handleLayoutChange}
          onBaseLayoutChange={handleBaseLayoutChange}
          onDrag={onDrag}
        >
          {child}
        </Droppable>
      </DlItem>
    );
  }

  render() {
    const { children, onScale, onResize } = this.props;
    const { baseLayout, layout } = this.state;
    const { handleRef, handleLayoutChange, handleBaseLayoutChange, handleContainerShapeChange } =
      this;
    const positionMap = this.createPositionMap(layout);

    return (
      <Scalable
        baseLayout={baseLayout}
        onLayoutChange={handleLayoutChange}
        onContainerShapeChange={handleContainerShapeChange}
        layout={layout}
        onScale={onScale}
      >
        <div ref={handleRef} className={this.createClassName()} style={this.createStyle()}>
          {React.Children.map(children, (child) => this.processItem(child as any))}
          <Resizable
            positionMap={positionMap}
            layout={layout}
            baseLayout={baseLayout}
            onLayoutChange={handleLayoutChange}
            onBaseLayoutChange={handleBaseLayoutChange}
            onResize={onResize}
          />
        </div>
      </Scalable>
    );
  }
}

export default DlLayout;
