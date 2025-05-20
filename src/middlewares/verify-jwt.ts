import { FastifyReply, FastifyRequest } from "fastify";
import jwt from 'jsonwebtoken'
import { env } from "@/env";

interface JwtPayload {
    sub: string
    name?: string
    email?: string
    role: 'ADMIN' | 'USER'
}

export async function verifyJwt(request: FastifyRequest, reply: FastifyReply) {

    const authHeader = request.headers.authorization

    if (!authHeader) {
        return reply.status(401).send({ message: 'Não autorizado.' })
    }

    const [, token] = authHeader.split(' ')

    try {
        const decoded = jwt.verify(token, env.JWT_SECRET || 'default-secret') as JwtPayload

        request.user = {
            sub: decoded.sub,
            name: decoded.name || '',
            email: decoded.email || '',
            role: decoded.role || 'USER'
        }

    } catch {
        return reply.status(401).send({ message: 'Não autorizado.' })
    }
}