const { Pool, Client } = require('pg');
const { AsyncLocalStorage } = require('async_hooks');

const empresaContext = new AsyncLocalStorage();

const commonOptions = {
  statement_timeout: Number(process.env.DB_STATEMENT_TIMEOUT || 30000),
  connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT || 5000),
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
};

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = Number(process.env.DB_PORT || 5432);
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD;

const EMPRESA_1 = process.env.DB_EMPRESA_1 || '0103749594001';
const EMPRESA_2 = process.env.DB_EMPRESA_2 || '0195141177001';

function normalizarEmpresa(empresa) {
  const valor = String(empresa || '').trim();

  if (valor === EMPRESA_1) return EMPRESA_1;
  if (valor === EMPRESA_2) return EMPRESA_2;

  return EMPRESA_1;
}

function getConnectionConfig(empresa) {
  return {
    ...commonOptions,
    host: DB_HOST,
    port: DB_PORT,
    database: normalizarEmpresa(empresa),
    user: DB_USER,
    password: DB_PASSWORD,
  };
}

const pools = new Map();

function getPool(empresa) {
  const database = normalizarEmpresa(empresa);

  if (!pools.has(database)) {
    const pool = new Pool({
      ...getConnectionConfig(database),
      max: Number(process.env.DB_POOL_MAX || 20),
      idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT || 10000),
    });

    pool.on('error', (error) => {
      console.error(`PostgreSQL pool error [${database}]:`, error.message);
    });

    pools.set(database, pool);
  }

  return pools.get(database);
}

function getEmpresaActual() {
  return empresaContext.getStore() || EMPRESA_1;
}

function getPoolActual() {
  return getPool(getEmpresaActual());
}

function createDedicatedClient(empresa) {
  return new Client(getConnectionConfig(empresa || getEmpresaActual()));
}

function runWithEmpresa(empresa, callback) {
  return empresaContext.run(normalizarEmpresa(empresa), callback);
}

const poolProxy = {
  query(...args) {
    return getPoolActual().query(...args);
  },

  connect(...args) {
    return getPoolActual().connect(...args);
  },

  createDedicatedClient(empresa) {
    return createDedicatedClient(empresa);
  },

  getPool(empresa) {
    return getPool(empresa);
  },

  getEmpresaActual() {
    return getEmpresaActual();
  },

  runWithEmpresa,

  end() {
    return closeAllPools();
  },
};

async function closeAllPools() {
  for (const pool of pools.values()) {
    await pool.end();
  }

  pools.clear();
}

module.exports = poolProxy;
module.exports.getPool = getPool;
module.exports.createDedicatedClient = createDedicatedClient;
module.exports.closeAllPools = closeAllPools;
module.exports.normalizarEmpresa = normalizarEmpresa;
module.exports.getEmpresaActual = getEmpresaActual;
module.exports.runWithEmpresa = runWithEmpresa;
module.exports.EMPRESA_1 = EMPRESA_1;
module.exports.EMPRESA_2 = EMPRESA_2;
