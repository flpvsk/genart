export default function getImageData(img) {
  const { width, height } = img;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const c = canvas.getContext('2d');
  c.drawImage(img, 0, 0, width, height);
  return c.getImageData(0, 0, width, height);
}
