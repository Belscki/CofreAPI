import { Prisma, PrismaClient } from "@prisma/client";
import fastify, { FastifyRequest, FastifyReply } from "fastify";
import { request } from "http";
import { bigint, date, number, z } from 'zod';
import jwt from 'jsonwebtoken';
import { uptime } from "process";
import { REPLServer } from "repl";
import fastifyCors from '@fastify/cors';

const cron = require("node-cron")
const app = fastify();
const prisma = new PrismaClient();

app.register(fastifyCors, {
    origin: '*',
});

const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const token = request.headers.authorization?.split(' ')[1];
        if (!token) {
            return reply.status(401).send({ message: 'Token não fornecido' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
        request.user = decoded;
        return true;
    } catch (error) {
        return reply.status(401).send({ message: 'Token inválido' });
    }
};

app.post('/login', async (request, reply) => {
    try {
        const searchUserSchema = z.object({
            email: z.string().email(),
            password: z.string(),
        });
        const { email, password } = searchUserSchema.parse(request.body);
        const search = await prisma.user.findUnique({
            where: {
                email,
                password,
            },
        });
        if (!search) {
            return reply.status(401).send({ message: 'Credenciais inválidas' });
        }
        const token = jwt.sign(
            { userId: search.id },
            process.env.JWT_SECRET!,
            { expiresIn: '1h' }
        );
        return reply.status(202).send({
            token, user: {
                name: search.name,
                email: search.email
            }
        });
    } catch (error) {
        return { error }
    }

});

app.post('/register', async (request, reply) => {
    const createUserSchema = z.object({
        name: z.string(),
        email: z.string().email(),
        password: z.string(),
    })
    const { name, email, password } = createUserSchema.parse(request.body);
    await prisma.user.create({
        data: {
            name,
            email,
            password,
        }
    })
    return reply.status(201).send()
})

app.get('/users', { preHandler: authenticate }, async () => {
    const users = await prisma.user.findMany();
    return { users };
})

app.post('/deleteuser', { preHandler: authenticate }, async (request, reply) => {
    try {
        const deleteUserSchema = z.object({
            email: z.string().email(),
            password: z.string(),
        })
        const { email, password } = deleteUserSchema.parse(request.body);
        await prisma.user.delete({
            where: {
                email,
                password
            }
        })
        return reply.status(202).send()
    } catch (error) {
        return reply.status(400).send({ error: 'Erro ao deletar o usuário', details: error });
    }
})
app.get('/cofre', { preHandler: authenticate }, async (request, reply) => {
    try {
        const search = await prisma.cofre.findMany();
        const cofreWithStringSaldo = search.map(cofre => ({
            ...cofre,
            saldo: cofre.saldo.toString(),
        }));
        return reply.status(202).send({ cofre: cofreWithStringSaldo });
    } catch (error) {
        return reply.status(400).send({ error: 'Erro ao pesquisar cofres', details: error });
    }
});

app.post('/criacofre', { preHandler: authenticate }, async (request, reply) => {
    try {
        const createCofreSchema = z.object({
            name: z.string()
        })
        const { name } = createCofreSchema.parse(request.body)
        await prisma.cofre.create({
            data: {
                name,
                saldo: 0,
                updatedAt: new Date()
            }
        })
        return reply.status(201).send()
    } catch (error) {
        return reply.status(400).send({ error: 'Erro ao criar cofre', details: error });
    }
})

app.post("/deletarcofre", { preHandler: authenticate }, async (request, reply) => {
    try {
        const deleteCofreSchema = z.object({
            name: z.string()
        })
        const { name } = deleteCofreSchema.parse(request.body);
        await prisma.cofre.deleteMany({
            where: {
                name,
            }
        })
        return reply.status(201).send({ mensage: "O cofre foi apagado!" })
    } catch (error) {
        return reply.status(400).send({ details: error })
    }
})

app.post("/cofresp", { preHandler: authenticate }, async (request, reply) => {
    try {
        const searchCofrespSchema = z.object({
            id: z.number(),
        });
        const { id } = searchCofrespSchema.parse(request.body);
        const search = await prisma.cofre.findFirst({
            where: {
                id,
            },
        });
        if (!search) {
            return reply.status(404).send({ message: "Cofre não encontrado" });
        }
        const cofreWithStringValues = {
            ...search,
            saldo: search.saldo.toString(),  // Converte BigInt para string
        };
        const mudancas = await prisma.mudanca.findMany({
            where: {
                idCofre: id
            }
        })

        const somaTipoTrue = mudancas
            .filter(mudanca => mudanca.tipo === true)
            .reduce((total, mudanca) => total + mudanca.valor, 0)
            
        const somaTipoFalse = mudancas
            .filter(mudanca => mudanca.tipo === false)
            .reduce((total, mudanca) => total + mudanca.valor, 0);

        const resultado = somaTipoTrue - somaTipoFalse;
        console.log(somaTipoTrue + " - " + somaTipoFalse)
        const atualizarSaldoparaNada = await prisma.cofre.update({
            where: {
                id: id
            },
            data: {
                saldo: 0
            }
        })
        const atualizarSaldo = await prisma.cofre.update({
            where: {
                id: id
            },
            data: {
                saldo: resultado
            }
        })
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
        const criaMudancaSchema = z.object({
            idUser: z.number(),
            idCofre: z.number(),
            name: z.string(),
            tipo: z.boolean(),
            valor: z.number()
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
        })
        return reply.status(201).send({ message: "Mudança criado", Mudanca: mudanca })
    } catch (error) {
        return reply.status(400).send({ message: error });
    }
})

app.get("/mudanca", { preHandler: authenticate }, async (request, reply) => {
    try {
        const mudancas = await prisma.mudanca.findMany();
        return reply.status(202).send({ mudancas: mudancas })
    } catch (error) {
        return reply.status(400).send({ message: error });
    }
})

app.post("/deletemudanca", { preHandler: authenticate }, async (request, reply) => {
    try {
        const deleteMudancaSchema = z.object({
            id: z.number()
        })
        const { id } = deleteMudancaSchema.parse(request.body);
        const delet = await prisma.mudanca.delete({
            where: {
                id
            }
        })
        return reply.status(202).send({ message: "Mudanca Apagada!", mudanca: delet })
    } catch (error) {
        return reply.status(400).send({ message: error });
    }
})

cron.schedule("*/1 * * * *", async () => {
    console.log("Cron rodou!")
})

app.listen({
    host: '0.0.0.0',
    port: process.env.PORT ? Number(process.env.PORT) : 3333,
}).then(() => {
    console.log("Server is Running ••••••••••••••")
})