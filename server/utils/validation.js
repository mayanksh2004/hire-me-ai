const validateInput = (data, fields) => {
  const errors = [];
  for (const field of fields) {
    if (!data[field] || (typeof data[field] === "string" && !data[field].trim())) {
      errors.push(`${field} is required`);
    }
  }
  return errors;
};

export default validateInput;