import { env } from './env'
import { addressRoutes } from './routes/address'
import { authRoutes } from './routes/auth'
import { categoryRoutes } from './routes/category'
import { productRoutes } from './routes/products'
import { userRoutes } from './routes/users'
import { app } from './server'


app.get('/ping', () => {
    return 'pong'
})


// Auth Routes
app.register(authRoutes, { prefix: 'auth' })

// User Routes
app.register(userRoutes, { prefix: 'users' })

// Product Routes
app.register(productRoutes, { prefix: 'products' })

// Category Routes
app.register(categoryRoutes, { prefix: 'category' })

// Address Routes
app.register(addressRoutes, { prefix: 'address' })

app.listen({
    host: '0.0.0.0',
    port: env.PORT,
}).then(() => console.log('Server is running on port 3333 🚀🏆'))