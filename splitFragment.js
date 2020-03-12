export default function splitFragment(count, split = 0.5) {
  if (count < 1) {
    return [ start, end, ];
  }

  const splits = [ split, 1 - split ];

  while (--count > 0) {
    let curSplit = splits[0];
    for (let i = 1; i < splits.length; i++) {
      const nextSplit = splits[i];
      if (curSplit > nextSplit) {
        splits.splice(
          i - 1, 1,
          split * curSplit, (1 - split) * curSplit
        );
        break;
      }

      if (i === splits.length - 1) {
        splits.splice(
          i, 1,
          split * nextSplit, (1 - split) * nextSplit
        );
        break;
      }

      curSplit = nextSplit;
    }
  }

  // console.log(splits);
  return splits.reduce(
    (acc, v) => {
      acc.push(acc[acc.length - 1] + v);
      return acc;
    }, [0]
  );
}
