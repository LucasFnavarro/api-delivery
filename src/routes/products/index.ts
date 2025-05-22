import { z } from 'zod'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from '@/lib/prisma'
import { verifyJwt } from '@/middlewares/verify-jwt'

const productSchema = z.object({
    name: z.string(),
    description: z.string(),
    price: z.number(),
    imageUrl: z.string().optional(),
    category_id: z.string()
})

const idParamsSchema = z.object({
    id: z.string().uuid()
})

export default async function (app: FastifyInstance) {
    app.post('/products', { preHandler: verifyJwt }, async (req: FastifyRequest, reply: FastifyReply) => {
        
        const result = productSchema.safeParse(req.body)

        if (!result.success) {
            return reply.status(400).send({ message: 'Erro ao criar o produto, verifique os dados informados.' })
        }

        const { name, description, price, imageUrl, category_id } = result.data

        const verifyIfProductExists = await prisma.product.findFirst({
            where: {
                name,
            }
        })

        if (verifyIfProductExists) {
            return reply.status(400).send({ message: 'Produto já existe' })
        }

        try {
            const product = await prisma.product.create({
                data: {
                    name,
                    description,
                    price,
                    imageUrl,
                    category_id
                }
            })

            return reply.status(201).send({ message: 'Produto criado com sucesso', product })

        } catch (err) {
            console.log('Erro ao criar um produto')
            return reply.status(500).send({ message: 'Erro ao criar um produto' })
        }
    })

    app.get('/products', { preHandler: verifyJwt }, async (req: FastifyRequest, reply: FastifyReply) => {
        
        try {
            const products = await prisma.product.findMany({
                include: {
                    category: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc'
                }
            })

            return reply.status(200).send({ products })
        } catch (err) {
            console.log('Erro ao listar produtos')
            return reply.status(500).send({ message: 'Erro ao listar produtos' })
        }
    })

    app.get('/products/:id', async (req: FastifyRequest, reply: FastifyReply) => {
        
        const result = idParamsSchema.safeParse(req.params)

        if (!result.success) {
            return reply.status(400).send({ message: 'Erro ao buscar o produto, verifique os dados informados.' })
        }

        const { id } = result.data

        try {
            const product = await prisma.product.findUnique({
                where: {
                    id
                },
                include: {
                    category: {
                        select: {
                            id: true,
                            name: true,
                        }
                    }
                }
            })
            return reply.status(200).send({ product })
        } catch (err) {
            console.log('Erro ao buscar um produto')
            return reply.status(500).send({ message: 'Erro ao buscar um produto' })
        }
    })

    app.put('/products/:id', { preHandler: verifyJwt }, async (req: FastifyRequest, reply: FastifyReply) => {
        
        const resultBody = productSchema.safeParse(req.body)
        const resultParams = idParamsSchema.safeParse(req.params)

        if (!resultBody.success || !resultParams.success) {
            return reply.status(400).send({ message: 'Erro ao editar um produto, verifique os dados informados.' })
        }

        const { id } = resultParams.data
        const { name, description, price, imageUrl, category_id } = resultBody.data

        try {
            const product = await prisma.product.update({
                where: { id },
                data: {
                    name,
                    description,
                    price,
                    imageUrl,
                    category_id
                }
            })

            return reply.status(200).send({ message: 'Produto atualizado com sucesso', product })
        } catch (err) {
            console.log('Erro ao atualizar um produto')
            return reply.status(500).send({ message: 'Erro ao atualizar um produto' })
        }
    })

    app.delete('/products/:id', { preHandler: verifyJwt }, async (req: FastifyRequest, reply: FastifyReply) => {
        
        const result = idParamsSchema.safeParse(req.params)

        if (!result.success) {
            return reply.status(400).send({ message: 'Erro ao deletar um produto, verifique os dados informados.' })
        }

        const { id } = result.data

        try {
            await prisma.product.delete({
                where: { id }
            })

            return reply.status(200).send({ message: 'Produto deletado com sucesso' })
        } catch (err) {
            console.log('Erro ao deletar um produto')
            return reply.status(500).send({ message: 'Erro ao deletar um produto' })
        }
    })
}
