import fastify from "fastify"
import { env } from "./env"
import { userRoutes } from "./routes/users"

const app = fastify()

app.register(userRoutes, {prefix: 'users'})

app.listen({
    port: env.PORT,
}).then(() => console.log('Server is running on port 3333 🚀🏆'))