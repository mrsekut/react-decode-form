import React, { useCallback } from 'react';
import { RecoilRoot, atom } from 'recoil';
import { FormSchema, FormState, useForm } from '.';
import * as z from 'zod';
import { vi, describe, test, expect } from 'vitest';
import { render, screen, renderHook, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecoilObserver } from './utils/RecoilObserver';

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

      const state = atom({
        key: 'test/useForm/getValue/1',
        default: { width: mkInternal(1000) },
      });

      const { result } = renderHook(() => useForm({ state, schema }), {
        wrapper: RecoilRoot,
      });

      expect(result.current.values.width).toEqual(1000);
      expect(result.current.getValue('width')).toEqual(1000);
    });

    test("When only specifying 'in', it retrieves the internal data structure when 'getValue' is called", async () => {
      const schema = {
        width: {
          in: Internal,
        },
      } satisfies FormSchema;

      const state = atom({
        key: 'test/useForm/getValue/2',
        default: { width: mkInternal(1000) },
      });

      const { result } = renderHook(() => useForm({ state, schema }), {
        wrapper: RecoilRoot,
      });

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

      const state = atom({
        key: 'test/useForm/setValue/1',
        default: { width: mkInternal(1000) },
      });

      const { result } = renderHook(() => useForm({ state, schema }), {
        wrapper: RecoilRoot,
      });

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

      const state = atom({
        key: 'test/useForm/setValue/2',
        default: { width: mkInternal(1000) },
      });

      const { result } = renderHook(() => useForm({ state, schema }), {
        wrapper: RecoilRoot,
      });

      act(() => {
        result.current.setValue('width')(mkInternal(2000));
      });

      expect(result.current.values.width).toEqual(2000);
    });
  });

  test('Validation is functioning', async () => {
    const schema = {
      width: {
        in: z.number().min(5, { message: 'length must be greater than 5' }),
      },
    } satisfies FormSchema;

    const state = atom({
      key: 'test/useForm/validation/1',
      default: { width: 0 },
    });

    const { result } = renderHook(() => useForm({ state, schema }), {
      wrapper: RecoilRoot,
    });

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

    const state = atom({
      key: 'test/useForm/DOM/register/1',
      default: { width: mkInternal(1000) },
    });

    const App: React.FC = () => {
      const { register } = useForm({ state, schema });
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

    const state = atom({
      key: 'test/useForm/DOM/register/2',
      default: { width: 0 },
    });

    const App: React.FC = () => {
      const { register } = useForm({ state, schema });
      return <input role="textbox" {...register('width')} type="number" />;
    };

    render(
      <RecoilRoot>
        <RecoilObserver node={state} onChange={onChange} />
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

    const state = atom({
      key: 'test/useForm/DOM/register/3',
      default: { width: mkInternal(1000) },
    });

    const App: React.FC = () => {
      const { register } = useForm({ state, schema });
      return <input role="textbox" {...register('width')} type="number" />;
    };

    render(
      <RecoilRoot>
        <RecoilObserver node={state} onChange={onChange} />
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

    const state = atom({
      key: 'test/useForm/DOM/setValue/1',
      default: { width: mkInternal(0) },
    });

    const App: React.FC = () => {
      const { register, setValue } = useForm({ state, schema });

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

  test('handleSubmit', async () => {
    const schema = {
      width: {
        in: Internal,
        ex: External,
        i2e: i2e,
        e2i: e2i,
      },
    } satisfies FormSchema;

    const state = atom({
      key: 'test/useForm/DOM/handleSubmit/1',
      default: { width: mkInternal(0) },
    });

    const mockFn = vi.fn();

    const App: React.FC = () => {
      const { register, handleSubmit } = useForm({ state, schema });

      const submit = useCallback((value: FormState<typeof schema>) => {
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

    const schema = { hasItem: { in: z.boolean() } } satisfies FormSchema;

    const state = atom({
      key: 'test/useForm/DOM/checkbox/1',
      default: { hasItem: true },
    });

    const App: React.FC = () => {
      const { register } = useForm({ state, schema });
      return <input {...register('hasItem')} type="checkbox" />;
    };

    render(
      <RecoilRoot>
        <RecoilObserver node={state} onChange={onChange} />
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
