import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'

const userSchema = z.object({
    name: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(6)
})

export async function userRoutes(app: FastifyInstance) {
    app.post('/create', async (req: FastifyRequest, reply: FastifyReply) => {
        const result = userSchema.safeParse(req.body)

        if (!result.success) {
            return reply.status(400).send({ message: 'Erro ao criar um usuário' })
        }

        const { name, email, password } = result.data

        const verifyIfUserExists = await prisma.user.findUnique({
            where: {
                email
            }
        })

        if (verifyIfUserExists) {
            return reply.status(400).send({ message: 'O email que você está tentando cadastrar já existe.' })
        }

        const passwordHash = await hash(password, 10)

        try {
            await prisma.user.create({
                data: {
                    name,
                    email,
                    password: passwordHash
                }
            })

            return reply.status(201).send({ message: 'Usuário cadastrado com sucesso.' })
        } catch (error) {
            console.log('Erro ao criar um usuário', error)
            return reply.status(500).send({ message: 'Erro ao criar um usuário' })
        }

    })

    app.get('/list', async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const data = await prisma.user.findMany({
                select: {
                    id: true,
                    name: true,
                    email: true,
                    createdAt: true,
                },
                orderBy: {
                    createdAt: 'desc'
                }
            })

            return reply.status(200).send({ data })

        } catch (error) {
            console.log('Erro ao listar os usuários', error)
            return reply.status(500).send({ message: 'Erro ao listar os usuários' })
        }

    })

    app.get('/get/:id', async (req: FastifyRequest, reply: FastifyReply) => {
        const paramsSchema = z.object({
            id: z.string().uuid('O id informado não é um uuid válido')
        })

        const result = paramsSchema.safeParse(req.params)

        if (!result.success) {
            console.log('Erro ao buscar o usuário', result.error)
            return reply.status(400).send({ message: 'Erro ao buscar o usuário' })
        }

        try {

            const data = await prisma.user.findUnique({
                where: {
                    id: result.data.id
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    createdAt: true,
                    updatedAt: true,
                }
            })

            if (!data) {
                return reply.status(404).send({ message: 'Usuário não encontrado' })
            }

            return reply.status(200).send({ data })

        } catch (error) {
            console.log('Erro ao buscar o usuário', error)
            return reply.status(500).send({ message: 'Erro ao buscar o usuário' })
        }
    })

    app.put('/update/:id', async (req: FastifyRequest, reply: FastifyReply) => {
        const paramsSchema = z.object({
            id: z.string().uuid('O id informado não é um uuid válido')
        })


        const resultParams = paramsSchema.safeParse(req.params)
        const resultBody = userSchema.safeParse(req.body)

        if (!resultParams.success || !resultBody.success) {
            console.log('Erro ao tentar atualizar o usuário', resultParams.error, resultBody.error)
            return reply.status(400).send({ message: 'Erro ao tentar atualizar o usuário, tente novamente!' })
        }


        const { id } = resultParams.data
        const { name, email, password } = resultBody.data

        const passwordHash = password ? await hash(password, 10) : undefined

        try {
            await prisma.user.update({
                where: { id },
                data: {
                    name,
                    email,
                    password: passwordHash
                }
            })
            return reply.status(200).send({ message: 'Usuário atualizado com sucesso!' })
        } catch (error) {
            console.log('Erro ao tentar atualizar o usuário', error)
            return reply.status(500).send({ message: 'Erro ao tentar atualizar o usuário, tente novamente!' })
        }
    })

    app.delete('/delete/:id', async (req: FastifyRequest, reply: FastifyReply) => {
        const paramsSchema = z.object({
            id: z.string().uuid('O id informado não é um uuid válido')
        })

        const result = paramsSchema.safeParse(req.params)

        if (!result.success) {
            console.log('Erro ao tentar deletar o usuário', result.error)
            return reply.status(400).send({ message: 'Erro ao tentar deletar o usuário, tente novamente!' })
        }

        try {
            await prisma.user.delete({
                where: {
                    id: result.data.id
                }
            })

            return reply.status(200).send({ message: 'Usuário deletado com sucesso' })
        } catch (error) {
            console.log('Erro ao tentar deletar o usuário', error)
            return reply.status(500).send({ message: 'Erro ao tentar deletar o usuário, tente novamente!' })
        }
    })

}

