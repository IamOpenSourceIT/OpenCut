let counter = 0;

export function generateUUID(): string {
  counter += 1;
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${random}-${counter}`;
}
