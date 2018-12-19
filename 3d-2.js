const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random');
const load = require('load-asset');
const palettes = require('nice-color-palettes');

// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require('three');

// Include any additional ThreeJS examples below
require('three/examples/js/controls/OrbitControls');

const settings = {
  // Make the loop animated
  animate: true,
  // Get a WebGL canvas rather than 2D
  context: 'webgl',
  // Turn on MSAA
  attributes: { antialias: true }
};

const scale = 0.01;

const getImageData = (img, scale = 1) => {
  let canvas = document.createElement("canvas");
  let { width, height } = img;

  width = Math.floor(width * scale);
  height = Math.floor(height * scale);

  canvas.width = width;
  canvas.height = height;
  let ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  return ctx.getImageData(0, 0, width, height);
};

const sketch = async ({ context, width, height }) => {
  const palette = random.shuffle(random.pick(palettes));
  const image = await load('assets/screenshot.jpg');
  const imageData = getImageData(image, scale);


  // Create a renderer
  const renderer = new THREE.WebGLRenderer({
    context
  });

  // WebGL background color
  renderer.setClearColor('#e7e7e7', 1);

  // Setup a camera
  const camera = new THREE.OrthographicCamera();

  // Setup camera controller
  const controls = new THREE.OrbitControls(camera);

  // Setup your scene
  const scene = new THREE.Scene();

  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const startX = - Math.floor(imageData.width / 2);
  const startY = - Math.floor(imageData.height / 2);

  for (let i = 0; i < imageData.data.length; i += 4) {
    const pixelNum = i / 4;
    const row = Math.floor(pixelNum / imageData.width);
    const col = pixelNum - row * imageData.width;

    const { data } = imageData;

    // const color = `rgb(${data[i]}, ${data[i + 1]}, ${data[i + 2]})`;
    const color = `rgb(${data[i]},${data[i + 1]},${data[i + 2]})`;
    const isBackground = (
      false &&
      data[i + 0] === 0 &&
      data[i + 1] === 43 &&
      data[i + 2] === 54
    );
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshPhysicalMaterial({
        color,
        roughness: 0.75,
        flatShading: true
      })
    );

    mesh.position.set(
      (startX + col) * scale,
      isBackground === false ? 1 : 0,
      (startY + row) * scale,
    );

    mesh.scale.set(1 * scale, 4 * scale, 1 * scale);

    scene.add(mesh);
  }

  // Specify an ambient/unlit colour
  scene.add(new THREE.AmbientLight('white'));

  // Add some light
  // const light = new THREE.PointLight('white', 1, 15.5);
  // light.position.set(2, 2, -4).multiplyScalar(1.5);
  // scene.add(light);

  // draw each frame
  return {
    // Handle resize events here
    resize ({ pixelRatio, viewportWidth, viewportHeight }) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(viewportWidth, viewportHeight);
      const aspect = viewportWidth / viewportHeight;

      // Ortho zoom
      const zoom = 500.0 * scale;

      // Bounds
      camera.left = -zoom * aspect;
      camera.right = zoom * aspect;
      camera.top = zoom;
      camera.bottom = -zoom;

      // Near/Far
      camera.near = -1000 * scale;
      camera.far = 1000 * scale;

      // Set position & look at world center
      camera.position.set(zoom, zoom, zoom);
      camera.lookAt(new THREE.Vector3());

      // Update the camera
      camera.updateProjectionMatrix();

    },
    // Update & render your scene here
    render ({ time }) {
      controls.update();
      renderer.render(scene, camera);
    },
    // Dispose of events & renderer for cleaner hot-reloading
    unload () {
      controls.dispose();
      renderer.dispose();
    }
  };
};

canvasSketch(sketch, settings);
