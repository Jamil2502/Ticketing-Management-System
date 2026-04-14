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
CREATE TABLE "event_members" (
	"userid" varchar(100) NOT NULL,
	"eventid" varchar(100) NOT NULL,
	"role" varchar(20) NOT NULL,
	"joined_at" varchar(100) NOT NULL,
	CONSTRAINT "event_members_userid_eventid_pk" PRIMARY KEY("userid","eventid")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" varchar(255),
	"date" varchar(100),
	"status" varchar(20) NOT NULL,
	"created_by" varchar(100) NOT NULL,
	"created_at" varchar(100) NOT NULL
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
	"userid" varchar(100) NOT NULL,
	"eventid" varchar(100) NOT NULL,
	"adminid" varchar(100),
	"scanned_by" varchar(100),
	"isvalid" boolean,
	"createdat" varchar(100) NOT NULL,
	"scanned_at" varchar(100),
	CONSTRAINT "tickets_userid_eventid_unique" UNIQUE("userid","eventid")
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
ALTER TABLE "event_members" ADD CONSTRAINT "event_members_userid_users_id_fk" FOREIGN KEY ("userid") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_members" ADD CONSTRAINT "event_members_eventid_events_id_fk" FOREIGN KEY ("eventid") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student" ADD CONSTRAINT "student_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_userid_student_id_fk" FOREIGN KEY ("userid") REFERENCES "public"."student"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_eventid_events_id_fk" FOREIGN KEY ("eventid") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_adminid_admin_id_fk" FOREIGN KEY ("adminid") REFERENCES "public"."admin"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_scanned_by_users_id_fk" FOREIGN KEY ("scanned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;