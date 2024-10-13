import {describe, expect, test} from '@jest/globals';
import { unserialize } from './php-unserialize';

describe('php-unserialize', () => {
  test('should unserialize a number', () => {
    const result = unserialize('i:42;');
    expect(result).toEqual(42);
  });

  test('should unserialize a boolean', () => {
    let result = unserialize('b:1;');
    expect(result).toEqual(true);

    result = unserialize('b:0;');
    expect(result).toEqual(false);
  });

  test('should unserialize a null', () => {
    const result = unserialize('n;');
    expect(result).toEqual(null);
  });

  test('should unserialize a string', () => {
    const result = unserialize('s:3:"foo";');
    expect(result).toEqual('foo');
  });

  test('should unserialize a plain array', () => {
    const result = unserialize('a:1:{i:0;s:3:"foo";}');
    expect(result).toEqual(["foo"]);
  });

  test('should unserialize an associative array', () => {
    const result = unserialize('a:1:{s:5:"width";i:1539;}');
    expect(result).toEqual({width: 1539});
  });

  test('should unserialize a nested array', () => {
    const result = unserialize('a:2:{s:5:"width";i:1539;s:6:"height";a:2:{s:5:"width";i:1539;s:6:"height";i:2048;}}');
    expect(result).toEqual({
      width: 1539,
      height: {
        width: 1539,
        height: 2048
      }
    });
  });
});
