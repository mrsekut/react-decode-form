import React from 'react';
import { RecoilRoot, atom } from 'recoil';
import { Controller, useDecodeForm } from '.';
import * as z from 'zod';
import { vi, describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecoilObserver } from './utils/RecoilObserver';
import { FormSchema } from './useDecodeForm';

describe('Controller', () => {
  test('input via Controller', async () => {
    const schema = {
      name: { in: z.string() },
    } satisfies FormSchema;

    const state = atom({
      key: 'test/Controller/1',
      default: { name: '' },
    });

    const App: React.FC = () => {
      const { control } = useDecodeForm({ state, schema });

      return (
        <Controller
          name="name"
          control={control}
          render={({ field: { value, onChange } }) => (
            <input value={value} onChange={e => onChange(e.target.value)} />
          )}
        />
      );
    };

    const onChange = vi.fn();

    render(
      <RecoilRoot>
        <RecoilObserver node={state} onChange={onChange} />
        <App />
      </RecoilRoot>,
    );

    const user = userEvent.setup();

    const input = screen.getByRole('textbox');
    await user.type(input, 'hello');

    expect(input).toHaveValue('hello');
  });
});
