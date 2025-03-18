"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/server.ts
var import_client = require("@prisma/client");
var import_fastify = __toESM(require("fastify"));
var import_zod = require("zod");
var import_jsonwebtoken = __toESM(require("jsonwebtoken"));
var cron = require("node-cron");
var app = (0, import_fastify.default)();
var prisma = new import_client.PrismaClient();
var authenticate = async (request, reply) => {
  try {
    const token = request.headers.authorization?.split(" ")[1];
    if (!token) {
      return reply.status(401).send({ message: "Token n\xE3o fornecido" });
    }
    const decoded = import_jsonwebtoken.default.verify(token, process.env.JWT_SECRET);
    request.user = decoded;
    return true;
  } catch (error) {
    return reply.status(401).send({ message: "Token inv\xE1lido" });
  }
};
app.post("/login", async (request, reply) => {
  try {
    const searchUserSchema = import_zod.z.object({
      email: import_zod.z.string().email(),
      password: import_zod.z.string()
    });
    const { email, password } = searchUserSchema.parse(request.body);
    const search = await prisma.user.findUnique({
      where: {
        email,
        password
      }
    });
    if (!search) {
      return reply.status(401).send({ message: "Credenciais inv\xE1lidas" });
    }
    const token = import_jsonwebtoken.default.sign(
      { userId: search.id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    return reply.status(202).send({
      token,
      user: {
        name: search.name,
        email: search.email
      }
    });
  } catch (error) {
    return { error };
  }
});
app.post("/register", async (request, reply) => {
  const createUserSchema = import_zod.z.object({
    name: import_zod.z.string(),
    email: import_zod.z.string().email(),
    password: import_zod.z.string()
  });
  const { name, email, password } = createUserSchema.parse(request.body);
  await prisma.user.create({
    data: {
      name,
      email,
      password
    }
  });
  return reply.status(201).send();
});
app.get("/users", { preHandler: authenticate }, async () => {
  const users = await prisma.user.findMany();
  return { users };
});
app.post("/deleteuser", { preHandler: authenticate }, async (request, reply) => {
  try {
    const deleteUserSchema = import_zod.z.object({
      email: import_zod.z.string().email(),
      password: import_zod.z.string()
    });
    const { email, password } = deleteUserSchema.parse(request.body);
    await prisma.user.delete({
      where: {
        email,
        password
      }
    });
    return reply.status(202).send();
  } catch (error) {
    return reply.status(400).send({ error: "Erro ao deletar o usu\xE1rio", details: error });
  }
});
app.get("/cofre", { preHandler: authenticate }, async (request, reply) => {
  try {
    const search = await prisma.cofre.findMany();
    const cofreWithStringSaldo = search.map((cofre) => ({
      ...cofre,
      saldo: cofre.saldo.toString()
    }));
    return reply.status(202).send({ cofre: cofreWithStringSaldo });
  } catch (error) {
    return reply.status(400).send({ error: "Erro ao pesquisar cofres", details: error });
  }
});
app.post("/criacofre", { preHandler: authenticate }, async (request, reply) => {
  try {
    const createCofreSchema = import_zod.z.object({
      name: import_zod.z.string()
    });
    const { name } = createCofreSchema.parse(request.body);
    await prisma.cofre.create({
      data: {
        name,
        saldo: 0,
        updatedAt: /* @__PURE__ */ new Date()
      }
    });
    return reply.status(201).send();
  } catch (error) {
    return reply.status(400).send({ error: "Erro ao criar cofre", details: error });
  }
});
app.post("/deletarcofre", { preHandler: authenticate }, async (request, reply) => {
  try {
    const deleteCofreSchema = import_zod.z.object({
      name: import_zod.z.string()
    });
    const { name } = deleteCofreSchema.parse(request.body);
    await prisma.cofre.deleteMany({
      where: {
        name
      }
    });
    return reply.status(201).send({ mensage: "O cofre foi apagado!" });
  } catch (error) {
    return reply.status(400).send({ details: error });
  }
});
app.post("/cofresp", { preHandler: authenticate }, async (request, reply) => {
  try {
    const searchCofrespSchema = import_zod.z.object({
      id: import_zod.z.number()
    });
    const { id } = searchCofrespSchema.parse(request.body);
    const search = await prisma.cofre.findFirst({
      where: {
        id
      }
    });
    if (!search) {
      return reply.status(404).send({ message: "Cofre n\xE3o encontrado" });
    }
    const cofreWithStringValues = {
      ...search,
      saldo: search.saldo.toString()
      // Converte BigInt para string
    };
    const mudancas = await prisma.mudanca.findMany({
      where: {
        idCofre: id
      }
    });
    const somaTipoTrue = mudancas.filter((mudanca) => mudanca.tipo == true).reduce((total, mudanca) => total = mudanca.valor, 0);
    const somaTipoFalse = mudancas.filter((mudanca) => mudanca.tipo === false).reduce((total, mudanca) => total + mudanca.valor, 0);
    const resultado = somaTipoTrue - somaTipoFalse;
    const atualizarSaldoparaNada = await prisma.cofre.update({
      where: {
        id
      },
      data: {
        saldo: 0
      }
    });
    const atualizarSaldo = await prisma.cofre.update({
      where: {
        id
      },
      data: {
        saldo: resultado
      }
    });
    return reply.status(201).send({
      message: "Busca realizada",
      cofre: cofreWithStringValues,
      saltoAtualizado: resultado
    });
  } catch (error) {
    console.error(error);
    return reply.status(400).send({ details: error });
  }
});
app.post("/criamudanca", { preHandler: authenticate }, async (request, reply) => {
  try {
    const criaMudancaSchema = import_zod.z.object({
      idUser: import_zod.z.number(),
      idCofre: import_zod.z.number(),
      name: import_zod.z.string(),
      tipo: import_zod.z.boolean(),
      valor: import_zod.z.number()
    });
    const { idUser, idCofre, name, tipo, valor } = criaMudancaSchema.parse(request.body);
    const mudanca = await prisma.mudanca.create({
      data: {
        idUser,
        idCofre,
        name,
        tipo,
        valor
      }
    });
    return reply.status(201).send({ message: "Mudan\xE7a criado", Mudanca: mudanca });
  } catch (error) {
    return reply.status(400).send({ message: error });
  }
});
app.get("/mudanca", { preHandler: authenticate }, async (request, reply) => {
  try {
    const mudancas = await prisma.mudanca.findMany();
    return reply.status(202).send({ mudancas });
  } catch (error) {
    return reply.status(400).send({ message: error });
  }
});
app.post("/deletemudanca", { preHandler: authenticate }, async (request, reply) => {
  try {
    const deleteMudancaSchema = import_zod.z.object({
      id: import_zod.z.number()
    });
    const { id } = deleteMudancaSchema.parse(request.body);
    const delet = await prisma.mudanca.delete({
      where: {
        id
      }
    });
    return reply.status(202).send({ message: "Mudanca Apagada!", mudanca: delet });
  } catch (error) {
    return reply.status(400).send({ message: error });
  }
});
cron.schedule("*/01 * * * *", async () => {
  console.log("Cron rodou!");
});
app.listen({
  host: "0.0.0.0",
  port: process.env.PORT ? Number(process.env.PORT) : 3333
}).then(() => {
  console.log("Server is Running \u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022");
});
