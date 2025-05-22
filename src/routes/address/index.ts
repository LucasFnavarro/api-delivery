import { z } from 'zod'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from '@/lib/prisma'
import { verifyJwt } from '@/middlewares/verify-jwt'
import { onlyAdmin } from '@/middlewares/verify-role'

const addressSchema = z.object({
    street: z.string(),
    number: z.string(),
    city: z.string(),
    state: z.string().length(2, 'UF inválida'),
    zipCode: z.string().regex(/^\d{5}-\d{3}$/, 'CEP inválido'),
})

const idParamsSchema = z.object({
    id: z.string().uuid('O id informado não é um uuid válido')
})

export default async function (app: FastifyInstance) {
    app.post('/address', { preHandler: verifyJwt }, async (req: FastifyRequest, reply: FastifyReply) => {

        const result = addressSchema.safeParse(req.body)

        if (!result.success) {
            return reply.status(400).send({ message: 'Erro ao salvar o endereço, verifique os dados informados.' })
        }

        const { street, number, city, state, zipCode } = result.data

        try {
            const address = await prisma.address.create({
                data: {
                    user_id: req.user.sub,
                    street,
                    number,
                    city,
                    state,
                    zipCode
                }
            })

            return reply.status(201).send({ message: 'Endereço criado com sucesso', address })
        } catch (err) {
            console.error('Erro ao criar um novo endereço')
            return reply.status(500).send({ message: 'Erro ao criar um novo endereço' })
        }
    })

    app.get('/admin/address', {
        preHandler: [verifyJwt, onlyAdmin]
    }, async (req: FastifyRequest, reply: FastifyReply) => {

        try {
            const address = await prisma.address.findMany({
                include: {
                    user: {
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

            return reply.status(200).send({ address })
        } catch (err) {
            console.error('Erro ao listar endereços')
            return reply.status(500).send({ message: 'Erro ao listar endereços' })
        }
    })

    app.get('/address', {
        preHandler: [verifyJwt, onlyAdmin]
    }, async (req: FastifyRequest, reply: FastifyReply) => {

        try {
            const address = await prisma.address.findMany({
                where: {
                    user_id: req.user.sub
                },
                include: {
                    user: {
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

            return reply.status(200).send({ address })
        } catch (err) {
            console.error('Erro ao listar endereços')
            return reply.status(500).send({ message: 'Erro ao listar endereços' })
        }
    })

    app.get('/address/:id', { preHandler: verifyJwt }, async (req: FastifyRequest, reply: FastifyReply) => {

        const result = idParamsSchema.safeParse(req.params)

        if (!result.success) {
            return reply.status(400).send({ message: 'Erro ao buscar o endereço, verifique os dados informados.' })
        }

        const { id } = result.data

        try {
            const address = await prisma.address.findUnique({
                where: {
                    id
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                        }
                    }
                }
            })
            return reply.status(200).send({ address })
        } catch (err) {
            console.error('Erro ao buscar um endereço')
            return reply.status(500).send({ message: 'Erro ao buscar o endereço' })
        }
    })

    app.put('/address/:id', { preHandler: verifyJwt }, async (req: FastifyRequest, reply: FastifyReply) => {
        const resultBody = addressSchema.safeParse(req.body)
        const resultParams = idParamsSchema.safeParse(req.params)

        if (!resultBody.success || !resultParams.success) {
            return reply.status(400).send({ message: 'Erro ao editar um produto, verifique os dados informados.' })
        }

        const { id } = resultParams.data
        const { street, number, city, state, zipCode } = resultBody.data

        try {
            const address = await prisma.address.update({
                where: { id },
                data: {
                    street,
                    number,
                    city,
                    state,
                    zipCode
                }
            })

            return reply.status(200).send({ message: 'Endereço atualizado com sucesso', address })
        } catch (err) {
            console.error('Erro ao atualizar o endereço')
            return reply.status(500).send({ message: 'Erro ao atualizar um endereço' })
        }
    })

    app.delete('/address/:id', { preHandler: verifyJwt }, async (req: FastifyRequest, reply: FastifyReply) => {

        const result = idParamsSchema.safeParse(req.params)

        if (!result.success) {
            return reply.status(400).send({ message: 'Erro ao excluir o endereço' })
        }

        const { id } = result.data

        try {
            await prisma.address.delete({
                where: { id }
            })

            return reply.status(200).send({ message: 'Endereço deletado com sucesso' })
        } catch (err) {
            console.error('Erro ao deletar um endereço')
            return reply.status(500).send({ message: 'Erro ao deletar um endereço' })
        }
    })
}
