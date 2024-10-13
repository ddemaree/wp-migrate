/**
 * Unserialize data taken from PHP's serialize() output
 *
 * Taken from https://github.com/kvz/phpjs/blob/master/functions/var/unserialize.js
 * Fixed window reference to make it nodejs-compatible
 *
 * @param string serialized data
 * @return unserialized data
 * @throws
 */


function utf8Overhead(chr: string) {
  const code = chr.charCodeAt(0);
  if (code < 0x0080) {
    return 0;
  }
  if (code < 0x0800) {
    return 1;
  }
  return 2;
}

function readUntil (data: string, offset: number, stopchr: string): [number, string] {
  let i = 2, buf = [], chr = data.slice(offset, offset + 1);

  while (chr != stopchr) {
    if ((i + offset) > data.length) {
      throw new Error('Invalid');
    }
    buf.push(chr);
    chr = data.slice(offset + (i - 1), offset + i);
    i += 1;
  }
  return [buf.length, buf.join('')];
}

function readChrs (data: string, offset: number, length: number) {
  var i, chr, buf;

  buf = [];
  for (i = 0; i < length; i++) {
    chr = data.slice(offset + (i - 1), offset + i);
    buf.push(chr);
    length -= utf8Overhead(chr);
  }
  return [buf.length, buf.join('')];
}

type PHPValue = string | number | boolean | null | any;

type TypeResult = {
  dtype: string;
  offset: number;
  value: PHPValue | PHPValue[] | Record<string, PHPValue>;
}

type TypeConvert = (data: string, offset: number) => TypeResult;

function _parseInteger(data: string, dataoffset: number): TypeResult {
  let readData = readUntil(data, dataoffset, ';');
  let chrs = readData[0] as number;
  let readdata = readData[1];

  if(!readdata) {
    throw new Error('Invalid');
  }
  
  dataoffset = dataoffset + chrs + 1;
  let value = parseInt(readdata as string, 10);
  
  return {
    dtype: 'i',
    offset: dataoffset,
    value: value,
  };
}

function _parseBoolean(data: string, offset: number): TypeResult {
  let readData = readUntil(data, offset, ';');
  let chrs = readData[0];
  let readdata = readData[1];

  if(!readdata) {
    throw new Error('Invalid');
  }

  offset = offset + chrs + 1;
  let value = parseInt(readdata as string, 10) !== 0;

  return {
    dtype: 'b',
    offset,
    value,
  };
}

function _parseFloat(data: string, offset: number): TypeResult {
  let readData = readUntil(data, offset, ';');
  let chrs = readData[0] as number;
  let readdata = readData[1];

  if(!readdata) {
    throw new Error('Invalid');
  }

  offset = offset + chrs + 1;
  let value = parseFloat(readdata as string);

  return {
    dtype: 'd',
    offset,
    value,
  };
}

function _parseNull(_data: string, offset: number): TypeResult {
  // Null is always n;, so can return static values
  return {
    dtype: 'n',
    offset,
    value: null,
  };
}

function _parseString(data: string, offset: number): TypeResult {
  let [lengthChars, lengthAsString] = readUntil(data, offset, ':');

  // Handle empty strings more simply
  if (lengthAsString === "0") {
    return {
      dtype: 's',
      offset: offset + lengthChars + 4,
      value: '',
    };
  }
  
  let chrs = lengthChars;
  let stringlength = lengthAsString;
  offset += chrs + 2;

  let readData = readChrs(data, offset + 1, parseInt(stringlength as string, 10));
  chrs = readData[0] as number;
  let readdata = readData[1] as string;
  offset += chrs + 2;

  if(chrs != parseInt(stringlength as string, 10) && chrs != readdata.length) {
    throw new Error('String length mismatch');
  }

  if (!readdata) {
    throw new Error(`Invalid string(${stringlength}) at offset ${offset}: ${readdata}`);
  }

  return {
    dtype: 's',
    offset,
    value: readdata,
  };
}

function _parseArray(data: string, dataoffset: number): TypeResult {
  let keys: (string | number)[] = [];
  let values: (PHPValue | Record<string, PHPValue>)[] = [];

  // data should look like 1:{...}
  let [bufLength, elementData] = readUntil(data, dataoffset, '{');
  let numberOfElements = parseInt(elementData, 10);
  dataoffset += bufLength + 1; // skipping the opening curly brace

  for (let i = 0; i < numberOfElements; i++) {
    // parse the key - either i:{val} or s:{len}:"{val}"
    const keyProps = _unserialize(data, dataoffset);

    if(keyProps.dtype === 's' || keyProps.dtype === 'i') {
      keys.push(keyProps.value as string | number);
    } else {
      throw new Error('Invalid array key type: ' + keyProps.dtype);
    }
    
    dataoffset = keyProps.offset;

    // parse the value
    const valueProps = _unserialize(data, dataoffset);
    
    dataoffset = valueProps.offset;
    values.push(valueProps.value);
  }

  // If all keys are integers, return a JS array
  // Otherwise, return an object

  // Account for closing curly brace
  dataoffset += 1;

  if(keys.every(key => typeof key === 'number')) {
    return {
      dtype: 'a',
      offset: dataoffset,
      value: values,
    };
  }

  return {
    dtype: 'a',
    offset: dataoffset,
    value: keys.reduce((acc, key, index) => {
      acc[key] = values[index];
      return acc;
    }, {} as Record<string, PHPValue>),
  };
}

const _parseDtype = (data: string, offset: number): string => {
  const dtype = data.slice(offset, offset + 1).toLowerCase();
  return dtype;
}

const _unserialize = (data: string, offset: number): TypeResult => {
  const typeHandlerMap: Record<string, TypeConvert> = {
    'i': _parseInteger, 
    'b': _parseBoolean,
    'd': _parseFloat,
    'n': _parseNull,
    's': _parseString,
    'a': _parseArray,
  }

  const dtype = _parseDtype(data, offset);
  const typeHandler = typeHandlerMap[dtype];
  
  if (!typeHandler) {
    throw new Error(`Unknown / Unhandled data type(s) at offset ${offset}: ${dtype}
      ${data.slice(offset - 10, offset)}^${data.slice(offset, offset + 100)}
      `);
  }
  
  const dataoffset = offset + 2;
  return typeHandler(data, dataoffset); 
}

export function unserialize (data: string) {
  const result = _unserialize((data + ''), 0);
  return result.value;
}