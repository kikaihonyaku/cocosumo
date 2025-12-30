import { describe, it, expect } from 'vitest';
import { createSchema, v, ValidationError, commonSchemas } from './formValidation';

describe('formValidation', () => {
  describe('ValidationError', () => {
    it('creates error with field and value', () => {
      const error = new ValidationError('email', 'Invalid email', 'bad@');

      expect(error.name).toBe('ValidationError');
      expect(error.field).toBe('email');
      expect(error.message).toBe('Invalid email');
      expect(error.value).toBe('bad@');
    });
  });

  describe('StringValidator', () => {
    describe('required', () => {
      it('fails on empty string', () => {
        const validator = v.string('Name').required();
        const result = validator.validate('');

        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('必須');
      });

      it('fails on null', () => {
        const validator = v.string('Name').required();
        expect(validator.validate(null).valid).toBe(false);
      });

      it('fails on undefined', () => {
        const validator = v.string('Name').required();
        expect(validator.validate(undefined).valid).toBe(false);
      });

      it('passes on valid string', () => {
        const validator = v.string('Name').required();
        expect(validator.validate('John').valid).toBe(true);
      });
    });

    describe('optional', () => {
      it('passes on empty value when optional', () => {
        const validator = v.string('Name').optional().minLength(5);

        expect(validator.validate('').valid).toBe(true);
        expect(validator.validate(null).valid).toBe(true);
        expect(validator.validate(undefined).valid).toBe(true);
      });

      it('validates when value is provided', () => {
        const validator = v.string('Name').optional().minLength(5);

        expect(validator.validate('Hi').valid).toBe(false);
        expect(validator.validate('Hello World').valid).toBe(true);
      });
    });

    describe('minLength', () => {
      it('fails when too short', () => {
        const validator = v.string('Password').minLength(8);
        const result = validator.validate('short');

        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('8');
      });

      it('passes at minimum length', () => {
        const validator = v.string('Password').minLength(8);
        expect(validator.validate('12345678').valid).toBe(true);
      });
    });

    describe('maxLength', () => {
      it('fails when too long', () => {
        const validator = v.string('Name').maxLength(10);
        const result = validator.validate('This is way too long');

        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('10');
      });

      it('passes at maximum length', () => {
        const validator = v.string('Name').maxLength(10);
        expect(validator.validate('1234567890').valid).toBe(true);
      });
    });

    describe('email', () => {
      it('passes valid email', () => {
        const validator = v.string('Email').email();

        expect(validator.validate('test@example.com').valid).toBe(true);
        expect(validator.validate('user.name@domain.co.jp').valid).toBe(true);
      });

      it('fails invalid email', () => {
        const validator = v.string('Email').email();

        expect(validator.validate('invalid').valid).toBe(false);
        expect(validator.validate('no@domain').valid).toBe(false);
        expect(validator.validate('@example.com').valid).toBe(false);
      });
    });

    describe('phone', () => {
      it('passes valid phone numbers', () => {
        const validator = v.string('Phone').phone();

        expect(validator.validate('090-1234-5678').valid).toBe(true);
        expect(validator.validate('+81-90-1234-5678').valid).toBe(true);
        expect(validator.validate('(03) 1234-5678').valid).toBe(true);
      });

      it('fails invalid phone numbers', () => {
        const validator = v.string('Phone').phone();

        expect(validator.validate('123').valid).toBe(false);
      });
    });

    describe('phoneJapan', () => {
      it('passes valid Japanese phone numbers', () => {
        const validator = v.string('Phone').phoneJapan();

        expect(validator.validate('090-1234-5678').valid).toBe(true);
        expect(validator.validate('0312345678').valid).toBe(true);
      });

      it('fails non-Japanese format', () => {
        const validator = v.string('Phone').phoneJapan();

        expect(validator.validate('+1-234-567-8901').valid).toBe(false);
      });
    });

    describe('postalCode', () => {
      it('passes valid Japanese postal codes', () => {
        const validator = v.string('Postal').postalCode();

        expect(validator.validate('123-4567').valid).toBe(true);
        expect(validator.validate('1234567').valid).toBe(true);
      });

      it('fails invalid postal codes', () => {
        const validator = v.string('Postal').postalCode();

        expect(validator.validate('123-456').valid).toBe(false);
        expect(validator.validate('12345678').valid).toBe(false);
      });
    });

    describe('url', () => {
      it('passes valid URLs', () => {
        const validator = v.string('URL').url();

        expect(validator.validate('https://example.com').valid).toBe(true);
        expect(validator.validate('http://test.co.jp/path').valid).toBe(true);
      });

      it('fails invalid URLs', () => {
        const validator = v.string('URL').url();

        expect(validator.validate('example.com').valid).toBe(false);
        expect(validator.validate('ftp://example.com').valid).toBe(false);
      });
    });

    describe('pattern', () => {
      it('validates against custom regex', () => {
        const validator = v.string('Code').pattern(/^[A-Z]{3}\d{4}$/);

        expect(validator.validate('ABC1234').valid).toBe(true);
        expect(validator.validate('abc1234').valid).toBe(false);
        expect(validator.validate('AB123').valid).toBe(false);
      });
    });

    describe('matches', () => {
      it('validates matching fields', () => {
        const validator = v.string('Confirm').matches('password');

        expect(validator.validate('secret123', { password: 'secret123' }).valid).toBe(true);
        expect(validator.validate('different', { password: 'secret123' }).valid).toBe(false);
      });
    });
  });

  describe('NumberValidator', () => {
    describe('min', () => {
      it('fails below minimum', () => {
        const validator = v.number('Age').min(18);

        expect(validator.validate(17).valid).toBe(false);
        expect(validator.validate(18).valid).toBe(true);
        expect(validator.validate(25).valid).toBe(true);
      });
    });

    describe('max', () => {
      it('fails above maximum', () => {
        const validator = v.number('Quantity').max(100);

        expect(validator.validate(101).valid).toBe(false);
        expect(validator.validate(100).valid).toBe(true);
        expect(validator.validate(50).valid).toBe(true);
      });
    });

    describe('integer', () => {
      it('fails on decimal', () => {
        const validator = v.number('Count').integer();

        expect(validator.validate(5.5).valid).toBe(false);
        expect(validator.validate(5).valid).toBe(true);
      });
    });

    describe('positive', () => {
      it('fails on zero and negative', () => {
        const validator = v.number('Amount').positive();

        expect(validator.validate(0).valid).toBe(false);
        expect(validator.validate(-1).valid).toBe(false);
        expect(validator.validate(1).valid).toBe(true);
      });
    });

    it('fails on non-numeric values', () => {
      const validator = v.number('Price').min(0);

      expect(validator.validate('abc').valid).toBe(false);
    });
  });

  describe('BooleanValidator', () => {
    describe('isTrue', () => {
      it('fails on false', () => {
        const validator = v.boolean('Terms').isTrue();

        expect(validator.validate(false).valid).toBe(false);
        expect(validator.validate(true).valid).toBe(true);
      });
    });
  });

  describe('ArrayValidator', () => {
    describe('minItems', () => {
      it('fails with fewer items', () => {
        const validator = v.array('Items').minItems(2);

        expect(validator.validate([1]).valid).toBe(false);
        expect(validator.validate([1, 2]).valid).toBe(true);
      });
    });

    describe('maxItems', () => {
      it('fails with more items', () => {
        const validator = v.array('Items').maxItems(3);

        expect(validator.validate([1, 2, 3, 4]).valid).toBe(false);
        expect(validator.validate([1, 2, 3]).valid).toBe(true);
      });
    });

    it('handles non-array values', () => {
      const validator = v.array('Items').minItems(1);

      expect(validator.validate(null).valid).toBe(false);
      expect(validator.validate('string').valid).toBe(false);
    });
  });

  describe('createSchema', () => {
    it('validates all fields', () => {
      const schema = createSchema({
        name: v.string('Name').required(),
        age: v.number('Age').required().min(0),
      });

      const result = schema.validate({ name: 'John', age: 25 });
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('returns first error for each field', () => {
      const schema = createSchema({
        name: v.string('Name').required().minLength(5),
        email: v.string('Email').required().email(),
      });

      const result = schema.validate({ name: '', email: 'invalid' });

      expect(result.valid).toBe(false);
      expect(result.errors.name).toBeDefined();
      expect(result.errors.email).toBeDefined();
    });

    it('supports validateField for single field validation', () => {
      const schema = createSchema({
        email: v.string('Email').required().email(),
      });

      const valid = schema.validateField('email', 'test@example.com', {});
      const invalid = schema.validateField('email', 'invalid', {});

      expect(valid.valid).toBe(true);
      expect(invalid.valid).toBe(false);
    });
  });

  describe('commonSchemas', () => {
    describe('login schema', () => {
      it('validates complete login form', () => {
        const result = commonSchemas.login.validate({
          email: 'user@example.com',
          password: 'password123',
        });

        expect(result.valid).toBe(true);
      });

      it('fails with invalid email', () => {
        const result = commonSchemas.login.validate({
          email: 'invalid',
          password: 'password123',
        });

        expect(result.valid).toBe(false);
        expect(result.errors.email).toBeDefined();
      });

      it('fails with short password', () => {
        const result = commonSchemas.login.validate({
          email: 'user@example.com',
          password: 'short',
        });

        expect(result.valid).toBe(false);
        expect(result.errors.password).toBeDefined();
      });
    });

    describe('registration schema', () => {
      it('validates matching passwords', () => {
        const result = commonSchemas.registration.validate({
          name: 'John Doe',
          email: 'user@example.com',
          password: 'password123',
          passwordConfirm: 'password123',
        });

        expect(result.valid).toBe(true);
      });

      it('fails on password mismatch', () => {
        const result = commonSchemas.registration.validate({
          name: 'John Doe',
          email: 'user@example.com',
          password: 'password123',
          passwordConfirm: 'different',
        });

        expect(result.valid).toBe(false);
        expect(result.errors.passwordConfirm).toContain('一致');
      });
    });

    describe('inquiry schema', () => {
      it('validates complete inquiry form', () => {
        const result = commonSchemas.inquiry.validate({
          name: 'John Doe',
          email: 'user@example.com',
          phone: '',
          message: 'This is a test inquiry message that is long enough.',
        });

        expect(result.valid).toBe(true);
      });

      it('allows optional phone', () => {
        const result = commonSchemas.inquiry.validate({
          name: 'John Doe',
          email: 'user@example.com',
          message: 'This is a test inquiry message that is long enough.',
        });

        expect(result.valid).toBe(true);
      });

      it('fails with short message', () => {
        const result = commonSchemas.inquiry.validate({
          name: 'John',
          email: 'user@example.com',
          message: 'Short',
        });

        expect(result.valid).toBe(false);
        expect(result.errors.message).toBeDefined();
      });
    });
  });

  describe('custom validator', () => {
    it('supports custom validation function', () => {
      const validator = v.string('Field').custom(
        (value) => value.startsWith('prefix_'),
        'Must start with prefix_'
      );

      expect(validator.validate('prefix_valid').valid).toBe(true);
      expect(validator.validate('invalid').valid).toBe(false);
    });

    it('receives allData in custom validator', () => {
      const schema = createSchema({
        startDate: v.string('Start Date').required(),
        endDate: v.string('End Date').required().custom(
          (value, allData) => new Date(value) >= new Date(allData.startDate),
          'End date must be after start date'
        ),
      });

      const valid = schema.validate({
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });
      const invalid = schema.validate({
        startDate: '2024-12-31',
        endDate: '2024-01-01',
      });

      expect(valid.valid).toBe(true);
      expect(invalid.valid).toBe(false);
    });
  });
});
