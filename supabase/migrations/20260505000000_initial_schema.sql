-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  icon TEXT DEFAULT 'folder',
  archived BOOLEAN DEFAULT FALSE,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo',
  priority TEXT DEFAULT 'medium',
  due_date DATE,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  position INTEGER DEFAULT 0,
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Subtasks table
CREATE TABLE subtasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Files table
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  storage_bucket TEXT DEFAULT 'task-attachments',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Links table
CREATE TABLE links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Activity log table
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  changes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User settings table
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'dark',
  language TEXT DEFAULT 'en',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  notifications_email BOOLEAN DEFAULT TRUE,
  notifications_in_app BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_archived ON projects(archived);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_subtasks_task_id ON subtasks(task_id);
CREATE INDEX idx_subtasks_user_id ON subtasks(user_id);
CREATE INDEX idx_files_task_id ON files(task_id);
CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_links_task_id ON links(task_id);
CREATE INDEX idx_links_user_id ON links(user_id);
CREATE INDEX idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX idx_activity_log_project_id ON activity_log(project_id);
CREATE INDEX idx_activity_log_task_id ON activity_log(task_id);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE links ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Projects RLS policies
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- Tasks RLS policies
CREATE POLICY "Users can view tasks in their projects"
  ON tasks FOR SELECT
  USING (
    auth.uid() = user_id OR
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create tasks in their projects"
  ON tasks FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update tasks in their projects"
  ON tasks FOR UPDATE
  USING (
    auth.uid() = user_id OR
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete tasks in their projects"
  ON tasks FOR DELETE
  USING (
    auth.uid() = user_id OR
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- Subtasks RLS policies
CREATE POLICY "Users can view subtasks they created"
  ON subtasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create subtasks"
  ON subtasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their subtasks"
  ON subtasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their subtasks"
  ON subtasks FOR DELETE
  USING (auth.uid() = user_id);

-- Files RLS policies
CREATE POLICY "Users can view files they uploaded"
  ON files FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upload files"
  ON files FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their files"
  ON files FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their files"
  ON files FOR DELETE
  USING (auth.uid() = user_id);

-- Links RLS policies
CREATE POLICY "Users can view links they created"
  ON links FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create links"
  ON links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their links"
  ON links FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their links"
  ON links FOR DELETE
  USING (auth.uid() = user_id);

-- Activity log RLS policies
CREATE POLICY "Users can view their activity"
  ON activity_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create activity logs"
  ON activity_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User settings RLS policies
CREATE POLICY "Users can view their own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
  VALUES ('task-attachments', 'task-attachments', FALSE)
  ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload their own files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'task-attachments' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'task-attachments' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'task-attachments' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'task-attachments' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
