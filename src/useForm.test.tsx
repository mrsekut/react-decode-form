import React, { useCallback } from 'react';
import { RecoilRoot } from 'recoil';
import { FormSchema, useForm } from '.';
import * as z from 'zod';
import { vi, describe, test, expect, expectTypeOf } from 'vitest';
import { render, screen, renderHook, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ValueObserver } from './utils/observers';

describe('useForm', () => {
  const Internal = z.number().brand<'MM'>();
  type Internal = z.infer<typeof Internal>;
  const mkInternal = (mm: number) => Internal.parse(mm);

  const External = z.number().brand<'M'>();
  type External = z.infer<typeof External>;
  const mkExternal = (mm: number) => External.parse(mm);

  const i2e = (mm: Internal) => mkExternal(mm / 1000);
  const e2i = (m: External) => mkInternal(m * 1000);

  describe('getValue', () => {
    test("When specifying 'in' and 'ex', it retrieves the internal data structure when 'getValue' is called", async () => {
      const schema = {
        width: {
          in: Internal,
          ex: External,
          i2e: i2e,
          e2i: e2i,
        },
      } satisfies FormSchema;

      const { result } = renderHook(
        () =>
          useForm(schema, {
            defaultValues: {
              width: mkInternal(1000),
            },
          }),
        {
          wrapper: RecoilRoot,
        },
      );

      expect(result.current.values.width).toEqual(1000);
      expect(result.current.getValue('width')).toEqual(1000);
    });

    test("When only specifying 'in', it retrieves the internal data structure when 'getValue' is called", async () => {
      const schema = {
        width: {
          in: Internal,
        },
      } satisfies FormSchema;

      const { result } = renderHook(
        () =>
          useForm(schema, {
            defaultValues: {
              width: mkInternal(1000),
            },
          }),
        {
          wrapper: RecoilRoot,
        },
      );

      expect(result.current.values.width).toEqual(1000);
      expect(result.current.getValue('width')).toEqual(1000);
    });
  });

  describe('setValue', () => {
    test("When specifying 'in' and 'ex', it can set the value of the internal data structure", async () => {
      const schema = {
        width: {
          in: Internal,
          ex: External,
          i2e: i2e,
          e2i: e2i,
        },
      } satisfies FormSchema;

      const { result } = renderHook(
        () =>
          useForm(schema, {
            defaultValues: {
              width: mkInternal(1000),
            },
          }),
        {
          wrapper: RecoilRoot,
        },
      );

      act(() => {
        result.current.setValue('width')(mkInternal(2000));
      });

      expect(result.current.values.width).toEqual(2000);
    });

    test("When only specifying 'in', it can set the value of the internal data structure", async () => {
      const schema = {
        width: {
          in: Internal,
        },
      } satisfies FormSchema;

      const { result } = renderHook(
        () =>
          useForm(schema, {
            defaultValues: {
              width: mkInternal(1000),
            },
          }),
        {
          wrapper: RecoilRoot,
        },
      );

      act(() => {
        result.current.setValue('width')(mkInternal(2000));
      });

      expect(result.current.values.width).toEqual(2000);
    });
  });

  test('If the default value is unspecified, the internal data type is T | null', async () => {
    const schema = {
      height: {
        in: z.number(),
      },
      width: {
        in: z.number(),
      },
    } satisfies FormSchema;

    const { result } = renderHook(
      () =>
        useForm(schema, {
          defaultValues: {
            height: 0,
          },
        }),
      {
        wrapper: RecoilRoot,
      },
    );

    const { height, width } = result.current.values;
    expectTypeOf(height).toEqualTypeOf<number>();
    expectTypeOf(width).toEqualTypeOf<number | null>();

    const { getValue } = result.current;
    expectTypeOf(getValue('height')).toEqualTypeOf<number>();
    expectTypeOf(getValue('width')).toEqualTypeOf<number | null>();
  });

  test('Validation is functioning', async () => {
    const schema = {
      width: {
        in: z.number().min(5, { message: 'length must be greater than 5' }),
      },
    } satisfies FormSchema;

    const { result } = renderHook(
      () =>
        useForm(schema, {
          defaultValues: {
            width: 0,
          },
        }),
      {
        wrapper: RecoilRoot,
      },
    );

    expect(result.current.errors.width.message).toEqual(
      'length must be greater than 5',
    );
  });
});

describe('useForm with DOM', () => {
  const Internal = z.number().brand<'MM'>();
  type Internal = z.infer<typeof Internal>;
  const mkInternal = (mm: number) => Internal.parse(mm);

  const External = z.number().brand<'M'>();
  type External = z.infer<typeof External>;
  const mkExternal = (mm: number) => External.parse(mm);

  const i2e = (mm: Internal) => mkExternal(mm / 1000);
  const e2i = (m: External) => mkInternal(m * 1000);

  test('What is displayed on the field is the external value', async () => {
    const schema = {
      width: {
        in: Internal,
        ex: External,
        i2e: i2e,
        e2i: e2i,
      },
    } satisfies FormSchema;

    const App: React.FC = () => {
      const { register } = useForm(schema, {
        defaultValues: {
          width: mkInternal(1000),
        },
      });
      return <input role="textbox" {...register('width')} type="number" />;
    };

    render(
      <RecoilRoot>
        <App />
      </RecoilRoot>,
    );

    const user = userEvent.setup();

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue(1); // 初期値

    await user.clear(input);
    await user.type(input, '2'); // 2m
    expect(input).toHaveValue(2);
  });

  test("When only specifying 'in', the internal data is updated when input is made on the field", async () => {
    const onChange = vi.fn();

    const schema = {
      width: {
        in: z.number(),
        e2i: Number,
      },
    } satisfies FormSchema;

    const App: React.FC = () => {
      const { register, values } = useForm(schema, {
        defaultValues: {
          width: 0,
        },
      });
      return (
        <div>
          <input role="textbox" {...register('width')} type="number" />;
          <ValueObserver values={values} onChange={onChange} />
        </div>
      );
    };

    render(
      <RecoilRoot>
        <App />
      </RecoilRoot>,
    );

    const user = userEvent.setup();

    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, '2'); // 2m

    expect(onChange).toHaveBeenLastCalledWith({ width: 2 });
  });

  test("When specifying 'in' and 'ex', the internal data is updated when input is made on the field", async () => {
    const onChange = vi.fn();

    const schema = {
      width: {
        in: Internal,
        ex: External,
        i2e: i2e,
        e2i: e2i,
      },
    } satisfies FormSchema;

    const App: React.FC = () => {
      const { register, values } = useForm(schema, {
        defaultValues: {
          width: mkInternal(1000),
        },
      });
      return (
        <div>
          <input role="textbox" {...register('width')} type="number" />;
          <ValueObserver values={values} onChange={onChange} />
        </div>
      );
    };

    render(
      <RecoilRoot>
        <App />
      </RecoilRoot>,
    );

    const user = userEvent.setup();

    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, '2'); // 2m

    expect(onChange).toHaveBeenLastCalledWith({ width: 2000 });
  });

  test("The value on the input changes when 'setValue' is used", async () => {
    const schema = {
      width: {
        in: Internal,
        ex: External,
        i2e: i2e,
        e2i: e2i,
      },
    } satisfies FormSchema;

    const App: React.FC = () => {
      const { register, setValue } = useForm(schema, {
        defaultValues: {
          width: mkInternal(0),
        },
      });

      return (
        <form>
          <input role="textbox" {...register('width')} type="number" />
          <button
            type="button"
            onClick={() => setValue('width')(mkInternal(2000))}
          >
            set
          </button>
        </form>
      );
    };

    render(
      <RecoilRoot>
        <App />
      </RecoilRoot>,
    );

    const user = userEvent.setup();

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue(0); // 初期値

    await user.click(screen.getByText('set'));
    expect(input).toHaveValue(2);
  });

  test('The initial display when the default value is not specified is empty', async () => {
    const schema = {
      width: {
        in: Internal,
      },
    } satisfies FormSchema;

    const App: React.FC = () => {
      const { register } = useForm(schema);

      return <input role="textbox" {...register('width')} />;
    };

    render(
      <RecoilRoot>
        <App />
      </RecoilRoot>,
    );

    const user = userEvent.setup();

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue(''); // 初期値

    await user.type(input, '2');
    expect(input).toHaveValue('2');
  });

  test('handleSubmit', async () => {
    const schema = {
      width: {
        in: Internal,
        ex: External,
        i2e: i2e,
        e2i: e2i,
      },
    } satisfies FormSchema;

    const mockFn = vi.fn();

    const App: React.FC = () => {
      const { register, handleSubmit } = useForm(schema, {
        defaultValues: {
          width: mkInternal(0),
        },
      });

      const submit = useCallback((value: FormValues<typeof schema>) => {
        mockFn(value);
      }, []);

      return (
        <form onSubmit={handleSubmit(submit)}>
          <input role="textbox" {...register('width')} type="number" />
          <button type="submit">submit</button>
        </form>
      );
    };

    render(
      <RecoilRoot>
        <App />
      </RecoilRoot>,
    );

    const user = userEvent.setup();

    const input = screen.getByRole('textbox');
    await user.type(input, '2'); // 2m
    await user.click(screen.getByText('submit'));

    expect(mockFn).toHaveBeenCalledWith({ width: 2000 });
  });

  test("In the case of checkboxes, it becomes boolean even if 'e2i' is not specified", async () => {
    const onChange = vi.fn();

    const schema = {
      hasItem: {
        in: z.boolean(),
      },
    } satisfies FormSchema;

    const App: React.FC = () => {
      const { register, values } = useForm(schema, {
        defaultValues: {
          hasItem: true,
        },
      });
      return (
        <div>
          <input {...register('hasItem')} type="checkbox" />;
          <ValueObserver values={values} onChange={onChange} />
        </div>
      );
    };

    render(
      <RecoilRoot>
        <App />
      </RecoilRoot>,
    );

    const user = userEvent.setup();

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked(); // 初期値
    await user.click(checkbox);

    expect(checkbox).not.toBeChecked();
    expect(onChange).toHaveBeenLastCalledWith({ hasItem: false });
  });
});
