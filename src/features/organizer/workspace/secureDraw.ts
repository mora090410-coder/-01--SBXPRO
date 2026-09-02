/** Cryptographically-shuffled digits 0-9 for board number draws (rejection sampling, no modulo bias). */
export const secureShuffleDigits = () => {
  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let index = digits.length - 1; index > 0; index -= 1) {
    const limit = Math.floor(0x1_0000_0000 / (index + 1)) * (index + 1);
    let sample = 0;
    do sample = crypto.getRandomValues(new Uint32Array(1))[0];
    while (sample >= limit);
    const target = sample % (index + 1);
    [digits[index], digits[target]] = [digits[target], digits[index]];
  }
  return digits;
};
