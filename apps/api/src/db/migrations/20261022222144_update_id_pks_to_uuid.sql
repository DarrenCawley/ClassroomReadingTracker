-- Intentionally discard development records while replacing integer IDs with UUIDs.
DROP TABLE "reading_assignments";
--> statement-breakpoint
DROP TABLE "books";
--> statement-breakpoint
DROP TABLE "authors";
--> statement-breakpoint
DROP TABLE "students";
--> statement-breakpoint
CREATE TABLE "authors" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "bio" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "students" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "year" integer,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "books" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" text NOT NULL,
  "total_pages" integer,
  "author_id" uuid,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "books_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE no action ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE "reading_assignments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "student_id" uuid NOT NULL,
  "book_id" uuid NOT NULL,
  "current_page" integer DEFAULT 0 NOT NULL,
  "status" "public"."reading_status" DEFAULT 'not_started' NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "reading_assignments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "reading_assignments_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE no action ON UPDATE no action
);
