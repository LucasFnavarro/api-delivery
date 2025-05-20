import { FastifyRequest } from 'fastify'

declare module 'fastify' {
    interface FastifyRequest {
        user: {
            sub: string
            name?: string
            email?: string
            role?: 'ADMIN' | 'USER'
        }
    }
} 