ALTER TABLE "books" ADD COLUMN "owner_user_id" uuid;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "owner_user_id" uuid;--> statement-breakpoint
-- Preserve the existing dataset under an internal owner with no Clerk login.
INSERT INTO "users" ("auth_provider", "auth_subject_id")
VALUES ('demo', 'public-demo')
ON CONFLICT ("auth_provider", "auth_subject_id") DO NOTHING;--> statement-breakpoint
UPDATE "books"
SET "owner_user_id" = (
  SELECT "id" FROM "users"
  WHERE "auth_provider" = 'demo' AND "auth_subject_id" = 'public-demo'
)
WHERE "owner_user_id" IS NULL;--> statement-breakpoint
UPDATE "students"
SET "owner_user_id" = (
  SELECT "id" FROM "users"
  WHERE "auth_provider" = 'demo' AND "auth_subject_id" = 'public-demo'
)
WHERE "owner_user_id" IS NULL;--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "books_owner_user_id_idx" ON "books" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "students_owner_user_id_idx" ON "students" USING btree ("owner_user_id");
