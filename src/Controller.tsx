import { FormSchema, FormState, _SetExternalValue } from './useDecodeForm';

type Props<Schema extends FormSchema> = {
  name: keyof Schema;
  control: {
    _exValues: FormState<Schema>;
    _setExternalValue: _SetExternalValue<Schema>;
  };
  render: (props: {
    field: {
      onChange: (value: string) => void;
      value: string;
    };
  }) => React.ReactNode;
};

type FC = <Schema extends FormSchema>(
  props: Props<Schema>,
) => ReturnType<React.FC>;

export const Controller: FC = ({ name, render, control }) => {
  const { _exValues, _setExternalValue } = control;

  return (
    <>
      {render({
        field: {
          value: _exValues[name],
          onChange: v => _setExternalValue(name, v),
        },
      })}
    </>
  );
};
