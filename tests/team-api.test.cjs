const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");

// Execute the actual route handlers with only the database and telemetry mocked.
function loadSource(relativePath, mocks, cache = new Map()) {
  const filename = path.resolve(__dirname, "..", relativePath);
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} };
  cache.set(filename, module);
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText;
  const localRequire = (name) => {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    if (name === "@/lib/redis")
      throw new Error("Team edits must not depend on Redis");
    if (name.startsWith("@/"))
      return loadSource(`src/${name.slice(2)}.ts`, mocks, cache);
    return require(name);
  };
  vm.runInThisContext(`(function(require, module, exports) {${source}\n})`, {
    filename,
  })(localRequire, module, module.exports);
  return module.exports;
}

function setup() {
  let members = [];
  const matches = (member, filter) =>
    !filter.$or ||
    filter.$or.some((condition) =>
      Object.entries(condition).some(([field, regex]) =>
        new RegExp(regex.$regex, regex.$options).test(member[field]),
      ),
    );
  const checkEmail = (data, id) => {
    if (
      members.some((member) => member.email === data.email && member._id !== id)
    ) {
      throw Object.assign(new Error("Duplicate email"), { code: 11000 });
    }
  };
  const model = {
    async create(data) {
      checkEmail(data);
      const member = { ...data, _id: String(members.length + 1) };
      members.push(member);
      return member;
    },
    async findByIdAndUpdate(id, data, options) {
      assert.equal(options.runValidators, true);
      checkEmail(data, id);
      const member = members.find((entry) => entry._id === id);
      if (member) Object.assign(member, data);
      return member;
    },
    async findById(id) {
      return members.find((member) => member._id === id) || null;
    },
    async findByIdAndDelete(id) {
      const member = await this.findById(id);
      members = members.filter((entry) => entry._id !== id);
      return member;
    },
    async countDocuments(filter) {
      return members.filter((member) => matches(member, filter)).length;
    },
    find(filter) {
      let skip = 0;
      let limit = 12;
      return {
        sort(order) {
          assert.equal(order._id, 1);
          return this;
        },
        skip(value) {
          skip = value;
          return this;
        },
        limit(value) {
          limit = value;
          return this;
        },
        async exec() {
          return members
            .filter((member) => matches(member, filter))
            .slice(skip, skip + limit);
        },
      };
    },
  };
  const mocks = {
    "@/models/TeamMember": model,
    "@/lib/mongoose": { connectToDatabase: async () => {} },
    "@sentry/nextjs": { captureException() {}, captureMessage() {} },
  };
  const cache = new Map();
  const route = (file) =>
    loadSource(`src/app/api/team/${file}/route.ts`, mocks, cache);
  return {
    model,
    create: route("create").POST,
    update: route("update/[id]").PUT,
    remove: route("delete/[id]").DELETE,
    list: route("paginate").POST,
    query: route("query/[id]"),
  };
}

const request = (body) => ({ json: async () => body });
const params = (id = "1") => ({ params: { id } });
const member = (changes = {}) => ({
  name: "Alex",
  email: "alex@example.com",
  title: "Director",
  image:
    "https://firebasestorage.googleapis.com/v0/b/example/o/team%2Falex.png?alt=media",
  ...changes,
});

test("repeated adds and updates are immediately reflected in both list and editor reads without Redis", async () => {
  const api = setup();
  assert.equal((await api.create(request(member()))).status, 200);
  assert.equal((await api.list(request({}))).status, 200);
  assert.equal(
    (
      await api.create(
        request(member({ name: "Sam", email: "sam@example.com" })),
      )
    ).status,
    200,
  );
  let result = await (await api.list(request({}))).json();
  assert.equal(result.teamMembers.length, 2);
  for (const title of ["Project Manager", "Senior Director", "Advisor"]) {
    assert.equal(
      (await api.update(request(member({ title })), params())).status,
      200,
    );
    assert.equal(
      (await (await api.query.GET(null, params())).json()).title,
      title,
    );
    result = await (await api.list(request({}))).json();
    assert.equal(result.teamMembers[0].title, title);
  }
  assert.equal(api.query.dynamic, "force-dynamic");
  assert.equal((await api.remove(null, params())).status, 200);
  assert.equal(
    (await (await api.list(request({}))).json()).teamMembers.length,
    1,
  );
});

test("duplicate emails return actionable conflicts and leave the original member intact", async () => {
  const api = setup();
  await api.create(request(member()));
  const response = await api.create(request(member({ name: "Someone else" })));
  assert.equal(response.status, 409);
  assert.match((await response.json()).message, /email already exists/);
  await api.create(request(member({ email: "sam@example.com" })));
  assert.equal((await api.update(request(member()), params("2"))).status, 409);
  assert.equal(
    (await (await api.list(request({}))).json()).teamMembers.length,
    2,
  );
});

test("invalid input and missing records cannot report successful saves", async () => {
  const api = setup();
  for (const invalid of [
    { name: "  " },
    { email: "invalid" },
    { image: "data:image/png;base64,abc" },
  ]) {
    assert.equal((await api.create(request(member(invalid)))).status, 400);
    assert.equal(
      (await api.update(request(member(invalid)), params())).status,
      400,
    );
  }
  assert.equal((await api.update(request(member()), params())).status, 404);
  assert.equal((await api.remove(null, params())).status, 404);
  assert.equal((await api.query.GET(null, params())).status, 404);
});

test("database failures report a failure instead of success", async () => {
  const api = setup();
  api.model.create = async () => {
    throw new Error("Database unavailable");
  };
  assert.equal((await api.create(request(member()))).status, 500);
  assert.equal(
    (await (await api.list(request({}))).json()).teamMembers.length,
    0,
  );
});

test("search treats punctuation literally and rejects invalid pages", async () => {
  const api = setup();
  await api.create(request(member({ name: "Alex (Director)" })));
  await api.create(request(member({ name: "Sam", email: "sam@example.com" })));
  const result = await (await api.list(request({ query: "(" }))).json();
  assert.equal(result.teamMembers.length, 1);
  for (const currentPage of [0, -1, 1.5, "2"]) {
    assert.equal((await api.list(request({ currentPage }))).status, 400);
  }
});

test("photo cleanup uses the saved URL after a member is renamed", async () => {
  const deleted = [];
  const utils = loadSource("src/utils/utils.ts", {
    "@/lib/firebase": { storage: {} },
    "firebase/storage": {
      ref: (_, url) => url,
      deleteObject: async (url) => deleted.push(url),
    },
  });
  const image = member().image;
  await utils.deleteFirebaseImage(image);
  assert.deepEqual(deleted, [image]);
});
