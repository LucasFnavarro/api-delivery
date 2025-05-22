import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyJwt } from "@/middlewares/verify-jwt";
import { onlyAdmin } from "@/middlewares/verify-role";

const idParamsSchema = z.object({
    id: z.string().uuid('ID inválido!')
})

const categorySchema = z.object({
    name: z.string()
})

export default async function (app: FastifyInstance) {
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

    app.get('/list', { preHandler: [verifyJwt, onlyAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
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

    app.get('/get/:id', { preHandler: verifyJwt }, async (req: FastifyRequest, reply: FastifyReply) => {
        const result = idParamsSchema.safeParse(req.params)

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

    app.put('/update/:id', { preHandler: verifyJwt }, async (req: FastifyRequest, reply: FastifyReply) => {

        const result = idParamsSchema.safeParse(req.params)
        const resultBody = categorySchema.safeParse(req.body)

        if (!result.success || !resultBody.success) {
            return reply.status(400).send({ message: 'Erro ao atualizar a categoria, verifique os dados informados.' })
        }

        const { id } = result.data
        const { name } = resultBody.data

        try {
            const category = await prisma.category.update({
                where: { id },
                data: {
                    name
                }
            })

            return reply.status(200).send({ message: 'Categoria atualizada com sucesso', category })
        } catch (err) {
            console.log('Erro ao atualizar uma categoria')
            return reply.status(500).send({ message: 'Erro ao atualizar uma categoria' })
        }
    })

    app.delete('/delete/:id', { preHandler: verifyJwt }, async (req: FastifyRequest, reply: FastifyReply) => {
        const result = idParamsSchema.safeParse(req.params)

        if (!result.success) {
            return reply.status(400).send({ message: 'Erro ao deletar a categoria, verifique os dados informados.' })
        }

        const { id } = result.data

        try {
            await prisma.category.delete({
                where: { id }
            })

            return reply.status(200).send({ message: 'Categoria deletada com sucesso' })
        } catch (err) {
            console.log('Erro ao deletar uma categoria')
            return reply.status(500).send({ message: 'Erro ao deletar uma categoria' })
        }
    })
}