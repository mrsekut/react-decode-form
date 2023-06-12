import { useCallback, useMemo, useState } from 'react';
import { RecoilState, useRecoilCallback, useRecoilValue } from 'recoil';
import * as z from 'zod';
import { mapSchemaErrors } from './validation';

export type FormSchema = {
  [key: string]: Field<z.ZodType>;
};

export type FormState<S extends FormSchema> = {
  [K in keyof S]: Internal<S[K]>;
};

type Options<Schema extends FormSchema> = {
  state: RecoilState<FormState<Schema>>;
  schema: Schema;
};

export const useForm = <Schema extends FormSchema>(
  ops: Options<Schema>,
): FormReturnType<Schema> => {
  const { state, schema } = ops;
  const values = useRecoilValue(state);
  const { _exValues, _setOnlyExternalValue } = useExternalValue(schema, values);

  const _setOnlyInternalValue: SetValue<Schema> = useRecoilCallback(
    ({ set }) =>
      name =>
      value => {
        const result = schema[name]?.in?.safeParse(value);

        if (result?.success) {
          set(state, v => ({
            ...v,
            [name]: result.data,
          }));
        }
      },
  );

  // 引数はInternal
  const setValue: SetValue<Schema> = useCallback(
    name => value => {
      _setOnlyInternalValue(name)(value);
      _setOnlyExternalValue(name, i2e(schema)(name, value));
    },
    [_setOnlyExternalValue, _setOnlyInternalValue, schema],
  );

  // 引数はExternal
  const _setExternalValue: _SetExternalValue<Schema> = useCallback(
    (name, exValue) => {
      _setOnlyExternalValue(name, exValue);
      setValue(name)(e2i(schema)(name, exValue));
    },
    [_setOnlyExternalValue, schema, setValue],
  );

  const getValue: GetValue<Schema> = useCallback(
    name => values[name],
    [values],
  );

  const errors = useMemo(() => {
    return mapSchemaErrors(_exValues, schema);
  }, [_exValues, schema]);

  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  const register: Register<Schema> = useCallback(
    name => {
      return {
        name,
        value: _exValues[name],
        checked: _exValues[name],
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
          const exValue = getElementValue(e);
          _setExternalValue(name, exValue);
        },
      };
    },
    [_exValues, _setExternalValue],
  );

  const handleSubmit: HandleSubmit<Schema> = useCallback(
    onValid => async e => {
      e?.preventDefault();

      if (isValid) {
        await onValid(values);
      }
    },
    [isValid, values],
  );

  return {
    values,
    getValue,
    setValue,
    register,
    errors,
    handleSubmit,
    control: {
      _exValues,
      _setExternalValue,
    },
  };
};

// Types
// ================================

export type FormReturnType<Schema extends FormSchema> = {
  values: FormState<Schema>;
  setValue: SetValue<Schema>;
  getValue: GetValue<Schema>;
  register: Register<Schema>;
  handleSubmit: HandleSubmit<Schema>;
  errors: SchemaErrors<Schema>;
  control: Control<Schema>;
};

type GetValue<Schema extends FormSchema> = <K extends keyof Schema>(
  name: K,
) => FormState<Schema>[K];

type Register<Schema extends FormSchema, Name = keyof Schema> = (
  name: Name,
) => {
  name: Name;
  value: string;
  checked: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

type SetValue<Schema extends FormSchema> = <Key extends keyof Schema>(
  name: Key,
) => (value: z.output<Schema[Key]['in']>) => void;

/** @package */
export type _SetExternalValue<Schema extends FormSchema> = (
  name: keyof Schema,
  exValue: string | boolean,
) => void;

type Control<Schema extends FormSchema> = {
  _exValues: FormState<Schema>;
  _setExternalValue: _SetExternalValue<Schema>;
};

type HandleSubmit<Schema extends FormSchema> = (
  onValid: (value: FormState<Schema>) => unknown | Promise<unknown>,
) => (e?: React.BaseSyntheticEvent) => void;

/** @package */
export type SchemaErrors<Schema extends FormState<FormSchema>> = {
  [K in keyof Schema]: {
    message: string | undefined;
  };
};

// Field
// ================================
type Field<I extends z.ZodType, E extends z.ZodType = I> =
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

// prettier-ignore
type External<F extends Field<z.ZodType>>
  = F extends WithExternal<infer _I, infer E>
    ? z.input<E>
    : z.output<F['in']>;

type Internal<F extends Field<z.ZodType>> = z.output<F['in']>;

const hasExternal = <I extends z.ZodType, E extends z.ZodType>(
  field: Field<I, E>,
): field is WithExternal<I, E> => {
  return (
    Object.hasOwn(field, 'ex') &&
    Object.hasOwn(field, 'i2e') &&
    Object.hasOwn(field, 'e2i')
  );
};

// TODO: type
const e2i =
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

const i2e =
  <Schema extends FormSchema, Name extends keyof Schema>(schema: Schema) =>
  (name: Name, value: Internal<Schema[Name]>): string => {
    const field = schema[name];
    if (field == null) {
      throw new Error(`schema[name] is not defined`);
    }

    if (hasExternal(field)) {
      return field.i2e(value);
    } else {
      return value as string;
    }
  };

const i2es = <Schema extends FormSchema>(
  internalValues: FormState<Schema>,
  schema: Schema,
) => {
  return Object.keys(internalValues).reduce((acc, key) => {
    const value = internalValues[key];
    if (value == null) {
      throw new Error(`schema[key] is not defined`);
    }

    return {
      ...acc,
      [key]: i2e(schema)(key, value),
    };
  }, {} as FormState<Schema>);
};

// Utils
// ================================

const getElementValue = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.type === 'checkbox') {
    return e.target.checked;
  }

  return e.target.value;
};

const useExternalValue = <Schema extends FormSchema>(
  schema: Schema,
  values: FormState<Schema>,
) => {
  const [_exValues, _setExValues] = useState(i2es(values, schema));

  const _setOnlyExternalValue: _SetExternalValue<Schema> = useCallback(
    (name, exValue) => {
      _setExValues(s => ({ ...s, [name]: exValue }));
    },
    [],
  );

  return {
    _exValues,
    _setOnlyExternalValue,
  };
};
