import { FastifyReply, FastifyRequest } from "fastify";

export async function onlyAdmin(req: FastifyRequest, reply: FastifyReply) {

    const role = req.user?.role?.toUpperCase()

    if (req.user.role !== 'ADMIN') {
        return reply.status(401).send({ message: 'Não autorizado.' })
    }
}