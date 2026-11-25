type Schema = Record<string, unknown>;

export function validateSchemaInstance(root: Schema, value: unknown): string[] {
  const errors: string[] = [];
  const walk = (schema: Schema, subject: unknown, path: string): void => {
    if (typeof schema.$ref === 'string') {
      const target = schema.$ref.split('/').slice(1).reduce<unknown>((current, key) => (current as Schema)?.[key], root);
      if (!target || typeof target !== 'object') errors.push(`${path}: unresolved ${schema.$ref}`); else walk(target as Schema, subject, path);
      return;
    }
    if ('const' in schema && subject !== schema.const) errors.push(`${path}: const`);
    if (Array.isArray(schema.enum) && !schema.enum.includes(subject)) errors.push(`${path}: enum`);
    if (schema.type === 'object') {
      if (!subject || typeof subject !== 'object' || Array.isArray(subject)) { errors.push(`${path}: type object`); return; }
      const record = subject as Schema; const properties = (schema.properties ?? {}) as Record<string, Schema>;
      for (const key of (schema.required ?? []) as string[]) if (!(key in record)) errors.push(`${path}.${key}: required`);
      if (schema.additionalProperties === false) for (const key of Object.keys(record)) if (!(key in properties)) errors.push(`${path}.${key}: additional property`);
      for (const [key, property] of Object.entries(properties)) if (key in record) walk(property, record[key], `${path}.${key}`);
    } else if (schema.type === 'array') {
      if (!Array.isArray(subject)) { errors.push(`${path}: type array`); return; }
      if (typeof schema.minItems === 'number' && subject.length < schema.minItems) errors.push(`${path}: minItems`);
      if (schema.uniqueItems === true && new Set(subject.map((item) => JSON.stringify(item))).size !== subject.length) errors.push(`${path}: uniqueItems`);
      if (schema.items) subject.forEach((item, index) => walk(schema.items as Schema, item, `${path}[${index}]`));
    } else if (schema.type === 'string') {
      if (typeof subject !== 'string') { errors.push(`${path}: type string`); return; }
      if (typeof schema.minLength === 'number' && subject.length < schema.minLength) errors.push(`${path}: minLength`);
      if (typeof schema.pattern === 'string' && !new RegExp(schema.pattern).test(subject)) errors.push(`${path}: pattern`);
      if (schema.format === 'date-time' && Number.isNaN(Date.parse(subject))) errors.push(`${path}: date-time`);
    } else if (schema.type === 'integer' && (!Number.isInteger(subject))) errors.push(`${path}: type integer`);
    else if (schema.type === 'boolean' && typeof subject !== 'boolean') errors.push(`${path}: type boolean`);
    else if (schema.type === 'number' && typeof subject !== 'number') errors.push(`${path}: type number`);
    if (typeof subject === 'number' && typeof schema.minimum === 'number' && subject < schema.minimum) errors.push(`${path}: minimum`);
  };
  walk(root, value, '$');
  return errors;
}
