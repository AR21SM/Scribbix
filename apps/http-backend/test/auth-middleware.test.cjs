const assert = require("node:assert/strict");
const test = require("node:test");
const jwt = require("jsonwebtoken");

process.env.DATABASE_URL =
  "postgresql://scribbix:scribbix@localhost:5432/scribbix?schema=public";
process.env.JWT_SECRET = "test-secret-that-is-longer-than-thirty-two-bytes";

const {
  JWT_AUDIENCE,
  JWT_ISSUER,
  JWT_SECRET,
} = require("@repo/backend-common/config");
const { middleware } = require("../dist/middleware.js");

function runMiddleware(authorization) {
  const request = {
    get(name) {
      return name === "authorization" ? authorization : undefined;
    },
  };
  const response = {
    body: undefined,
    headers: {},
    statusCode: 200,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  let nextCalled = false;

  middleware(request, response, () => {
    nextCalled = true;
  });

  return { nextCalled, request, response };
}

test("accepts a valid bearer token", () => {
  const token = jwt.sign({ userId: "user-123" }, JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: "7d",
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
  const result = runMiddleware(`Bearer ${token}`);

  assert.equal(result.nextCalled, true);
  assert.equal(result.request.userId, "user-123");
  assert.equal(result.response.statusCode, 200);
});

test("rejects a missing bearer token", () => {
  const result = runMiddleware(undefined);

  assert.equal(result.nextCalled, false);
  assert.equal(result.response.statusCode, 401);
  assert.deepEqual(result.response.body, { message: "Unauthorized" });
  assert.equal(
    result.response.headers["WWW-Authenticate"],
    'Bearer realm="scribbix"',
  );
});

test("rejects a malformed authorization header", () => {
  const result = runMiddleware("not-a-bearer-token");

  assert.equal(result.nextCalled, false);
  assert.equal(result.response.statusCode, 401);
});

test("rejects a token signed with another secret", () => {
  const token = jwt.sign(
    { userId: "user-123" },
    "another-secret-that-is-longer-than-thirty-two-bytes",
    {
      algorithm: "HS256",
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    },
  );
  const result = runMiddleware(`Bearer ${token}`);

  assert.equal(result.nextCalled, false);
  assert.equal(result.response.statusCode, 401);
});
