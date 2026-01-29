-- Add metadata columns to picture table
ALTER TABLE picture
ADD COLUMN content_type VARCHAR(50),
ADD COLUMN filename VARCHAR(255),
ADD COLUMN uploaded_at TIMESTAMP,
ADD COLUMN size BIGINT;
