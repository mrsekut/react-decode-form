import { useEffect } from 'react';
import { RecoilState, useRecoilValue } from 'recoil';

export const RecoilObserver = <T>({
  node,
  onChange,
}: {
  node: RecoilState<T>;
  onChange: (value: T) => void;
}) => {
  const value = useRecoilValue(node);
  useEffect(() => onChange(value), [onChange, value]);
  return null;
};
