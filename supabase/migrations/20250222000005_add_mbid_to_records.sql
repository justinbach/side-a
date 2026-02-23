ALTER TABLE records ADD COLUMN mbid TEXT;
CREATE INDEX records_mbid_idx ON records(mbid);
