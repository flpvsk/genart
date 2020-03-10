export default function haltonSeq(index = 0, base) {
  let f = 1;
  let r = 0;

  while (index > 0) {
    f = f / base;
    r = r + f * (index % base);
    index = Math.floor(index / base);
  }

  return r;
}

