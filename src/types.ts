import * as z from 'zod';
import { Field, Internal, External } from './utils/field';

export type FormSchema = Record<string, Field<z.ZodType>>;

export type FormValues<
  Schema extends FormSchema,
  D extends DefaultValues<Schema>,
> = {
  [Key in keyof Schema]: Key extends keyof D
    ? Internal<Schema[Key]>
    : Internal<Schema[Key]> | null;
};

export type DefaultValues<Schema extends FormSchema> = Partial<
  InternalValues<Schema>
>;

/** @package */
export type InternalValues<Schema extends FormSchema> = {
  [K in keyof Schema]: Internal<Schema[K]>;
};

/** @package */
export type ExternalValues<Schema extends FormSchema> = {
  [K in keyof Schema]: External<Schema[K]>;
};
