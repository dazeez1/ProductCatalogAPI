const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../server");
const User = require("../models/user");
const jwt = require("jsonwebtoken");

let server;
let mongoServer;
let categoryId;
let adminToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();

  await mongoose.disconnect();
  await mongoose.connect(mongoServer.getUri(), { dbName: "test" });

  server = app.listen(3002);

  const adminUser = new User({
    username: "admin",
    email: "admin@test.com",
    password: "password123",
    role: "admin",
  });
  await adminUser.save();

  adminToken = jwt.sign(
    { id: adminUser._id, email: adminUser.email, role: adminUser.role },
    process.env.SECRET_KEY || "test-secret",
    { expiresIn: "1h" }
  );
}, 10000);

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
  if (server) {
    server.close();
  }
});

describe("Category API", () => {
  it("should create a new category", async () => {
    const res = await request(server)
      .post("/categories")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Electronics" });

    expect(res.statusCode).toBe(201);
    expect(res.body.name).toBe("Electronics");
    categoryId = res.body._id;
  });

  it("should fetch all categories", async () => {
    const res = await request(server).get("/categories");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });

  it("should fetch a specific category", async () => {
    if (!categoryId) return;

    const res = await request(server).get(`/categories/${categoryId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body._id).toBe(categoryId);
  });

  it("should update a category", async () => {
    if (!categoryId) return;

    const res = await request(server)
      .put(`/categories/${categoryId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Updated Electronics" });

    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe("Updated Electronics");
  });

  it("should delete a category", async () => {
    if (!categoryId) return;

    const res = await request(server)
      .delete(`/categories/${categoryId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);

    const checkRes = await request(server).get(`/categories/${categoryId}`);
    expect(checkRes.statusCode).toBe(404);
  });
});
