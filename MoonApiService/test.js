const MODULUS = 1_000_000_000; // 模数：10的9次方 (9位数的上限)
const ULTIPLIER = 381_956_737; // 乘数：必须是大质数，且与 MODULUS 互质, 随便找个大的，只要不被 2 和 5 整除即可
const INCREMENT = 434_567_891; // 增量：任意数字，用于偏移结果，避免 1 对应太小的数字

function encode(sequenceId) {
    const id = sequenceId;
    if (id >= MODULUS) {
        throw new Error('ID pool exhausted (max 1 billion)');
    }
    const shuffledId = (id * ULTIPLIER + INCREMENT) % MODULUS;
    return '0' + shuffledId.toString().padStart(9, '0');
}


console.log(encode(1))
console.log(encode(100000000))