-- Seed the former demo students without replacing any existing roster data.
INSERT INTO students (name, year)
SELECT seed.name, seed.year
FROM (VALUES ('Ava Thompson', 7), ('Marcus Lee', 8), ('Sofia Rivera', 2)) AS seed(name, year)
WHERE NOT EXISTS (SELECT 1 FROM students WHERE students.name = seed.name AND students.year = seed.year);
--> statement-breakpoint
-- Resolve actual UUIDs rather than relying on the old browser-only IDs.
-- Existing assignments keep their current progress.
WITH seed(student_name, student_year, book_title, author_name, page, status) AS (
  VALUES
    ('Ava Thompson', 7, 'Charlotte’s Web', 'E. B. White', 96, 'reading'),
    ('Marcus Lee', 8, 'The Wild Robot', 'Peter Brown', 288, 'finished'),
    ('Sofia Rivera', 2, 'Because of Winn-Dixie', 'Kate DiCamillo', 24, 'reading')
), resolved AS (
  SELECT
    (SELECT id FROM students WHERE name = seed.student_name AND year = seed.student_year ORDER BY created_at, id LIMIT 1) AS student_id,
    (SELECT books.id FROM books JOIN authors ON books.author_id = authors.id
      WHERE books.title = seed.book_title AND authors.name = seed.author_name
      ORDER BY books.created_at, books.id LIMIT 1) AS book_id,
    seed.page, seed.status
  FROM seed
)
INSERT INTO reading_assignments (student_id, book_id, current_page, status)
SELECT resolved.student_id, resolved.book_id,
  CASE WHEN resolved.status = 'finished' THEN COALESCE(books.total_pages, resolved.page)
       ELSE LEAST(resolved.page, COALESCE(books.total_pages, resolved.page)) END,
  resolved.status::reading_status
FROM resolved JOIN books ON books.id = resolved.book_id
WHERE resolved.student_id IS NOT NULL
ON CONFLICT (student_id, book_id) DO NOTHING;
