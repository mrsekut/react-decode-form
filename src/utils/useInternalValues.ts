import { atomFamily, useRecoilState } from 'recoil';
import { FormSchema, DefaultValues, FormValues } from '../types';

/** @package */
export const useInternalValues = <
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
