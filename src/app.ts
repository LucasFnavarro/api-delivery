import { env } from './env'
import path from 'path'
import autoload from '@fastify/autoload'
import { app } from './server'

const API_ACTIVE = true

app.get('/ping', () => {
    if (!API_ACTIVE) {
        return "API INATIVA - TENTE NOVA MAIS TARDE"
    }

    return "pong"
})

app.register(autoload, {
    dir: path.join(__dirname, 'routes'),
    routeParams: true,
    // ignorePattern: /(controllers|schemas|utils)/,
})

app.listen({
    host: '0.0.0.0',
    port: env.PORT,
}).then(() => console.log(`Server is running on http://localhost:${env.PORT} 🚀🏆`))
