-- Enable real-time updates for test_reports table
ALTER TABLE test_reports REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE test_reports;