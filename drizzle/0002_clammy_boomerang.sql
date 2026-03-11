ALTER TABLE "tickets" RENAME COLUMN "userID" TO "userid";--> statement-breakpoint
ALTER TABLE "tickets" RENAME COLUMN "adminID" TO "adminid";--> statement-breakpoint
ALTER TABLE "tickets" DROP CONSTRAINT "tickets_userID_unique";--> statement-breakpoint
ALTER TABLE "tickets" DROP CONSTRAINT "tickets_userID_student_id_fk";
--> statement-breakpoint
ALTER TABLE "tickets" DROP CONSTRAINT "tickets_adminID_admin_id_fk";
--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_userid_student_id_fk" FOREIGN KEY ("userid") REFERENCES "public"."student"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_adminid_admin_id_fk" FOREIGN KEY ("adminid") REFERENCES "public"."admin"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_userid_unique" UNIQUE("userid");