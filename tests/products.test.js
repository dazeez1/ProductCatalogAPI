const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../server");

let server;
let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();

  await mongoose.disconnect();
  await mongoose.connect(mongoServer.getUri(), { dbName: "test" });

  server = app.listen(3001);
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

describe("Product API", () => {
  it("should fetch all products", async () => {
    const res = await request(server).get("/products");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });

  it("should return empty array when no products exist", async () => {
    const res = await request(server).get("/products");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });
});
