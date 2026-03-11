CREATE TABLE "admin" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "descriptions" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"header" varchar(100) NOT NULL,
	"description" varchar(100) NOT NULL,
	"footer" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"college" varchar(100) NOT NULL,
	"stream" varchar(100) NOT NULL,
	"year" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"title" varchar(100) NOT NULL,
	"userID" varchar(100),
	"adminID" varchar(100),
	"isValid" boolean,
	"createdAt" varchar(100) NOT NULL,
	CONSTRAINT "tickets_userID_unique" UNIQUE("userID")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar NOT NULL,
	"password" varchar(100) NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "admin" ADD CONSTRAINT "admin_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "descriptions" ADD CONSTRAINT "descriptions_id_tickets_id_fk" FOREIGN KEY ("id") REFERENCES "public"."tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student" ADD CONSTRAINT "student_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_userID_student_id_fk" FOREIGN KEY ("userID") REFERENCES "public"."student"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_adminID_admin_id_fk" FOREIGN KEY ("adminID") REFERENCES "public"."admin"("id") ON DELETE no action ON UPDATE no action;