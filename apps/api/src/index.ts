import express from 'express'

const app = express()
const port = 3000
app.use(express.json())

//routes
import { studentsRouter } from './routes/students'
import { booksRouter } from './routes/books'

app.get('/api/health', (req, res) => {
  res.json({ message: 'Express is running' })
})

app.use('/api/students', studentsRouter)
app.use('/api/books', booksRouter)

app.listen(port, () => {
  console.log(`API listening at http://localhost:${port}`)
})
