import * as z from 'zod';

/** @package */
export type Field<I extends z.ZodType, E extends z.ZodType = I> =
  | InternalOnly<I>
  | WithExternal<I, E>;

type InternalOnly<I extends z.ZodType> = {
  in: I;
  e2i?: (ex: string | boolean) => z.output<I>;
};

type WithExternal<I extends z.ZodType, E extends z.ZodType = I> = {
  in: I;
  ex: E;
  i2e: (in_: z.output<I>) => z.input<E>;
  e2i: (ex: z.input<E>) => z.output<I>;
};

/** @package */
export type Internal<F extends Field<z.ZodType>> = z.output<F['in']>;

/** @package */
// prettier-ignore
export type External<F extends Field<z.ZodType>>
  = F extends WithExternal<infer _I, infer E>
    ? z.input<E>
    : z.output<F['in']>;

/** @package */
export const hasExternal = <I extends z.ZodType, E extends z.ZodType>(
  field: Field<I, E>,
): field is WithExternal<I, E> => {
  return (
    Object.hasOwn(field, 'ex') &&
    Object.hasOwn(field, 'i2e') &&
    Object.hasOwn(field, 'e2i')
  );
};
