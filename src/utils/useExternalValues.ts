import { useCallback, useState } from 'react';
import { i2es } from './converters';
import {
  FormSchema,
  DefaultValues,
  FormValues,
  ExternalValues,
} from '../types';

/** @package */
export const useExternalValues = <
  Schema extends FormSchema,
  D extends DefaultValues<Schema>,
>(
  schema: Schema,
  values: FormValues<Schema, D>,
) => {
  const [exValues, setExValues] = useState<ExternalValues<Schema>>(
    i2es(values, schema),
  );

  const setOnlyExternalValue: SetExternalValue<Schema> = useCallback(
    (name, exValue) => {
      setExValues(s => ({ ...s, [name]: exValue }));
    },
    [],
  );

  return [exValues, setOnlyExternalValue] as const;
};

/** @package */
export type SetExternalValue<Schema extends FormSchema> = (
  name: keyof Schema,
  exValue: string | boolean,
) => void;
