const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateAuthForm(kind, values) {
  const errors = {};
  if (kind === 'register' && !values.name.trim()) errors.name = 'required';
  if (!values.email.trim()) errors.email = 'required';
  else if (!emailPattern.test(values.email.trim())) errors.email = 'invalidEmail';
  if (kind !== 'recovery') {
    if (!values.password) errors.password = 'required';
    else if (kind === 'register' && values.password.length < 8) errors.password = 'shortPassword';
  }
  if (kind === 'register') {
    if (!values.confirmation) errors.confirmation = 'required';
    else if (values.confirmation !== values.password) errors.confirmation = 'passwordMismatch';
  }
  return errors;
}
