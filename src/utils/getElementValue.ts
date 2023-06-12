export const getElementValue = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.type === 'checkbox') {
    return e.target.checked;
  }

  return e.target.value;
};
