let storedSchema = null;

export const schemaStore = {
  set(data) {
    storedSchema = data;
  },
  get() {
    return storedSchema;
  },
  clear() {
    storedSchema = null;
  },
  isAvailable() {
    return storedSchema !== null;
  },
};
