import { useCallback, useMemo } from 'react';
import { SchemaErrors, mapSchemaErrors } from './utils/validation';
import { getElementValue } from './utils/getElementValue';
import { Internal } from './utils/field';
import {
  FormSchema,
  DefaultValues,
  FormValues,
  ExternalValues,
  InternalValues,
} from './types';
import { i2e, e2i } from './utils/converters';
import { SetExternalValue, useExternalValues } from './utils/useExternalValues';
import { useInternalValues } from './utils/useInternalValues';

export const useForm = <
  Schema extends FormSchema,
  D extends DefaultValues<Schema>,
>(
  schema: Schema,
  options?: {
    defaultValues?: D;
  },
): FormReturnType<Schema, D> => {
  const defaultValues = options?.defaultValues ?? ({} as D);
  const [values, setValues] = useInternalValues<Schema, D>(defaultValues);
  const [_exValues, _setOnlyExternalValue] = useExternalValues<Schema, D>(
    schema,
    values,
  );

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
  const _setExternalValue: SetExternalValue<Schema> = useCallback(
    (name, exValue) => {
      _setOnlyExternalValue(name as string, exValue);
      setValue(name)(e2i(schema)(name, exValue));
    },
    [_setOnlyExternalValue, schema, setValue],
  );

  const getValue: GetValue<Schema, D> = useCallback(
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

export type FormValuesFromHooks<Fn extends () => FormReturnType<any, any>> =
  ReturnType<Fn>['values'];

type GetValue<Schema extends FormSchema, D extends DefaultValues<Schema>> = <
  K extends keyof Schema,
>(
  name: K,
) => FormValues<Schema, D>[K];

type Register<Schema extends FormSchema> = <Name extends keyof Schema>(
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

type Control<Schema extends FormSchema> = {
  _exValues: ExternalValues<Schema>;
  _setExternalValue: SetExternalValue<Schema>;
};

type HandleSubmit<Schema extends FormSchema> = (
  onValid: (value: InternalValues<Schema>) => unknown | Promise<unknown>,
) => (e?: React.BaseSyntheticEvent) => void;
