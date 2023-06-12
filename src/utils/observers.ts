import { useEffect } from 'react';

export const ValueObserver = <T>({
  values,
  onChange,
}: {
  values: T;
  onChange: (value: T) => void;
}) => {
  useEffect(() => onChange(values), [onChange, values]);
  return null;
};
