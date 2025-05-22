import { prisma } from '@/lib/prisma';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod'
import { verifyJwt } from '@/middlewares/verify-jwt'
import { onlyAdmin } from '@/middlewares/verify-role';

enum OrderStatus {
    PENDENTE = 'PENDENTE',
    PREPARANDO = 'PREPARANDO',
    ENTREGUE = 'ENTREGUE',
    CANCELADO = 'CANCELADO'
}

export default async function (app: FastifyInstance) {
    app.post('/create', { preHandler: verifyJwt }, async (req: FastifyRequest, reply: FastifyReply) => {

        const bodySchema = z.object({
            address_id: z.string().uuid(),
            items: z.array(z.object({
                product_id: z.string().uuid(),
                quantity: z.number()
            }))
        })

        const result = bodySchema.safeParse(req.body)

        if (!result.success) {
            return reply.status(400).send({ message: 'Erro ao criar o pedido, verifique os dados informados.' })
        }

        const { address_id, items } = result.data

        try {

            // Busca os produtos no banco com base nos IDs enviados
            const products = await prisma.product.findMany({
                where: {
                    id: {
                        in: items.map(item => item.product_id)
                    }
                }
            })

            // Verifica se todos os produtos foram encontrados
            if (products.length !== items.length) {
                return reply.status(400).send({ message: 'Um ou mais produtos não foram encontrados.' })
            }

            // Cria os itens do pedido com o preço atual do produto
            const orderItems = items.map(item => {
                const product = products.find(p => p.id === item.product_id)

                if (!product) {
                    throw new Error('Product not found')
                }

                return {
                    product_id: item.product_id,
                    quantity: item.quantity,
                    price: product.price
                }
            })

            // Calcula o valor total do pedido somando (preço * quantidade) de cada item
            const total = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

            // Cria o pedido no banco de dados, incluindo os itens em cascata
            const order = await prisma.order.create({
                data: {
                    userId: req.user.sub, // ID do usuário autenticado
                    addressId: address_id,
                    status: OrderStatus.PENDENTE,
                    total,
                    items: {
                        create: orderItems // Cria os registros na tabela de itens vinculados ao pedido
                    }
                },
                include: {
                    address: true,
                }
            })

            return reply.status(201).send(order)
        } catch (err) {
            console.error('Erro ao criar uma nova ordem')
            return reply.status(500).send({ message: 'Erro ao criar uma nova ordem, por favor tente novamente!' });
        }
    })

    app.get('/list', { preHandler: verifyJwt }, async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const orders = await prisma.order.findMany({
                where: {
                    userId: req.user.sub, // só busca pedidos do usuário autenticado

                },
                include: {
                    address: true,
                    items: {
                        include: {
                            product: true // inclui detalhes do produto em cada item do pedido
                        }
                    },
                },
                orderBy: {
                    createdAt: 'desc' // ordena os pedidos pela data de criação, do mais recente para o mais antigo
                }
            })

            return reply.status(200).send(orders)
        } catch (err) {
            console.error('Erro ao listar os pedidos')
            return reply.status(500).send({ message: 'Erro ao listar os pedidos, por favor tente novamente!' })
        }
    })


    app.get('/admin/list-all', { preHandler: [verifyJwt, onlyAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const orders = await prisma.order.findMany({
                include: {
                    // address: true,
                    items: {
                        include: {
                            product: true // inclui detalhes do produto em cada item do pedido
                        }
                    },
                },
                orderBy: {
                    createdAt: 'desc' // ordena os pedidos pela data de criação, do mais recente para o mais antigo
                }
            })

            return reply.status(200).send(orders)
        } catch (err) {
            console.error('Erro ao listar os pedidos')
            return reply.status(500).send({ message: 'Erro ao listar os pedidos, por favor tente novamente!' })
        }
    })

    app.put('/admin/update/:id', { preHandler: [verifyJwt, onlyAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {

        const paramsSchema = z.object({
            id: z.string().uuid()
        })

        const bodySchema = z.object({
            status: z.nativeEnum(OrderStatus)
        })

        const resultParams = paramsSchema.safeParse(req.params)
        const resultBody = bodySchema.safeParse(req.body)

        if (!resultParams.success || !resultBody.success) {
            return reply.status(400).send({ message: 'Erro ao atualizar o pedido, verifique os dados informados.' })
        }

        const { id } = resultParams.data
        const { status } = resultBody.data

        try {
            const order = await prisma.order.update({
                where: { id },
                data: {
                    status,
                }
            })

            return reply.status(200).send(order)
        } catch (err) {
            console.error('Erro ao atualizar o pedido')
            return reply.status(500).send({ message: 'Erro ao atualizar o pedido, por favor tente novamente!' })
        }
    })
}