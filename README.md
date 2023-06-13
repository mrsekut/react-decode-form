# react-decode-form

## What?

`react-decode-form` is a custom hooks library designed to help manage form data in your React applications. It provides a simple and efficient way to separate the management of internal and external data structures. The form component acts as the boundary, converting the data into the correct structure.

## How?

To achieve this separation and conversion, `react-decode-form` operates using four key components:

1. **External structure**: This is the user-facing data structure. It should be easily convertible to a string. Examples include units like `MM`, `CM`, `M`, etc.
2. **Internal structure**: This represents the correct data types that your application uses. If you want to standardize the units across your application, you might want to convert everything to `MM`, for example.
3. **Internal-to-external conversion function**: A function that handles the conversion from the internal structure to the external structure. It also handles validation.
4. **External-to-internal conversion function**: A function that converts from the external structure to the internal structure.

## Installation

```sh
npm i react-decode-form
```

## Usage

Here's an example of using `react-decode-form`:

```js
import { useForm, FormSchema } from 'react-decode-form';

const schema = {
  width: {
    in: MM,  // External structure
    ex: CM,  // Internal structure
    i2e: mm2cm, // Internal-to-external conversion function
    e2i: cm2mm, // External-to-internal conversion function
  },
  height: {
    in: MM,  // External structure
  },
} satisfies FormSchema;

const Form: React.FC = () => {
  const { register, values } = useForm(schema, {
    defaultValues: {
      width: mkMM(0),
      // height is not specified in defaultValues, so its type will be 'number | null'
    },
  });

  const width = values.width; // number
  const height = values.height; // number | null
  return (
    <div>
      <input {...register('width')} type="number" />
      <input {...register('height')} type="number" />
    </div>
  );
};
```

In this example, the `schema` defines the external and internal structures, along with the conversion functions. If no conversion is required, elements 2-4 (in,i2e,e2i) can be omitted. It provides a similar API to `react-hook-form`, including `register`, `getValue`, `setValue`, `errors`, `<Controller/>`, etc.

The library ensures type safety. The `getValue()` and `values` methods return the correct data structure in your internal world. The type of `getValue()` and `values` corresponds to the internal data structure. If `defaultValues` aren't specified for a field, the type will be `T | null`.

## Contributing

Welcome

## License

MIT
