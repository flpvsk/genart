const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random');
const math = require('canvas-sketch-util/math');
const color = require('canvas-sketch-util/color');
const palettes = require('nice-color-palettes');
const eases = require('eases');
const hexToHsl = require('hex-to-hsl');
const WorleyNoise = require('worley-noise')

let seed = random.getRandomSeed();
// seed = 860632;
seed = '371678';
console.log('seed', seed);
random.setSeed(seed);

const settings = {
  animate: true,
  duration: 10,
  context: '2d',
  fps: 24,
  dimensions: [1080, 1920],
  attributes: { antialias: true }
};

const pixSize = 0.08 * random.value()

const sketch = () => {
  const palette = random.shuffle(random.pick(palettes));
  palette[1] = '#222222'
  const freq = random.value()
  const vNoise = new WorleyNoise({
    numPoints: random.rangeFloor(1, 10),
    seed,
  })
  const speedInPlayhead = 0.1
  return ({ context, width, height, time, playhead }) => {
    // context.fillStyle = palette[Math.floor(palette.length * playhead)]
    // context.fillRect(0, 0, width, height)
    // if ((playhead * 100) % 2 === 0) return
    let xN = -1
    let yN = -1
    const pixSizePx = Math.min(pixSize * width, pixSize * height)
    const xCount = width / pixSizePx
    const yCount = height / pixSizePx
    let tick = 0;

    while (xN <= xCount) {
      xN += 1
      yN = -1
      while (yN <= yCount) {
        yN += 1
        // const cNoise = random.noise3D(
        //   xN,
        //   yN,
        //   playhead,
        //   freq
        // )
        // const cNorm = 0.5 * (cNoise + 1)
        //

        const cNoiseFreqX = 1.5
        const cNoiseFreqY = 1.

        // let yNoise = yN * cNoiseFreqY / yCount + playhead

        // if (playhead > 0.5) {
        //   yNoise = (yCount - yN) / yCount - playhead
        // }

        // yNoise = math.wrap(yNoise, 0., 1.)
          //

        let yNoise = yN / yCount
        if (yN > (yCount / 2)) {
          yNoise = (yCount - yN) / yCount
        }

        let playAdd = playhead
        if (playhead > 0.5) {
          playAdd = 1. - playhead
        }
        playAdd = eases.quadInOut(playAdd)

        yNoise = math.wrap(yNoise * 10. * playAdd, 0., 1.)

        // if (playhead > 0.5) {
        //   yNoise = (yN / yCount) + (yCount / 2)
        // }

        // if (playhead > 0.5 && yN > (yCount / 2)) {
        //   yNoise = 0;
        // }


        const cNoise = vNoise.getEuclidean({
          x: xN * cNoiseFreqX / xCount,
          y: yNoise,
        }, 1)
        const cNorm = cNoise
        const colorValue = palette[Math.floor(cNorm * palette.length)]
        context.fillStyle = colorValue

        // if (tick++ === 0) {
        //   console.log(colorValue)
        // }

        context.fillRect(
          xN * pixSizePx,
          yN * pixSizePx,
          pixSizePx,
          pixSizePx,
        )
      }
    }



    const c = context

    // const pHsl = hexToHsl(palette[1])
    // c.fillStyle = `hsla(${pHsl[0]}, ${pHsl[1]}%, ${pHsl[2]}%, 10%)`
    // c.fillRect(0, 0, width, height)

    c.font = `120px Rockwell`;
    c.fillStyle = palette[3];
    c.shadowColor = palette[2];
    c.shadowBlur = 0;
    c.shadowOffsetX = 0.005 * width;
    c.shadowOffsetY = 0.005 * height;

    const line1 = '[ʒʒʒʒ]'
    const textSize1 = c.measureText(line1);

    const marginX = 3 * 0.0156 * width;
    const marginY = marginX;
    const gutterY = 0.6 * marginY;
    const minX = marginX;
    const maxX = width - marginX;
    const minY = marginY;
    const maxY = height - marginY;

    const line1Y = minY + 3.4 * marginY;
    const line2Y = line1Y + 4.4 * marginY;
    const line3Y = line2Y + 2.4 * marginY;
    const lineX = 1.5 * marginX;

    c.fillText(
      line1,
      marginX,
      line1Y
    );

    const line2 = 'Experiments in Sound'
    c.font = `90px Rockwell`;
    const textSize2 = c.measureText(line2);
    c.fillStyle = palette[0];
    c.shadowColor = palette[1];
    c.shadowBlur = 0;
    c.shadowOffsetX = 0.003 * width;
    c.shadowOffsetY = 0.003 * height;

    c.fillText(
      line2,
      marginX,
      line2Y
    );

    const line3 = 'Show / Tell / Perform'
    c.font = `80px Rockwell`;
    const textSize3 = c.measureText(line3);
    c.fillStyle = palette[0];
    c.shadowColor = palette[1];
    c.shadowBlur = 0;
    c.shadowOffsetX = 0.003 * width;
    c.shadowOffsetY = 0.003 * height;

    c.fillText(
      line3,
      marginX,
      line3Y
    );

    c.fillStyle = palette[4]
    c.shadowColor = null;
    c.shadowOffsetX = 0;
    c.shadowOffsetY = 0;


    const bottomRectY =  0.85 * height
    c.fillStyle = palette[3]
    // c.fillRect(
    //   0,
    //   bottomRectY,
    //   width - marginX * 8,
    //   5.1 * marginY
    // );

    c.font = `60px Rockwell`;
    c.fillStyle = palette[3]
    const line4 = 'Thu Apr 3, 19:00'
    const line5 = 'Pedal Markt'
    const line6 = 'special guest: Kriton Beyer'
    const textSize4 = c.measureText(line4);
    const textSize5 = c.measureText(line5);
    const line4Y = (
      bottomRectY + 2.7 * marginY
    )
    const line5Y = (
      line4Y + 1.5 * marginY
    )
    const line6Y = (
      line5Y + 2 * marginY
    )

    c.fillText(
      line4,
      marginX,
      line4Y
    );

    c.fillText(
      line5,
      marginX,
      line5Y
    );

    const textSize6 = c.measureText(line6);
    c.font = `50px Rockwell`
    c.fillStyle = palette[3]

    c.translate(0, height / 2 + 0.5 * marginY)
    // c.rotate(Math.PI / 4)

    c.fillText(
      line6,
      marginX,
      0
    );

  }
}

canvasSketch(sketch, settings);
