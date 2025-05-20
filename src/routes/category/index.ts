import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyJwt } from "@/middlewares/verify-jwt";
import { onlyAdmin } from "@/middlewares/verify-role";

export async function categoryRoutes(app: FastifyInstance) {
    app.post('/create', async (req: FastifyRequest, reply: FastifyReply) => {
        const bodySchema = z.object({
            name: z.string(),
        })

        const result = bodySchema.safeParse(req.body)

        if (!result.success) {
            return reply.status(400).send({ message: 'Erro ao criar a categoria, verifique os dados informados.' })
        }

        const { name } = result.data

        const verifyIfCategoryExists = await prisma.category.findUnique({
            where: {
                name
            }
        })

        if (verifyIfCategoryExists) {
            console.log('Erro ao criar a categoria, categoria já existe.')
            return reply.status(400).send({ message: 'Erro ao criar a categoria, categoria já existe.' })
        }

        try {
            const category = await prisma.category.create({
                data: {
                    name
                }
            })

            return reply.status(201).send({ message: 'Categoria criada com sucesso', category })
        } catch (err) {
            console.log('Erro ao criar uma categoria')
            return reply.status(500).send({ message: 'Erro ao criar uma categoria' })
        }
    })

    app.get('/list', {
        preHandler: [verifyJwt, onlyAdmin]
    }, async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const categories = await prisma.category.findMany({
                select: {
                    id: true,
                    name: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            })

            return reply.status(200).send({ categories })
        } catch (err) {
            console.log('Erro ao listar as categorias')
            return reply.status(500).send({ message: 'Erro ao listar as categorias' })
        }
    })

    app.get('/get/:id', async (req: FastifyRequest, reply: FastifyReply) => {
        const bodySchema = z.object({
            id: z.string().uuid()
        })

        const result = bodySchema.safeParse(req.params)

        if (!result.success) {
            return reply.status(400).send({ message: 'Erro ao buscar a categoria, verifique os dados informados.' })
        }

        const { id } = result.data

        try {
            const category = await prisma.category.findUnique({
                where: {
                    id
                }
            })

            return reply.status(200).send({ category })
        } catch (err) {
            console.log('Erro ao buscar uma categoria')
            return reply.status(500).send({ message: 'Erro ao buscar uma categoria' })
        }
    })
}