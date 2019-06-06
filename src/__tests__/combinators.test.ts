import { nullable, optional, array, tuple, obj } from '../combinators'
import * as $ from '../primitives'
import { ValidationTypeError, ValidationMemberError, ValidationErrors } from '../errors'
import { ok, error } from '../result'

describe('nullable', () => {
  it('makes a provided transformer to allow `null`', () => {
    expect(nullable($.any).transform(null)).toEqual(ok(null))
    expect(nullable($.any).inverseTransform(null)).toEqual(ok(null))
  })
  it("does't make a provided transformer to allow `undefined`", () => {
    expect(nullable($.any).transform(undefined)).toEqual(error(new ValidationTypeError([], 'any', 'undefined')))
    expect(nullable($.any).inverseTransform(undefined)).toEqual(error(new ValidationTypeError([], 'any', 'undefined')))
  })
})

describe('optional', () => {
  it('makes a provided transformer to allow `undefined`', () => {
    expect(optional($.any).transform(undefined)).toEqual(ok(undefined))
    expect(optional($.any).inverseTransform(undefined)).toEqual(ok(undefined))
  })
  it("doesn't make a provided transformer to allow `null`", () => {
    expect(optional($.any).transform(null)).toEqual(error(new ValidationTypeError([], 'any', 'null')))
    expect(optional($.any).inverseTransform(null)).toEqual(error(new ValidationTypeError([], 'any', 'null')))
  })
})

describe('array', () => {
  it('creates a transformer', () => {
    expect(array($.any).transform([1, 'str', true])).toEqual(ok([1, 'str', true]))
  })

  describe('created transformer', () => {
    it('disallows non-array values', () => {
      expect(array($.number).transform('hoge')).toEqual(error(new ValidationTypeError([], 'array', 'string')))
    })
    it('disallows array values which items have an item that a provided transformer disallows', () => {
      expect(array($.number).transform([0, 'hoge', 1])).toEqual(error(new ValidationTypeError([1], 'number', 'string')))
      expect(array($.any).inverseTransform([0, null])).toEqual(error(new ValidationTypeError([1], 'any', 'null')))
    })
  })
})

describe('tuple', () => {
  it('creates a transformer with provided transfomers', () => {
    expect(tuple($.number, $.string).transform([1, 'hoge'])).toEqual(ok([1, 'hoge']))
  })

  describe('created transformer', () => {
    it('disallows non-array values', () => {
      expect(tuple($.number).transform(null)).toEqual(error(new ValidationTypeError([], 'array', 'null')))
    })
    it('disallows array values which length is invalid', () => {
      expect(() => tuple($.number, $.number).transformOrThrow([1])).toThrowError(ValidationErrors)
    })
    it('disallows array values that some of items is disallowed by provided transformers', () => {
      expect(tuple($.number, $.string).transform([1, 2])).toEqual(
        error(new ValidationTypeError([1], 'string', 'number')),
      )
      expect(tuple($.any).inverseTransform([null])).toEqual(error(new ValidationTypeError([0], 'any', 'null')))
    })
  })
})

describe('obj', () => {
  it('creates a transformer with provided transformers', () => {
    expect(obj({ name: $.string, age: $.number }).transform({ name: 'tanaka', age: 35 })).toEqual(
      ok({ name: 'tanaka', age: 35 }),
    )
  })

  describe('created transformer', () => {
    it('disallows non-object values', () => {
      expect(obj({}).transform(10)).toEqual(error(new ValidationTypeError([], 'object', 'number')))
    })
    it('disallows null', () => {
      expect(obj({}).transform(null)).toEqual(error(new ValidationTypeError([], 'object', 'null')))
    })
    it('disallows values that one of members is invalid', () => {
      expect(obj({ a: $.string, b: $.number }).transform({ a: 'hoge', b: 'piyo' })).toEqual(
        error(new ValidationTypeError(['b'], 'number', 'string')),
      )
      expect(obj({ a: $.any }).inverseTransform({ a: null })).toEqual(
        error(new ValidationTypeError(['a'], 'any', 'null')),
      )
    })
    it('disallows values that one of required members is undefined or missing', () => {
      expect(obj({ a: $.string }).transform({})).toEqual(error(new ValidationMemberError(['a'])))
      expect(obj({ a: $.string }).transform({ a: undefined })).toEqual(error(new ValidationMemberError(['a'])))
      expect(obj({ a: $.any }).inverseTransform({ a: undefined })).toEqual(error(new ValidationMemberError(['a'])))
    })
  })
})
