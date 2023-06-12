import {
  FormSchema,
  DefaultValues,
  FormValues,
  ExternalValues,
} from '../types';
import { Internal, External, hasExternal } from './field';

// TODO: type
/** @pacakge */
export const e2i =
  <Schema extends FormSchema, Name extends keyof Schema>(schema: Schema) =>
  (name: Name, value: string | boolean): External<Schema[Name]> => {
    const field = schema[name];
    if (field == null) {
      throw new Error(`schema[name] is not defined`);
    }

    if (field.e2i != null) {
      return field.e2i(value);
    } else {
      return value as External<Schema[Name]>;
    }
  };

/** @pacakge */
export const i2es = <
  Schema extends FormSchema,
  D extends DefaultValues<Schema>,
>(
  internalValues: FormValues<Schema, D>,
  schema: Schema,
): ExternalValues<Schema> => {
  return Object.keys(internalValues).reduce((acc, key) => {
    return {
      ...acc,
      [key]: i2e(schema)(key, internalValues[key]),
    };
  }, {} as ExternalValues<Schema>);
};

/** @pacakge */
export const i2e =
  <Schema extends FormSchema, Name extends keyof Schema>(schema: Schema) =>
  (name: Name, value: Internal<Schema[Name]>): string => {
    const field = schema[name];

    if (field == null) {
      return '';
    }

    if (hasExternal(field)) {
      return field.i2e(value);
    } else {
      return value;
    }
  };
