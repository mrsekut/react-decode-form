import { useCallback, useMemo, useState } from 'react';
import { atomFamily, useRecoilState } from 'recoil';
import { mapSchemaErrors } from './utils/validation';
import { getElementValue } from './utils/getElementValue';
import { Internal, hasExternal, External } from './utils/field';
import {
  FormSchema,
  DefaultValues,
  FormValues,
  ExternalValues,
  InternalValues,
} from './types';

export const useForm = <
  Schema extends FormSchema,
  D extends DefaultValues<Schema>,
>(
  schema: Schema,
  options?: {
    defaultValues?: D;
  },
): FormReturnType<Schema, D> => {
  const defaultValues: D = options?.defaultValues ?? {};
  const [values, setValues] = useInternalValue(defaultValues);
  const { _exValues, _setOnlyExternalValue } = useExternalValue(schema, values);

  const _setOnlyInternalValue: SetValue<Schema> = useCallback(
    name => value => {
      const result = schema[name]?.in?.safeParse(value);

      if (result?.success) {
        setValues(v => ({
          ...v,
          [name]: result.data,
        }));
      }
    },
    [schema, setValues],
  );

  // args is Internal
  const setValue: SetValue<Schema> = useCallback(
    name => value => {
      _setOnlyInternalValue(name)(value);
      _setOnlyExternalValue(name as string, i2e(schema)(name, value));
    },
    [_setOnlyExternalValue, _setOnlyInternalValue, schema],
  );

  // args is External
  const _setExternalValue: _SetExternalValue<Schema> = useCallback(
    (name, exValue) => {
      _setOnlyExternalValue(name as string, exValue);
      setValue(name)(e2i(schema)(name, exValue));
    },
    [_setOnlyExternalValue, schema, setValue],
  );

  const getValue: GetValue<Schema, D> = useCallback(
    name => values[name as any] as any,
    [values],
  );

  const errors = useMemo(() => {
    return mapSchemaErrors(_exValues, schema);
  }, [_exValues, schema]);

  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  const register: Register<Schema, D> = useCallback(
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

export type FormReturnType<
  Schema extends FormSchema,
  D extends DefaultValues<Schema>,
> = {
  values: FormValues<Schema, D>;
  setValue: SetValue<Schema>;
  getValue: GetValue<Schema, D>;
  register: Register<Schema>;
  handleSubmit: HandleSubmit<Schema>;
  errors: SchemaErrors<Schema>;
  control: Control<Schema>;
};

type GetValue<Schema extends FormSchema, D extends DefaultValues<Schema>> = <
  K extends keyof Schema,
>(
  name: K,
) => FormValues<Schema, D>[K];

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
) => (value: Internal<Schema[Key]>) => void;

type _SetExternalValue<Schema extends FormSchema> = (
  name: keyof Schema,
  exValue: string | boolean,
) => void;

type Control<Schema extends FormSchema> = {
  _exValues: ExternalValues<Schema>;
  _setExternalValue: _SetExternalValue<Schema>;
};

type HandleSubmit<Schema extends FormSchema> = (
  onValid: (value: ExternalValues<Schema>) => unknown | Promise<unknown>,
) => (e?: React.BaseSyntheticEvent) => void;

// Field
// ================================

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
      return '';
    }

    if (hasExternal(field)) {
      return field.i2e(value);
    } else {
      return value as string;
    }
  };

const i2es = <Schema extends FormSchema, D extends DefaultValues<Schema>>(
  internalValues: FormValues<Schema, D>,
  schema: Schema,
) => {
  return Object.keys(internalValues).reduce((acc, key) => {
    const value = internalValues[key] as Internal<Schema[typeof key]>;
    return {
      ...acc,
      [key]: i2e(schema)(key, value),
    };
  }, {} as FormValues<Schema, D>);
};

// validation
// ================================
export type SchemaErrors<Schema extends InternalValues<FormSchema>> = {
  [K in keyof Schema]: {
    message: string | undefined;
  };
};

// Utils
// ================================

const useInternalValue = <
  Schema extends FormSchema,
  D extends DefaultValues<Schema>,
>(
  defaultValues: D,
) => {
  return useRecoilState<FormValues<Schema, D>>(createAtom(defaultValues));
};

const createAtom = atomFamily({
  key: 'form values',
  default: values => values as any,
});

const useExternalValue = <
  Schema extends FormSchema,
  D extends DefaultValues<Schema>,
>(
  schema: Schema,
  values: FormValues<Schema, D>,
) => {
  const [_exValues, _setExValues] = useState<ExternalValues<Schema>>(
    i2es(values, schema),
  );

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
