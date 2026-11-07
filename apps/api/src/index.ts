import express from 'express'

const app = express()
const port = 3000
app.use(express.json())

//routes
import { studentsRouter } from './routes/students'
import { booksRouter } from './routes/books'
import { assignmentsRouter } from './routes/assignments'

app.get('/api/health', (req, res) => {
  res.json({ message: 'Express is running' })
})

app.use('/api/students', studentsRouter)
app.use('/api/books', booksRouter)
app.use('/api/assignments', assignmentsRouter)

app.use(
  (error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('API request failed:', error)
    res.status(500).json({ error: 'Could not complete the request. Please try again.' })
  },
)

app.listen(port, () => {
  console.log(`API listening at http://localhost:${port}`)
})
