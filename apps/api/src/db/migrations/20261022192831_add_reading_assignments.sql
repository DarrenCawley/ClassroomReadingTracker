CREATE TYPE "public"."reading_status" AS ENUM('not_started', 'reading', 'finished');--> statement-breakpoint
CREATE TABLE "reading_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"book_id" integer NOT NULL,
	"current_page" integer DEFAULT 0 NOT NULL,
	"status" "reading_status" DEFAULT 'not_started' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reading_assignments" ADD CONSTRAINT "reading_assignments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_assignments" ADD CONSTRAINT "reading_assignments_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE no action ON UPDATE no action;