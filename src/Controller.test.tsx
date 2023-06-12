import React from 'react';
import { RecoilRoot } from 'recoil';
import { Controller, useForm } from '.';
import * as z from 'zod';
import { vi, describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ValueObserver } from './utils/observers';
import { FormSchema } from './types';

describe('Controller', () => {
  test('input via Controller', async () => {
    const schema = {
      name: {
        in: z.string(),
      },
    } satisfies FormSchema;

    const App: React.FC = () => {
      const { control, values } = useForm(schema, {
        defaultValues: {
          name: '',
        },
      });

      return (
        <div>
          <Controller
            name="name"
            control={control}
            render={({ field: { value, onChange } }) => (
              <input value={value} onChange={e => onChange(e.target.value)} />
            )}
          />
          <ValueObserver values={values} onChange={onChange} />
        </div>
      );
    };

    const onChange = vi.fn();
    render(
      <RecoilRoot>
        <App />
      </RecoilRoot>,
    );

    const user = userEvent.setup();

    const input = screen.getByRole('textbox');
    await user.type(input, 'hello');

    expect(input).toHaveValue('hello');
  });
});
