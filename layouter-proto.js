import { lerp } from 'canvas-sketch-util/math';
import random from 'canvas-sketch-util/random';
import mat4 from 'gl-mat4';

const canvasSketch = require('canvas-sketch');
const load = require('load-asset');

random.setSeed('1');

const settings = {
  // dimensions: [ 800, 600 ],
  animate: false,
  // duration: 4,
  fps: 12,
};


const createGrid = (countX, countY) => {
  const points = [];
  for (let x = 0; x < countX; x++) {
    for (let y = 0; y < countY; y++) {
      const u = x / (countX - 1);
      const v = y / (countY - 1);
      points.push({
        position: [ u, v ],
      });
    }
  }

  return points;
};


const sTheme = {
  background: "#111111",
  "f_high": "#ffffff",
  "f_med": "#aaaaaa",
  "f_low": "#555555",
  "f_inv": "#000000",
  "b_high": "#fc533e",
  "b_med": "#666666",
  "b_low": "#333333",
  "b_inv": "#fc533e",
};

const teenageTheme = {
  background: "#a1a1a1",
  "f_high": "#222222",
  "f_med": "#e00b30",
  "f_low": "#888888",
  "f_inv": "#ffffff",
  "b_high": "#555555",
  "b_med": "#fbba2d",
  "b_low": "#b3b3b3",
  "b_inv": "#0e7242",
};

const solarizedDarkTheme = {
  background: "#002b36",
  "f_high": "#eee8d5",
  "f_med": "#93a1a1",
  "f_low": "#839496",
  "f_inv": "#ffffff",
  "b_high": "#657b83",
  "b_med": "#586e75",
  "b_low": "#073642",
  "b_inv": "#eee8d5",
};

const theme = teenageTheme;

const KEY_UP = 38;
const KEY_DOWN = 40;
const KEY_LEFT = 37;
const KEY_RIGHT = 39;

const loadAndSketch = async ({ context, width, height }) => {
  const countX = 20;
  const countY = 10;

  const cursor = [ 0, 0 ];
  const focus = [ -1, -1 ];

  const grid = createGrid(countX, countY);

  function keyPressHandler(e) {
    if (!e) return;
    const { keyCode } = e;

    if (keyCode === KEY_LEFT) {
      cursor[0] = Math.max(0, cursor[0] - 1);
    }

    if (keyCode === KEY_RIGHT) {
      cursor[0] = Math.min(countX - 1, cursor[0] + 1);
    }

    if (keyCode === KEY_UP) {
      cursor[1] = Math.max(0, cursor[1] - 1);
    }

    if (keyCode === KEY_DOWN) {
      cursor[1] = Math.min(countY - 1, cursor[1] + 1);
    }
  }

  document.addEventListener('keydown', keyPressHandler, false);

  let lerpX;
  let lerpY;
  let gridRadius;
  let gridPitch;

  function calculateMargins(width, height) {
    const _longSide = Math.max(width, height);
    const _shortSide = Math.min(width, height);

    let _marginX = 0;
    let _marginY = 0;
    if (width / countX > height / countY) {
      _marginY = 0.2 * height;
      _marginX = (width - (countX / countY) * (height - _marginY));
    }

    if (width / countX <= height / countY) {
      _marginX = 0.2 * width;
      _marginY = (height - (countY / countX) * (width - _marginX));
    }

    gridPitch = (width - _marginX) / countX;
    console.log((width - _marginX) / countX, (height - _marginY) / countY);

    gridRadius = Math.floor(0.014 * _shortSide);

    lerpX = (v) => lerp(_marginX / 2, width - _marginX / 2, v);
    lerpY = (v) => lerp(_marginY / 2, height - _marginY / 2, v);
  }

  calculateMargins(width, height);

  const resistorColors = {
    leg: theme.b_high,
    body: theme.b_med,
    text: theme.f_high,
    point: theme.b_high,
  };

  const dipColors = {
    body: theme.b_med,
    text: theme.f_high,
    point: theme.b_high,
  };

  function gridToXY(g, { countX, countY }) {
    const p = grid[g[0] * countY + g[1]];
    return [
      lerpX(p.position[0]),
      lerpY(p.position[1]),
    ];
  }

  function drawDipBody(context, {
    name,
    id,
    pins,
    pinNames,
  }, {
    gridPitch,
    gridRadius,
    countX,
    countY,
  }) {
    const pinCount = pins.length;
    const firstPin = pins[0];
    const midPin = pins[Math.round(pinCount / 2)];

    let p1 = gridToXY(firstPin, { countX, countY });
    let pMid = gridToXY(midPin, { countX, countY });

    context.fillStyle = dipColors.body;
    context.fillRect(
      p1[0] - gridRadius,
      p1[1] - gridRadius,
      pMid[0] - p1[0] + 2 * gridRadius,
      pMid[1] - p1[1] + 2 * gridRadius
    );
  }

  function drawDipPins(context, {
    name,
    id,
    pins,
    pinNames,
  }, {
    gridPitch,
    gridRadius,
    countX,
    countY,
  }) {
    for (let pin of pins) {
      const p = gridToXY(pin, { countX, countY });

      context.beginPath();
      context.arc(
        p[0],
        p[1],
        gridRadius * .5,
        0, 2 * Math.PI, false
      );
      context.closePath();

      context.fillStyle = dipColors.point;
      context.fill();
    }
  }

  function drawDipCaption(context, {
    name,
    id,
    pins,
    pinNames,
  }, {
    gridPitch,
    gridRadius,
    countX,
    countY,
    fontSize,
    textHeight,
  }) {
    const pinCount = pins.length;
    const firstPin = pins[0];
    const midPin = pins[Math.round(pinCount / 2)];

    let isReversed = false;
    let isVertical = false;
    if (firstPin[0] > midPin[0] || firstPin[1] > midPin[1]) {
      isReversed = true;
    }

    if (Math.abs(firstPin[1] - midPin[1]) === pinCount / 2 - 1) {
      isVertical = true;
    }

    context.save()

    const p1 = gridToXY(firstPin, { countX, countY });
    const pMid = gridToXY(midPin, { countX, countY });

    const dx = Math.abs(p1[0] - pMid[0]);
    const dy = Math.abs(p1[1] - pMid[1]);

    context.translate(p1[0] + dx / 2, p1[1] + dy / 2);

    if (!isVertical) {
      context.rotate(-Math.PI / 2);
    }

    if (isReversed) {
      context.rotate(Math.PI);
    }

    for (let i = 0; i < pins.length; i++) {
      let col = i < pinCount / 2 ? 0 : 1;
      let row = i < pinCount / 2 ? i : pinCount - i - 1;

      context.textAlign = col ? 'right' : 'left';
      context.font = `${fontSize}px Fira Code`;
      context.fillStyle = dipColors.text;

      // const textInfo = context.measureText(text);
      const colSign = col ? 1 : -1;
      const rowSign = Math.round(row - (pinCount - 2) / 4);

      context.fillText(
        pinNames[i],
        colSign * (2 * gridPitch - 2 * gridRadius),
        rowSign *  1.11 * gridPitch + .5 * textHeight
      );

      context.fillRect(
        -dx,
        rowSign * 1.101 * gridPitch + .5 * textHeight,
        2 * dx,
        2
      );
    }

    context.restore();
  }


  function getResistorSize(gridPitch) {
    return [ gridPitch * 3, 0.8 * gridPitch ]
  }

  function drawResistorBody(context, {
    pins: [ g1, g2, ],
    offset,
  }, {
    gridPitch,
    countX,
    countY,
  }) {
    const [ p1x, p1y ] = gridToXY(g1, { countX, countY });
    const [ p2x, p2y ] = gridToXY(g2, { countX, countY });
    const componentSize = getResistorSize(gridPitch);

    const d = Math.sqrt((p1x - p2x) ** 2 + (p1y - p2y) ** 2);

    const componentStart = offset * d - .5 * componentSize[0];
    const componentEnd = offset * d + .5 * componentSize[0];

    let angle = Math.atan2(p2y - p1y, p2x - p1x) ;
    context.save();
    context.translate(p1x, p1y);
    context.rotate(angle);

    context.beginPath();
    context.moveTo(componentStart, -componentSize[1] * .5)
    context.lineTo(componentStart, +componentSize[1] * .5)
    context.lineTo(componentEnd, +componentSize[1] * .5)
    context.lineTo(componentEnd, -componentSize[1] * .5)
    context.closePath();

    context.strokeStyle = null;
    context.fillStyle = resistorColors.body;
    context.fill();

    context.restore();
  }

  function drawResistorLegs(context, {
    pins: [ g1, g2, ],
    offset,
  }, {
    gridPitch,
    gridRadius,
    countX,
    countY,
  }) {
    const [ p1x, p1y ] = gridToXY(g1, { countX, countY });
    const [ p2x, p2y ] = gridToXY(g2, { countX, countY });
    const componentSize = getResistorSize(gridPitch);

    const d = Math.sqrt((p1x - p2x) ** 2 + (p1y - p2y) ** 2);

    const componentStart = offset * d - .5 * componentSize[0];
    const componentEnd = offset * d + .5 * componentSize[0];

    let angle = Math.atan2(p2y - p1y, p2x - p1x) ;
    context.save();
    context.translate(p1x, p1y);
    context.rotate(angle);

    const legWidth = .25 * gridRadius;

    if (componentStart > 0) {
      context.beginPath();
      context.moveTo(0, 0);
      context.lineTo(componentStart, 0);
      context.closePath();

      context.fillStyle = null;
      context.strokeStyle = resistorColors.leg;
      context.lineWidth = legWidth;
      context.stroke();
    }

    if (componentEnd < d) {
      context.beginPath();
      context.moveTo(componentEnd, 0);
      context.lineTo(d, 0);
      context.closePath();

      context.strokeStyle = resistorColors.leg;
      context.lineWidth = legWidth
      context.stroke();
    }

    const legJointRadius = legWidth * 2;

    if (componentStart > 0) {
      context.beginPath();
      context.arc(
        componentStart,
        0,
        legJointRadius,
        -Math.PI / 2,
        +Math.PI / 2,
        false
      );
      context.closePath();
      context.strokeStyle = null;
      context.fillStyle = resistorColors.point;
      context.fill();
    }

    if (componentEnd < d) {
      context.beginPath();
      context.arc(
        componentEnd,
        0,
        legJointRadius,
        +Math.PI / 2,
        -Math.PI / 2,
        false
      );
      context.closePath();
      context.strokeStyle = null;
      context.fillStyle = resistorColors.point;
      context.fill();
    }

    context.beginPath();
    context.arc(
      0,
      0,
      gridRadius * .5,
      0,
      2 * Math.PI,
      false
    );

    context.fillStyle = resistorColors.point;
    context.fill();
    context.closePath();

    context.beginPath();
    context.arc(
      d,
      0,
      gridRadius * .5,
      0,
      2 * Math.PI,
      false
    );
    context.closePath();

    context.fillStyle = resistorColors.point;
    context.fill();

    context.restore();
  }

  function drawResistorCaption(context, {
    pins: [ g1, g2, ],
    offset,
    id,
    valueStr,
  }, {
    gridPitch,
    fontSize,
    textHeight,
    countX,
    countY,
    showIds,
    showValues,
  }) {
    const [ p1x, p1y ] = gridToXY(g1, { countX, countY });
    const [ p2x, p2y ] = gridToXY(g2, { countX, countY });
    const componentSize = getResistorSize(gridPitch);

    const d = Math.sqrt((p1x - p2x) ** 2 + (p1y - p2y) ** 2);

    const componentStart = offset * d - .5 * componentSize[0];
    const componentEnd = offset * d + .5 * componentSize[0];

    let angle = Math.atan2(p2y - p1y, p2x - p1x) ;
    context.save();
    context.translate(p1x, p1y);
    context.rotate(angle);

    const textParts = [];

    if (showIds) {
      textParts.push(id);
    }

    if (showValues) {
      textParts.push(valueStr);
    }

    const text = textParts.join(' ');

    context.textAlign = 'center';
    context.font = `${fontSize}px Fira Code`;
    context.fillStyle = resistorColors.text;

    context.fillText(
      text,
      componentStart + componentSize[0] * .5,
      .5 * textHeight,
      componentSize[0]
    );

    context.restore();
  }

  function calculateText(context, components, {
    gridPitch,
    showValues,
    showPinNames,
    showIds,
  }) {
    let fontSize = 16;
    let lastTextHeight = 0;

    const componentSize = [ gridPitch * 3, 0.8 * gridPitch ];

    for (let component of components) {
      if (component.type !== 'resistor') {
        continue;
      }

      let textSizeFound = false;
      let textParts = [];

      if (showIds) {
        textParts.push(component.id);
      }

      if (showValues) {
        textParts.push(component.valueStr);
      }

      const text = textParts.join(' ');

      while (!textSizeFound) {
        context.font = `${fontSize}px Fira Code`;

        const textSize = context.measureText(text)
        const textHeight = (
          textSize.actualBoundingBoxAscent -
          textSize.actualBoundingBoxDescent
        );
        const textWidth = textSize.width;

        if (textWidth > .55 * componentSize[0]) {
          fontSize -= 1;
          continue;
        }

        if (textHeight > .5 * componentSize[1]) {
          fontSize -= 1;
          continue;
        }

        lastTextHeight = textHeight;
        textSizeFound = true;
      }
    }

    return { fontSize, textHeight: lastTextHeight };
  }


  return {
    resize({ width, height }) {
      calculateMargins(width, height);
    },
    render({ playhead, time, width, height }) {
      context.clearRect(0, 0, width, height);
      context.fillStyle = theme.background;
      context.fillRect(0, 0, width, height);

      for (let i = 0; i < grid.length; i++) {
        const col = Math.floor(i / countY);
        const row = i - col * countY;

        context.beginPath();
        context.fillStyle = theme.b_low;
        context.strokeStyle = null;

        const x = lerpX(grid[i].position[0]);
        const y = lerpY(grid[i].position[1]);

        context.arc(
          x,
          y,
          gridRadius,
          0,
          2 * Math.PI,
          false
        );

        context.fill();
        context.closePath();

        // if (col === cursor[0] && row === cursor[1]) {
        //   const x = lerpX(grid[i].position[0]);
        //   const y = lerpY(grid[i].position[1]);
        //   context.strokeStyle = theme.b_high;
        //   context.fillStyle = null;
        //   const sizeUnit = (gridRadius + gridPitch);
        //   context.strokeRect(
        //     x - .5 * sizeUnit, y - .5 * sizeUnit,
        //     sizeUnit,
        //     sizeUnit,
        //   );
        // }
      }

      const components = [
        {
          type: 'resistor',
          pins: [ [ 2, 2], [ 4, 2 ] ],
          offset: 0.5,
          id: 'R1',
          value: 100000,
          valueStr: '100K',
        },

        {
          type: 'resistor',
          pins: [ [ 2, 2], [ 2, 8 ] ],
          offset: 0.7,
          id: 'R2',
          value: 56000,
          valueStr: '56K',
        },

        {
          type: 'resistor',
          pins: [ [ 2, 8], [ 5, 8 ] ],
          offset: 0.5,
          id: 'R3',
          value: 1000000,
          valueStr: '1M',
        },

        {
          type: 'resistor',
          pins: [ [ 4, 2 ], [ 5, 8],  ],
          offset: 0.4,
          id: 'R4',
          value: 100000,
          valueStr: '100K',
        },

        {
          type: 'dip',
          id: 'IC1',
          name: 'LM124',
          pins: [
            [6, 0], [6, 1], [6, 2], [6, 3],
            [6, 4], [6, 5], [6, 6],
            [9, 6], [9, 5], [9, 4], [9, 3],
            [9, 2], [9, 1], [9, 0]
          ],
          pinNames: [
            '1OUT', '1IN-', '1IN+', 'Vcc',
            '2IN+', '2IN-', '2OUT',
            '3OUT', '3IN-', '3IN+', 'GND',
            '4IN+', '4IN-', '4OUT'
          ],
        },

        {
          type: 'dip',
          id: 'IC1',
          name: 'LM124',
          pins: [
            [11, 0], [12, 0], [13, 0], [14, 0],
            [15, 0], [16, 0], [17, 0],
            [17, 3], [16, 3], [15, 3], [14, 3],
            [13, 3], [12, 3], [11, 3]
          ],
          pinNames: [
            '1OUT', '1IN-', '1IN+', 'Vcc',
            '2IN+', '2IN-', '2OUT',
            '3OUT', '3IN-', '3IN+', 'GND',
            '4IN+', '4IN-', '4OUT'
          ],
        }
      ];


      const displaySettings = {
        showValues: true,
        showIds: true,
        showPinNames: true,
        showPinNumbers: true,
      };
      const textOptions = calculateText(context, components, {
        gridPitch,
        ...displaySettings,
      });
      const gridContext = {
        gridPitch,
        gridRadius,
        countX,
        countY,
        ...displaySettings,
        ...textOptions,
      };

      const layers = [
        {
          resistor: drawResistorBody,
          dip: drawDipBody,
        },
        {
          resistor: drawResistorLegs,
          dip: drawDipPins,
        },
        {
          resistor: drawResistorCaption,
          dip: drawDipCaption,
        },
      ];

      for (let layer of layers) {
        for (let component of components) {
          const f = layer[component.type];
          if (f) {
            f(context, component, gridContext);
          }
        }
      }
    },

    unload() {
      document.removeEventListener('keydown', keyPressHandler);
    },
  };
};

canvasSketch(loadAndSketch, settings);
