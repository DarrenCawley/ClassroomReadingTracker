import { Router } from 'express'
import { eq } from 'drizzle-orm'
import { db } from '../db/index'
import { authors, books } from '../db/schema'

export const booksRouter = Router()

booksRouter.get('/', async (req, res) => {
  const results = await db
    .select({
      id: books.id,
      title: books.title,
      author: authors.name,
      totalPages: books.totalPages,
      createdAt: books.createdAt,
    })
    .from(books)
    .leftJoin(authors, eq(books.authorId, authors.id))
    .orderBy(books.title)

  res.json(
    results.map((book) => ({
      ...book,
      author: book.author ?? 'Unknown author',
      totalPages: book.totalPages ?? undefined,
    })),
  )
})
