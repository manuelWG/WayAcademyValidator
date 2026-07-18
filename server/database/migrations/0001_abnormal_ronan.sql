CREATE TYPE "public"."audit_conflict_status" AS ENUM('pending', 'accepted', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."audit_risk_level" AS ENUM('medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."import_batch_status" AS ENUM('pending', 'processing', 'paused', 'completed', 'completed_with_conflicts', 'failed');--> statement-breakpoint
CREATE TYPE "public"."import_changed_field" AS ENUM('certificateCode', 'certificateIssueId', 'certificateId', 'courseId', 'userId', 'participantName', 'documentNumberNormalized', 'courseName', 'issuedAt');--> statement-breakpoint
CREATE TYPE "public"."import_issue_code" AS ENUM('MISSING_FIELD', 'INVALID_NUMBER', 'INVALID_ISSUED_AT', 'DUPLICATE_CERTIFICATE_CODE', 'DUPLICATE_CERTIFICATE_ISSUE_ID', 'COURSE_MISMATCH', 'IDENTITY_COLLISION');--> statement-breakpoint
CREATE TYPE "public"."import_row_status" AS ENUM('new', 'unchanged', 'conflict', 'critical_conflict', 'error');--> statement-breakpoint
CREATE TABLE "audit_conflicts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"import_batch_id" uuid NOT NULL,
	"import_row_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"certificate_id" uuid,
	"collision_by_code_certificate_id" uuid,
	"collision_by_issue_id_certificate_id" uuid,
	"original_file_name" text NOT NULL,
	"file_hash" text NOT NULL,
	"csv_row_number" integer NOT NULL,
	"imported_by_admin_id" uuid NOT NULL,
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"stored_snapshot_data" jsonb,
	"stored_document_lookup_hmac" text,
	"collision_by_code_snapshot_data" jsonb,
	"collision_by_code_document_lookup_hmac" text,
	"collision_by_issue_id_snapshot_data" jsonb,
	"collision_by_issue_id_document_lookup_hmac" text,
	"incoming_data" jsonb NOT NULL,
	"incoming_document_lookup_hmac" text NOT NULL,
	"changed_fields" "import_changed_field"[] DEFAULT '{}' NOT NULL,
	"issue_codes" "import_issue_code"[] DEFAULT '{}' NOT NULL,
	"risk_level" "audit_risk_level" NOT NULL,
	"status" "audit_conflict_status" DEFAULT 'pending' NOT NULL,
	"reviewed_at" timestamp with time zone,
	"reviewed_by_admin_id" uuid,
	"observation" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "audit_conflicts_import_row_unique" UNIQUE("import_row_id"),
	CONSTRAINT "audit_conflicts_csv_row_number_positive" CHECK ("audit_conflicts"."csv_row_number" > 0),
	CONSTRAINT "audit_conflicts_original_file_name_not_empty" CHECK (btrim("audit_conflicts"."original_file_name") <> ''),
	CONSTRAINT "audit_conflicts_file_hash_format" CHECK ("audit_conflicts"."file_hash" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "audit_conflicts_incoming_hmac_format" CHECK ("audit_conflicts"."incoming_document_lookup_hmac" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "audit_conflicts_stored_hmac_format" CHECK ("audit_conflicts"."stored_document_lookup_hmac" IS NULL OR "audit_conflicts"."stored_document_lookup_hmac" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "audit_conflicts_collision_by_code_hmac_format" CHECK ("audit_conflicts"."collision_by_code_document_lookup_hmac" IS NULL OR "audit_conflicts"."collision_by_code_document_lookup_hmac" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "audit_conflicts_collision_by_issue_id_hmac_format" CHECK ("audit_conflicts"."collision_by_issue_id_document_lookup_hmac" IS NULL OR "audit_conflicts"."collision_by_issue_id_document_lookup_hmac" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "audit_conflicts_changed_fields_no_null" CHECK (array_position("audit_conflicts"."changed_fields", NULL) IS NULL),
	CONSTRAINT "audit_conflicts_issue_codes_no_null" CHECK (array_position("audit_conflicts"."issue_codes", NULL) IS NULL),
	CONSTRAINT "audit_conflicts_review_shape" CHECK ((
      "audit_conflicts"."status" = 'pending' AND "audit_conflicts"."reviewed_at" IS NULL AND "audit_conflicts"."reviewed_by_admin_id" IS NULL
    ) OR (
      "audit_conflicts"."status" IN ('accepted', 'rejected')
      AND "audit_conflicts"."reviewed_at" IS NOT NULL
      AND "audit_conflicts"."reviewed_by_admin_id" IS NOT NULL
    )),
	CONSTRAINT "audit_conflicts_shape_check" CHECK ((
      "audit_conflicts"."certificate_id" IS NOT NULL
      AND "audit_conflicts"."stored_snapshot_data" IS NOT NULL
      AND "audit_conflicts"."stored_document_lookup_hmac" IS NOT NULL
      AND "audit_conflicts"."collision_by_code_certificate_id" IS NULL
      AND "audit_conflicts"."collision_by_issue_id_certificate_id" IS NULL
      AND "audit_conflicts"."collision_by_code_snapshot_data" IS NULL
      AND "audit_conflicts"."collision_by_issue_id_snapshot_data" IS NULL
      AND "audit_conflicts"."collision_by_code_document_lookup_hmac" IS NULL
      AND "audit_conflicts"."collision_by_issue_id_document_lookup_hmac" IS NULL
      AND cardinality("audit_conflicts"."changed_fields") > 0
      AND cardinality("audit_conflicts"."issue_codes") = 0
    ) OR (
      "audit_conflicts"."certificate_id" IS NULL
      AND "audit_conflicts"."stored_snapshot_data" IS NULL
      AND "audit_conflicts"."stored_document_lookup_hmac" IS NULL
      AND "audit_conflicts"."collision_by_code_certificate_id" IS NOT NULL
      AND "audit_conflicts"."collision_by_issue_id_certificate_id" IS NOT NULL
      AND "audit_conflicts"."collision_by_code_certificate_id" <> "audit_conflicts"."collision_by_issue_id_certificate_id"
      AND "audit_conflicts"."collision_by_code_snapshot_data" IS NOT NULL
      AND "audit_conflicts"."collision_by_issue_id_snapshot_data" IS NOT NULL
      AND "audit_conflicts"."collision_by_code_document_lookup_hmac" IS NOT NULL
      AND "audit_conflicts"."collision_by_issue_id_document_lookup_hmac" IS NOT NULL
      AND cardinality("audit_conflicts"."changed_fields") = 0
      AND "audit_conflicts"."issue_codes" = ARRAY['IDENTITY_COLLISION']::import_issue_code[]
    ))
);
--> statement-breakpoint
CREATE TABLE "certificates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_import_row_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"certificate_code" text NOT NULL,
	"certificate_code_normalized" text NOT NULL,
	"moodle_certificate_issue_id" bigint NOT NULL,
	"moodle_certificate_id" bigint NOT NULL,
	"moodle_course_id" bigint NOT NULL,
	"moodle_user_id" bigint NOT NULL,
	"course_name" text NOT NULL,
	"participant_name" text NOT NULL,
	"document_ciphertext" "bytea" NOT NULL,
	"document_nonce" "bytea" NOT NULL,
	"document_auth_tag" "bytea" NOT NULL,
	"document_lookup_hmac" text NOT NULL,
	"document_key_version" integer NOT NULL,
	"issued_at" timestamp with time zone NOT NULL,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "certificates_source_import_row_unique" UNIQUE("source_import_row_id"),
	CONSTRAINT "certificates_certificate_code_normalized_unique" UNIQUE("certificate_code_normalized"),
	CONSTRAINT "certificates_moodle_certificate_issue_id_unique" UNIQUE("moodle_certificate_issue_id"),
	CONSTRAINT "certificates_moodle_certificate_issue_id_range" CHECK ("certificates"."moodle_certificate_issue_id" > 0 AND "certificates"."moodle_certificate_issue_id" <= 9007199254740991),
	CONSTRAINT "certificates_moodle_certificate_id_range" CHECK ("certificates"."moodle_certificate_id" > 0 AND "certificates"."moodle_certificate_id" <= 9007199254740991),
	CONSTRAINT "certificates_moodle_course_id_range" CHECK ("certificates"."moodle_course_id" > 0 AND "certificates"."moodle_course_id" <= 9007199254740991),
	CONSTRAINT "certificates_moodle_user_id_range" CHECK ("certificates"."moodle_user_id" > 0 AND "certificates"."moodle_user_id" <= 9007199254740991),
	CONSTRAINT "certificates_certificate_code_normalized_not_empty" CHECK (char_length("certificates"."certificate_code_normalized") > 0),
	CONSTRAINT "certificates_document_nonce_length" CHECK (octet_length("certificates"."document_nonce") = 12),
	CONSTRAINT "certificates_document_auth_tag_length" CHECK (octet_length("certificates"."document_auth_tag") = 16),
	CONSTRAINT "certificates_document_ciphertext_length" CHECK (octet_length("certificates"."document_ciphertext") > 0),
	CONSTRAINT "certificates_document_lookup_hmac_format" CHECK ("certificates"."document_lookup_hmac" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "certificates_document_key_version_range" CHECK ("certificates"."document_key_version" BETWEEN 1 AND 2147483647)
);
--> statement-breakpoint
CREATE TABLE "import_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"created_by_admin_id" uuid NOT NULL,
	"original_file_name" text NOT NULL,
	"file_hash" text NOT NULL,
	"attempt_number" integer DEFAULT 1 NOT NULL,
	"retry_of_batch_id" uuid,
	"retry_authorized_by_admin_id" uuid,
	"retry_authorized_at" timestamp with time zone,
	"retry_reason" text,
	"status" "import_batch_status" DEFAULT 'pending' NOT NULL,
	"total_count" integer DEFAULT 0 NOT NULL,
	"new_count" integer DEFAULT 0 NOT NULL,
	"unchanged_count" integer DEFAULT 0 NOT NULL,
	"conflict_count" integer DEFAULT 0 NOT NULL,
	"critical_conflict_count" integer DEFAULT 0 NOT NULL,
	"error_count" integer DEFAULT 0 NOT NULL,
	"processed_rows" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "import_batches_course_hash_attempt_unique" UNIQUE("course_id","file_hash","attempt_number"),
	CONSTRAINT "import_batches_id_course_hash_unique" UNIQUE("id","course_id","file_hash"),
	CONSTRAINT "import_batches_attempt_number_positive" CHECK ("import_batches"."attempt_number" > 0),
	CONSTRAINT "import_batches_file_hash_format" CHECK ("import_batches"."file_hash" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "import_batches_original_file_name_not_empty" CHECK (btrim("import_batches"."original_file_name") <> ''),
	CONSTRAINT "import_batches_retry_shape" CHECK ((
      "import_batches"."attempt_number" = 1
      AND "import_batches"."retry_of_batch_id" IS NULL
      AND "import_batches"."retry_authorized_by_admin_id" IS NULL
      AND "import_batches"."retry_authorized_at" IS NULL
      AND "import_batches"."retry_reason" IS NULL
    ) OR (
      "import_batches"."attempt_number" > 1
      AND "import_batches"."retry_of_batch_id" IS NOT NULL
      AND "import_batches"."retry_authorized_by_admin_id" IS NOT NULL
      AND "import_batches"."retry_authorized_at" IS NOT NULL
      AND "import_batches"."retry_reason" IS NOT NULL
      AND btrim("import_batches"."retry_reason") <> ''
    )),
	CONSTRAINT "import_batches_counters_non_negative" CHECK (
      "import_batches"."total_count" >= 0
      AND "import_batches"."new_count" >= 0
      AND "import_batches"."unchanged_count" >= 0
      AND "import_batches"."conflict_count" >= 0
      AND "import_batches"."critical_conflict_count" >= 0
      AND "import_batches"."error_count" >= 0
      AND "import_batches"."processed_rows" >= 0
    ),
	CONSTRAINT "import_batches_processed_within_total" CHECK ("import_batches"."processed_rows" <= "import_batches"."total_count"),
	CONSTRAINT "import_batches_processed_sum" CHECK ("import_batches"."processed_rows" = "import_batches"."new_count" + "import_batches"."unchanged_count" + "import_batches"."conflict_count" + "import_batches"."critical_conflict_count" + "import_batches"."error_count"),
	CONSTRAINT "import_batches_status_shape" CHECK ((
      "import_batches"."status" = 'pending'
      AND "import_batches"."started_at" IS NULL
      AND "import_batches"."completed_at" IS NULL
      AND "import_batches"."processed_rows" = 0
      AND "import_batches"."new_count" = 0
      AND "import_batches"."unchanged_count" = 0
      AND "import_batches"."conflict_count" = 0
      AND "import_batches"."critical_conflict_count" = 0
      AND "import_batches"."error_count" = 0
    ) OR (
      "import_batches"."status" = 'processing'
      AND "import_batches"."started_at" IS NOT NULL
      AND "import_batches"."completed_at" IS NULL
      AND "import_batches"."total_count" > 0
    ) OR (
      "import_batches"."status" = 'paused'
      AND "import_batches"."started_at" IS NOT NULL
      AND "import_batches"."completed_at" IS NULL
      AND "import_batches"."total_count" > 0
    ) OR (
      "import_batches"."status" = 'completed'
      AND "import_batches"."started_at" IS NOT NULL
      AND "import_batches"."completed_at" IS NOT NULL
      AND "import_batches"."total_count" > 0
      AND "import_batches"."processed_rows" = "import_batches"."total_count"
      AND "import_batches"."conflict_count" = 0
      AND "import_batches"."critical_conflict_count" = 0
      AND "import_batches"."error_count" = 0
    ) OR (
      "import_batches"."status" = 'completed_with_conflicts'
      AND "import_batches"."started_at" IS NOT NULL
      AND "import_batches"."completed_at" IS NOT NULL
      AND "import_batches"."total_count" > 0
      AND "import_batches"."processed_rows" = "import_batches"."total_count"
      AND ("import_batches"."conflict_count" > 0 OR "import_batches"."critical_conflict_count" > 0 OR "import_batches"."error_count" > 0)
    ) OR (
      "import_batches"."status" = 'failed'
      AND "import_batches"."completed_at" IS NOT NULL
      AND (
        (
          "import_batches"."started_at" IS NULL
          AND "import_batches"."processed_rows" = 0
          AND "import_batches"."new_count" = 0
          AND "import_batches"."unchanged_count" = 0
          AND "import_batches"."conflict_count" = 0
          AND "import_batches"."critical_conflict_count" = 0
          AND "import_batches"."error_count" = 0
        ) OR (
          "import_batches"."started_at" IS NOT NULL
        )
      )
    ))
);
--> statement-breakpoint
CREATE TABLE "import_rows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"row_number" integer NOT NULL,
	"status" "import_row_status",
	"reason" text DEFAULT '' NOT NULL,
	"raw_without_document" jsonb NOT NULL,
	"document_ciphertext" "bytea" NOT NULL,
	"document_nonce" "bytea" NOT NULL,
	"document_auth_tag" "bytea" NOT NULL,
	"document_key_version" integer NOT NULL,
	"document_lookup_hmac" text,
	"incoming_data" jsonb,
	"certificate_code_normalized" text,
	"moodle_certificate_issue_id" bigint,
	"stored_snapshot_data" jsonb,
	"stored_document_lookup_hmac" text,
	"matched_certificate_id" uuid,
	"collision_by_code_certificate_id" uuid,
	"collision_by_issue_id_certificate_id" uuid,
	"changed_fields" "import_changed_field"[] DEFAULT '{}' NOT NULL,
	"issue_codes" "import_issue_code"[] DEFAULT '{}' NOT NULL,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "import_rows_batch_row_number_unique" UNIQUE("batch_id","row_number"),
	CONSTRAINT "import_rows_id_batch_unique" UNIQUE("id","batch_id"),
	CONSTRAINT "import_rows_row_number_positive" CHECK ("import_rows"."row_number" > 0),
	CONSTRAINT "import_rows_document_nonce_length" CHECK (octet_length("import_rows"."document_nonce") = 12),
	CONSTRAINT "import_rows_document_auth_tag_length" CHECK (octet_length("import_rows"."document_auth_tag") = 16),
	CONSTRAINT "import_rows_document_key_version_range" CHECK ("import_rows"."document_key_version" BETWEEN 1 AND 2147483647),
	CONSTRAINT "import_rows_document_lookup_hmac_format" CHECK ("import_rows"."document_lookup_hmac" IS NULL OR "import_rows"."document_lookup_hmac" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "import_rows_stored_document_lookup_hmac_format" CHECK ("import_rows"."stored_document_lookup_hmac" IS NULL OR "import_rows"."stored_document_lookup_hmac" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "import_rows_issue_id_range" CHECK ("import_rows"."moodle_certificate_issue_id" IS NULL OR ("import_rows"."moodle_certificate_issue_id" > 0 AND "import_rows"."moodle_certificate_issue_id" <= 9007199254740991)),
	CONSTRAINT "import_rows_match_references_shape" CHECK ((
      "import_rows"."matched_certificate_id" IS NULL
      AND "import_rows"."collision_by_code_certificate_id" IS NULL
      AND "import_rows"."collision_by_issue_id_certificate_id" IS NULL
    ) OR (
      "import_rows"."matched_certificate_id" IS NOT NULL
      AND "import_rows"."collision_by_code_certificate_id" IS NULL
      AND "import_rows"."collision_by_issue_id_certificate_id" IS NULL
    ) OR (
      "import_rows"."matched_certificate_id" IS NULL
      AND "import_rows"."collision_by_code_certificate_id" IS NOT NULL
      AND "import_rows"."collision_by_issue_id_certificate_id" IS NOT NULL
      AND "import_rows"."collision_by_code_certificate_id" <> "import_rows"."collision_by_issue_id_certificate_id"
    )),
	CONSTRAINT "import_rows_changed_fields_no_null" CHECK (array_position("import_rows"."changed_fields", NULL) IS NULL),
	CONSTRAINT "import_rows_issue_codes_no_null" CHECK (array_position("import_rows"."issue_codes", NULL) IS NULL),
	CONSTRAINT "import_rows_status_processed_at_sync" CHECK (("import_rows"."status" IS NULL AND "import_rows"."processed_at" IS NULL) OR ("import_rows"."status" IS NOT NULL AND "import_rows"."processed_at" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "audit_conflicts" ADD CONSTRAINT "audit_conflicts_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_conflicts" ADD CONSTRAINT "audit_conflicts_certificate_id_certificates_id_fk" FOREIGN KEY ("certificate_id") REFERENCES "public"."certificates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_conflicts" ADD CONSTRAINT "audit_conflicts_collision_by_code_certificate_id_certificates_id_fk" FOREIGN KEY ("collision_by_code_certificate_id") REFERENCES "public"."certificates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_conflicts" ADD CONSTRAINT "audit_conflicts_collision_by_issue_id_certificate_id_certificates_id_fk" FOREIGN KEY ("collision_by_issue_id_certificate_id") REFERENCES "public"."certificates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_conflicts" ADD CONSTRAINT "audit_conflicts_imported_by_admin_id_admin_users_id_fk" FOREIGN KEY ("imported_by_admin_id") REFERENCES "public"."admin_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_conflicts" ADD CONSTRAINT "audit_conflicts_reviewed_by_admin_id_admin_users_id_fk" FOREIGN KEY ("reviewed_by_admin_id") REFERENCES "public"."admin_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_conflicts" ADD CONSTRAINT "audit_conflicts_import_row_fk" FOREIGN KEY ("import_row_id","import_batch_id") REFERENCES "public"."import_rows"("id","batch_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_source_import_row_id_import_rows_id_fk" FOREIGN KEY ("source_import_row_id") REFERENCES "public"."import_rows"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_created_by_admin_id_admin_users_id_fk" FOREIGN KEY ("created_by_admin_id") REFERENCES "public"."admin_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_retry_authorized_by_admin_id_admin_users_id_fk" FOREIGN KEY ("retry_authorized_by_admin_id") REFERENCES "public"."admin_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_retry_parent_fk" FOREIGN KEY ("retry_of_batch_id","course_id","file_hash") REFERENCES "public"."import_batches"("id","course_id","file_hash") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_rows" ADD CONSTRAINT "import_rows_batch_id_import_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."import_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_rows" ADD CONSTRAINT "import_rows_matched_certificate_id_certificates_id_fk" FOREIGN KEY ("matched_certificate_id") REFERENCES "public"."certificates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_rows" ADD CONSTRAINT "import_rows_collision_by_code_certificate_id_certificates_id_fk" FOREIGN KEY ("collision_by_code_certificate_id") REFERENCES "public"."certificates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_rows" ADD CONSTRAINT "import_rows_collision_by_issue_id_certificate_id_certificates_id_fk" FOREIGN KEY ("collision_by_issue_id_certificate_id") REFERENCES "public"."certificates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_conflicts_status_detected_at_idx" ON "audit_conflicts" USING btree ("status","detected_at");--> statement-breakpoint
CREATE INDEX "audit_conflicts_course_status_idx" ON "audit_conflicts" USING btree ("course_id","status");--> statement-breakpoint
CREATE INDEX "audit_conflicts_import_batch_idx" ON "audit_conflicts" USING btree ("import_batch_id");--> statement-breakpoint
CREATE INDEX "certificates_document_lookup_hmac_idx" ON "certificates" USING btree ("document_lookup_hmac");--> statement-breakpoint
CREATE INDEX "certificates_course_id_idx" ON "certificates" USING btree ("course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "import_batches_retry_of_unique" ON "import_batches" USING btree ("retry_of_batch_id") WHERE "import_batches"."retry_of_batch_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "import_batches_one_active_attempt_unique" ON "import_batches" USING btree ("course_id","file_hash") WHERE "import_batches"."status" IN ('pending', 'processing', 'paused');--> statement-breakpoint
CREATE INDEX "import_batches_status_updated_at_idx" ON "import_batches" USING btree ("status","updated_at");--> statement-breakpoint
CREATE INDEX "import_batches_course_created_at_idx" ON "import_batches" USING btree ("course_id","created_at");--> statement-breakpoint
CREATE INDEX "import_batches_course_hash_status_idx" ON "import_batches" USING btree ("course_id","file_hash","status");--> statement-breakpoint
CREATE INDEX "import_rows_batch_status_row_idx" ON "import_rows" USING btree ("batch_id","status","row_number");--> statement-breakpoint
CREATE INDEX "import_rows_batch_code_idx" ON "import_rows" USING btree ("batch_id","certificate_code_normalized");--> statement-breakpoint
CREATE INDEX "import_rows_batch_issue_id_idx" ON "import_rows" USING btree ("batch_id","moodle_certificate_issue_id");