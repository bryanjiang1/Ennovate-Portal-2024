const assert = require("node:assert/strict");
const { test } = require("node:test");
const { loadSource } = require("./helpers/load-source.cjs");

test("missing REDIS_URL imports safely without constructing a cache client", () => {
  const previous = process.env.REDIS_URL;
  delete process.env.REDIS_URL;
  try {
    const { redis } = loadSource("src/lib/redis.ts", {
      ioredis: {
        Redis: class {
          constructor() {
            throw new Error("Unexpected Redis connection");
          }
        },
      },
    });
    assert.equal(redis, null);
  } finally {
    if (previous === undefined) delete process.env.REDIS_URL;
    else process.env.REDIS_URL = previous;
  }
});

test("configured Redis defers its network connection until a runtime command", () => {
  const previous = process.env.REDIS_URL;
  process.env.REDIS_URL = "redis://cache.example.test:6379";
  try {
    let options;
    const { redis } = loadSource("src/lib/redis.ts", {
      ioredis: {
        Redis: class {
          constructor(url, config) {
            assert.equal(url, process.env.REDIS_URL);
            options = config;
          }
        },
      },
    });
    assert.ok(redis);
    assert.equal(options.lazyConnect, true);
  } finally {
    if (previous === undefined) delete process.env.REDIS_URL;
    else process.env.REDIS_URL = previous;
  }
});

const resources = [
  ["projects", "Project", "query"],
  ["business-proposals", "BusinessProposal", "read"],
  ["business-workshops", "BusinessWorkshop", "read"],
  ["blog", "Blog", "query"],
];
const request = (body = {}) => ({ json: async () => body });
const params = { params: { id: "member-id" } };
function mocksFor(modelName, model, redis = null) {
  return {
    [`@/models/${modelName}`]: model,
    "@/lib/redis": { redis },
    "@/lib/mongoose": { connectToDatabase: async () => {} },
    "@sentry/nextjs": { captureException() {}, captureMessage() {} },
  };
}

for (const [resource, modelName, listRoute] of resources) {
  test(`${resource} reads from MongoDB when Redis is absent`, async () => {
    let reads = 0;
    const documents = [];
    const model = {
      find() {
        reads++;
        // Projects populate related models before awaiting the query.
        const query = Promise.resolve(documents);
        query.populate = () => query;
        return query;
      },
    };
    const route = loadSource(
      `src/app/api/${resource}/${listRoute}/route.ts`,
      mocksFor(modelName, model),
    );
    const response = await route.POST(request());
    assert.equal(response.status, 200);
    assert.equal(reads, 1);
    assert.deepEqual(await response.json(), []);
  });

  for (const [action, method, modelMethod] of [
    ["create", "POST", "create"],
    ["update/[id]", "PUT", "findByIdAndUpdate"],
    ["delete/[id]", "DELETE", "findByIdAndDelete"],
  ]) {
    test(`${resource} ${action} succeeds without cache invalidation when Redis is absent`, async () => {
      let writes = 0;
      const model = {
        [modelMethod]: async () => {
          writes++;
          return { _id: "member-id" };
        },
      };
      const route = loadSource(
        `src/app/api/${resource}/${action}/route.ts`,
        mocksFor(modelName, model),
      );
      const response = await route[method](
        request({ name: "Example", title: "Example" }),
        params,
      );
      assert.equal(response.status, 200);
      assert.equal(writes, 1);
    });
  }
}

for (const [resource, modelName] of resources.slice(1, 3)) {
  test(`${resource} detail reads skip optional cache pipelines`, async () => {
    const document = { _id: "member-id", name: "Example" };
    const route = loadSource(
      `src/app/api/${resource}/query/[id]/route.ts`,
      mocksFor(modelName, {
        findById: async () => document,
      }),
    );
    const response = await route.GET(request(), params);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), document);
  });
}

test("a configured cache still serves cached results and invalidates after writes", async () => {
  const deleted = [];
  const redis = {
    get: async () => JSON.stringify([{ name: "Cached project" }]),
    del: async (keys) => deleted.push(...keys),
  };
  const mocks = mocksFor(
    "Project",
    {
      find() {
        throw new Error("Cache hit should skip MongoDB query");
      },
      create: async () => ({}),
    },
    redis,
  );
  const read = loadSource("src/app/api/projects/query/route.ts", mocks);
  assert.deepEqual(await (await read.POST(request())).json(), [
    { name: "Cached project" },
  ]);
  const create = loadSource("src/app/api/projects/create/route.ts", mocks);
  assert.equal((await create.POST(request())).status, 200);
  assert.deepEqual(deleted, ["project"]);
});
