const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");
const path = require("node:path");
const envFile = fs.readFileSync(path.resolve(__dirname, "../../../.env"), "utf8");
for (const line of envFile.split(/\r?\n/)) {
  const match = line.match(/^([^#=\s]+)=(.*)$/);
  if (match) process.env[match[1]] = match[2];
}
const { WebSocket } = require("ws");
const { prismaClient } = require("@repo/db/client");

const HTTP_URL = process.env.TEST_HTTP_URL || "http://localhost:3001";
const WS_URL = process.env.TEST_WS_URL || "ws://localhost:8080";
const ORIGIN = process.env.TEST_ORIGIN || "http://localhost:3002";

async function readJson(response) {
  const body = await response.json();
  return { body, response };
}

function waitForMessage(ws, type) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Timed out waiting for WebSocket message: ${type}`));
    }, 5000);

    const onMessage = (data) => {
      const message = JSON.parse(data.toString());

      if (message.type === type) {
        clearTimeout(timeout);
        ws.off("message", onMessage);
        resolve(message);
      }
    };

    ws.on("message", onMessage);
    ws.once("error", reject);
  });
}

test("email auth, rooms, persistence, and WebSockets work together", async (t) => {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const email = `e2e-${suffix}@example.com`;
  const collaboratorEmail = `collaborator-${suffix}@example.com`;
  const password = "correct-horse-battery-staple";
  const name = "Integration Test";
  const roomName = `e2e-${suffix}`.slice(0, 64);
  let roomId;

  t.after(async () => {
    if (roomId) {
      await prismaClient.chat.deleteMany({ where: { roomId } });
      await prismaClient.roomMember.deleteMany({ where: { roomId } });
      await prismaClient.room.deleteMany({ where: { id: roomId } });
    }

    await prismaClient.user.deleteMany({ where: { email } });
    await prismaClient.user.deleteMany({ where: { email: collaboratorEmail } });
    await prismaClient.$disconnect();
  });

  const ready = await fetch(`${HTTP_URL}/ready`, {
    headers: { origin: ORIGIN },
  });
  assert.equal(ready.status, 200);
  assert.equal(ready.headers.get("access-control-allow-origin"), ORIGIN);

  const signup = await readJson(
    await fetch(`${HTTP_URL}/api/signup`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: email, password, name }),
    }),
  );
  assert.equal(signup.response.status, 201);
  assert.equal(signup.body.email, email);
  assert.equal(signup.body.name, name);
  assert.equal(typeof signup.body.token, "string");

  const signin = await readJson(
    await fetch(`${HTTP_URL}/api/signin`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: email, password }),
    }),
  );
  assert.equal(signin.response.status, 200);
  assert.equal(signin.body.userId, signup.body.userId);

  const unauthorizedRooms = await fetch(`${HTTP_URL}/api/user/rooms`);
  assert.equal(unauthorizedRooms.status, 401);

  const malformedRoom = await fetch(`${HTTP_URL}/api/room/1junk/shapes`, {
    headers: { authorization: `Bearer ${signin.body.token}` },
  });
  assert.equal(malformedRoom.status, 400);

  const createRoom = await readJson(
    await fetch(`${HTTP_URL}/api/room`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${signin.body.token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ name: roomName }),
    }),
  );
  assert.equal(createRoom.response.status, 201);
  roomId = createRoom.body.roomId;

  const renamedRoom = await readJson(
    await fetch(`${HTTP_URL}/api/room/${roomId}`, {
      method: "PATCH",
      headers: {
        authorization: `Bearer ${signin.body.token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ name: `${roomName}-renamed` }),
    }),
  );
  assert.equal(renamedRoom.response.status, 200);
  assert.equal(renamedRoom.body.slug, `${roomName}-renamed`);

  const rooms = await readJson(
    await fetch(`${HTTP_URL}/api/user/rooms`, {
      headers: { authorization: `Bearer ${signin.body.token}` },
    }),
  );
  assert.equal(rooms.response.status, 200);
  assert.equal(
    rooms.body.rooms.some((room) => room.id === roomId),
    true,
  );

  const collaboratorSignup = await readJson(
    await fetch(`${HTTP_URL}/api/signup`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        username: collaboratorEmail,
        password,
        name: "Canvas Collaborator",
      }),
    }),
  );
  assert.equal(collaboratorSignup.response.status, 201);

  const joinRoom = await fetch(`${HTTP_URL}/api/room/${roomId}/join`, {
    method: "POST",
    headers: { authorization: `Bearer ${collaboratorSignup.body.token}` },
  });
  assert.equal(joinRoom.status, 200);

  const sharedRooms = await readJson(
    await fetch(`${HTTP_URL}/api/user/rooms`, {
      headers: { authorization: `Bearer ${collaboratorSignup.body.token}` },
    }),
  );
  assert.equal(
    sharedRooms.body.rooms.some(
      (room) => room.id === roomId && room.ownership === "shared",
    ),
    true,
  );

  const socketUrl = new URL(WS_URL);
  socketUrl.searchParams.set("token", signin.body.token);
  const ws = new WebSocket(socketUrl, { origin: ORIGIN });
  await waitForMessage(ws, "connected");

  const joined = waitForMessage(ws, "room_joined");
  ws.send(JSON.stringify({ type: "join_room", roomId }));
  await joined;

  const shape = {
    id: `shape-${suffix}`,
    type: "rect",
    x: 10,
    y: 20,
    width: 30,
    height: 40,
    color: "#000000",
    strokeWidth: 2,
  };
  ws.send(
    JSON.stringify({
      type: "draw",
      roomId,
      message: JSON.stringify({ shape }),
    }),
  );

  let shapes = [];

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const response = await readJson(
      await fetch(`${HTTP_URL}/api/room/${roomId}/shapes`, {
        headers: { authorization: `Bearer ${signin.body.token}` },
      }),
    );
    shapes = response.body.shapes;

    if (shapes.length > 0) {
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  assert.deepEqual(shapes, [shape]);

  const movedShape = { ...shape, x: 120, y: 160 };
  ws.send(
    JSON.stringify({
      type: "draw",
      roomId,
      message: JSON.stringify({
        action: "update",
        shapeId: shape.id,
        shape: movedShape,
      }),
    }),
  );

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const response = await readJson(
      await fetch(`${HTTP_URL}/api/room/${roomId}/shapes`, {
        headers: { authorization: `Bearer ${signin.body.token}` },
      }),
    );
    shapes = response.body.shapes;

    if (shapes[0]?.x === movedShape.x) break;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  assert.deepEqual(shapes, [movedShape]);

  ws.send(
    JSON.stringify({
      type: "draw",
      roomId,
      message: JSON.stringify({
        action: "lock",
        shapeId: shape.id,
        locked: true,
      }),
    }),
  );

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const response = await readJson(
      await fetch(`${HTTP_URL}/api/room/${roomId}/shapes`, {
        headers: { authorization: `Bearer ${signin.body.token}` },
      }),
    );
    shapes = response.body.shapes;
    if (shapes[0]?.locked) break;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  assert.deepEqual(shapes, [{ ...movedShape, locked: true }]);

  ws.send(
    JSON.stringify({
      type: "draw",
      roomId,
      message: JSON.stringify({ action: "delete", shapeId: shape.id }),
    }),
  );

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const response = await readJson(
      await fetch(`${HTTP_URL}/api/room/${roomId}/shapes`, {
        headers: { authorization: `Bearer ${signin.body.token}` },
      }),
    );
    shapes = response.body.shapes;
    if (shapes.length === 0) break;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  assert.deepEqual(shapes, []);
  ws.close();

  const roomsWithCollaborators = await readJson(
    await fetch(`${HTTP_URL}/api/user/rooms`, {
      headers: { authorization: `Bearer ${signin.body.token}` },
    }),
  );
  const createdRoom = roomsWithCollaborators.body.rooms.find(
    (room) => room.id === roomId,
  );
  assert.equal(
    createdRoom.collaborators.some(
      (collaborator) => collaborator.id === signup.body.userId,
    ),
    true,
  );

  const deleted = await fetch(`${HTTP_URL}/api/room/${roomId}`, {
    method: "DELETE",
    headers: { authorization: `Bearer ${signin.body.token}` },
  });
  assert.equal(deleted.status, 204);
  roomId = undefined;
});
