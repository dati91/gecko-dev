// Copyright (C) 2018 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.
/*---
esid: sec-ordinaryownpropertykeys
description: >
  Returns keys in their corresponding order.
info: |
  26.1.11 Reflect.ownKeys ( target )

  ...
  2. Let keys be target.[[OwnPropertyKeys]]().
  3. ReturnIfAbrupt(keys).
  4. Return CreateArrayFromList(keys).

  9.1.12 [[OwnPropertyKeys]] ( )

  1. Let keys be a new empty List.
  2. For each own property key P of O that is an integer index, in ascending
  numeric index order
    a. Add P as the last element of keys.
  3. For each own property key P of O that is a String but is not an integer
  index, in property creation order
    a. Add P as the last element of keys.
  4. For each own property key P of O that is a Symbol, in property creation
  order
    a. Add P as the last element of keys.
  5. Return keys.
features: [Reflect,Symbol]
---*/

var o1 = {
  12345678900: true,
  b: true,
  1: true,
  a: true,
  [Number.MAX_SAFE_INTEGER]: true,
  [Symbol.for('z')]: true,
  12345678901: true,
};

var result = Reflect.ownKeys(o1);

assert.sameValue(result.length, 7);
assert.sameValue(result[0], '1');
assert.sameValue(result[1], '12345678900');
assert.sameValue(result[2], '12345678901');
assert.sameValue(result[3], String(Number.MAX_SAFE_INTEGER));
assert.sameValue(result[4], 'b');
assert.sameValue(result[5], 'a');
assert.sameValue(result[6], Symbol.for('z'));

var o2 = {};

o2[12345678900] = true;
o2.b = true;
o2[1] = true;
o2.a = true;
o2[Number.MAX_SAFE_INTEGER] = true;
o2[Symbol.for('z')] = true;
o2[12345678901] = true;


result = Reflect.ownKeys(o2);

assert.sameValue(result.length, 7);
assert.sameValue(result[0], '1');
assert.sameValue(result[1], '12345678900');
assert.sameValue(result[2], '12345678901');
assert.sameValue(result[3], String(Number.MAX_SAFE_INTEGER));
assert.sameValue(result[4], 'b');
assert.sameValue(result[5], 'a');
assert.sameValue(result[6], Symbol.for('z'));

reportCompare(0, 0);
