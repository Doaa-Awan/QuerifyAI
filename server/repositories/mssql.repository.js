// data access code
// Data repository for managing SQL Server connection state

const dbState = {
  pool: null,
  available: false,
};

export const mssqlRepository = {
  getPool() {
    return dbState.pool;
  },
  isAvailable() {
    return dbState.available;
  },
  async replacePool(newPool) {
    if (dbState.pool && dbState.pool !== newPool) {
      try {
        await dbState.pool.close();
      } catch (err) {
        /* ignore */
      }
    }

    dbState.pool = newPool;
    dbState.available = true;
  },
  async clear() {
    if (dbState.pool) {
      try {
        await dbState.pool.close();
      } catch (err) {
        /* ignore */
      }
    }
    dbState.pool = null;
    dbState.available = false;
  },
};
