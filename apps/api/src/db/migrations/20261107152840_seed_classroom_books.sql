-- Move the bundled classroom library into the database without replacing existing books.
-- Authors inserted first to avoid foreign key constraint violations.
INSERT INTO authors (name)
SELECT seed.name
FROM (VALUES ('E. B. White'), ('Peter Brown'), ('Kate DiCamillo')) AS seed(name)
WHERE NOT EXISTS (SELECT 1 FROM authors WHERE authors.name = seed.name);
--> statement-breakpoint
-- Insert books only if they don't already exist in the database.
INSERT INTO books (title, author_id, total_pages)
SELECT seed.title,
  (SELECT id FROM authors WHERE name = seed.author ORDER BY created_at, id LIMIT 1),
  seed.pages
FROM (VALUES
  ('Charlotte’s Web', 'E. B. White', 192),
  ('The Wild Robot', 'Peter Brown', 288),
  ('Because of Winn-Dixie', 'Kate DiCamillo', 288)
) AS seed(title, author, pages)
WHERE NOT EXISTS (
  SELECT 1 FROM books LEFT JOIN authors ON authors.id = books.author_id
  WHERE books.title = seed.title AND authors.name = seed.author
);
