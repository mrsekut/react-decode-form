import { FormSchema, DefaultValues, FormValues } from '../types';
import { useState } from 'react';

/** @package */
export const useInternalValues = <
  Schema extends FormSchema,
  D extends DefaultValues<Schema>,
>(
  defaultValues: D,
) => {
  return useState<FormValues<Schema, D>>(
    defaultValues as FormValues<Schema, D>,
  );
};
