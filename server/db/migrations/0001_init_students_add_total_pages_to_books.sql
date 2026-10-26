CREATE TABLE "students" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"year" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "total_pages" integer;