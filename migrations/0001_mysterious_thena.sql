CREATE TABLE IF NOT EXISTS "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"stt" serial NOT NULL,
	"ma_hang" text NOT NULL,
	"ten_hang" text NOT NULL,
	"ghi_chu" text,
	"nhom_hang" text,
	"viet_tat" text,
	"nguoi_thuc_hien" text NOT NULL,
	"ngay_tao" timestamp DEFAULT now() NOT NULL,
	"ngay_cap_nhat" timestamp DEFAULT now() NOT NULL
);
