import { prisma } from '@/lib/prisma'
import { compare } from 'bcryptjs'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import jwt from 'jsonwebtoken'
import { env } from '@/env'


export async function authRoutes(app: FastifyInstance) {
    app.post('/sign-in', async (req: FastifyRequest, reply: FastifyReply) => {
        const bodySchema = z.object({
            email: z.string().email(),
            password: z.string().min(6)
        })

        const result = bodySchema.safeParse(req.body)

        if (!result.success) {
            return reply.status(400).send({ message: 'Erro ao realizar o login, verifique os dados informados.' })
        }

        const { email, password } = result.data

        const user = await prisma.user.findUnique({
            where: {
                email
            }
        })

        if (!user) {
            return reply.status(400).send({ message: 'E-mail ou senha inválidos.' })
        }

        const passwordMatch = await compare(password, user.password)

        if (!passwordMatch) {
            return reply.status(400).send({ message: 'E-mail ou senha inválidos.' })
        }

        const token = jwt.sign({
            sub: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        },
            env.JWT_SECRET || 'default-secret',
            {
                expiresIn: '7d'
            }
        )

        return reply.status(200).send({
            message: 'Login realizado com sucesso!',
            token
        })
    })
}