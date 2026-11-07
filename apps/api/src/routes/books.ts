import { Router } from 'express'
import { eq, sql } from 'drizzle-orm'
import { db } from '../db/index'
import { authors, books } from '../db/schema'

export const booksRouter = Router()

// Keep the author lookup/creation and book write in a single atomic statement.
booksRouter.post('/', saveBook)
booksRouter.patch('/:id', saveBook)

async function saveBook(req: import('express').Request, res: import('express').Response) {
  const id = req.params.id
  if (
    id &&
    (typeof id !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
  ) {
    res.status(400).json({ error: 'Invalid book ID.' })
    return
  }
  const { title, author, totalPages } = req.body ?? {}
  if (typeof title !== 'string' || !title.trim() || typeof author !== 'string' || !author.trim()) {
    res.status(400).json({ error: 'Title and author are required.' })
    return
  }
  if (
    totalPages != null &&
    (typeof totalPages !== 'number' ||
      !Number.isInteger(totalPages) ||
      totalPages < 1 ||
      totalPages > 2147483647)
  ) {
    res.status(400).json({ error: 'Total pages must be a positive whole number.' })
    return
  }
  try {
    const target = id ? sql`SELECT id FROM books WHERE id = ${id}::uuid` : sql`SELECT 1`
    const write = id
      ? sql`UPDATE books SET title = ${title.trim()}, author_id = (SELECT id FROM chosen_author), total_pages = ${totalPages ?? null} WHERE id = ${id}::uuid RETURNING *`
      : sql`INSERT INTO books (title, author_id, total_pages) VALUES (${title.trim()}, (SELECT id FROM chosen_author), ${totalPages ?? null}) RETURNING *`
    const result = await db.execute(sql`
      WITH target AS (${target}),
      existing_author AS (SELECT id FROM authors WHERE name = ${author.trim()} LIMIT 1),
      new_author AS (
        INSERT INTO authors (name) SELECT ${author.trim()}
        WHERE NOT EXISTS (SELECT 1 FROM existing_author) AND EXISTS (SELECT 1 FROM target)
        RETURNING id
      ),
      chosen_author AS (SELECT id FROM existing_author UNION ALL SELECT id FROM new_author),
      saved AS (${write})
      SELECT id, title, ${author.trim()}::text AS author, total_pages AS "totalPages", created_at AS "createdAt" FROM saved
    `)
    const book = result.rows[0]
    if (!book) {
      res.status(404).json({ error: 'Book not found.' })
      return
    }
    res.status(id ? 200 : 201).json(book)
  } catch {
    res.status(500).json({ error: 'Could not save the book. Please try again.' })
  }
}

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
