import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import ReactDragLayout, { Draggable } from 'react-drag-layout';
import 'react-drag-layout/css/styles.css';
import './index.css';

const defaultLayout = {
  type: 'layout',
  children: [
    {
      type: 'item',
      key: '1',
    },
    {
      type: 'layout',
      direction: 'vertical',
      children: [
        {
          type: 'layout',
          direction: 'horizontal',
          children: [
            {
              type: 'item',
              key: '5',
            },
            {
              type: 'item',
              key: '6',
            },
          ],
        },
        {
          type: 'item',
          key: '3',
        },
        {
          type: 'item',
          key: '4',
        },
      ],
    },
  ],
};

const App = () => {
  const [layout, setLayout] = useState(defaultLayout);
  const [baseLayout, setBaseLayout] = useState(defaultLayout);
  const [value, setValue] = useState('');
  const items = ['1', '2', '3', '4', '5', '6'];

  const handleReset = () => {
    setLayout(defaultLayout);
    setBaseLayout(defaultLayout);
  };

  return (
    <div className="editor-container">
      <div className="catalog">
        <button onClick={handleReset}>reset</button>
        {items.map((item) => (
          <Draggable
            key={item}
            item={{
              key: item,
              type: 'item',
            }}
          >
            <span className="movable-item">{item}</span>
          </Draggable>
        ))}
      </div>
      <ReactDragLayout
        className="editor-area"
        layout={layout}
        baseLayout={baseLayout}
        onLayoutChange={setLayout}
        onBaseLayoutChange={setBaseLayout}
      >
        {items.map((item) => (
          <div
            key={item}
            style={{
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div className="editor-header">
              <Draggable
                item={{
                  key: item,
                  type: 'item',
                }}
              >
                <span className="movable-item">{item}</span>
              </Draggable>
            </div>
            <textarea defaultValue={`textarea-${item}`} />
          </div>
        ))}
      </ReactDragLayout>
    </div>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
