import express from  'express'
import ViteExpress from 'vite-express'

const app = express()


app.use( express.json() )


ViteExpress.listen( app, 3000 )