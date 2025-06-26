-- Create stories table
CREATE TABLE IF NOT EXISTS stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seed TEXT NOT NULL,
  title TEXT,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create story_nodes table
CREATE TABLE IF NOT EXISTS story_nodes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  node_index INTEGER NOT NULL,
  story_text TEXT NOT NULL,
  choice_made TEXT,
  image_url TEXT,
  narration_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(story_id, node_index)
);

-- Create story_choices table
CREATE TABLE IF NOT EXISTS story_choices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  node_id UUID NOT NULL REFERENCES story_nodes(id) ON DELETE CASCADE,
  choice_text TEXT NOT NULL,
  choice_index INTEGER NOT NULL,
  UNIQUE(node_id, choice_index)
);

-- Create indexes
CREATE INDEX idx_stories_user_id ON stories(user_id);
CREATE INDEX idx_stories_updated_at ON stories(updated_at DESC);
CREATE INDEX idx_story_nodes_story_id ON story_nodes(story_id);
CREATE INDEX idx_story_nodes_story_id_index ON story_nodes(story_id, node_index);
CREATE INDEX idx_story_choices_node_id ON story_choices(node_id);

-- Enable Row Level Security
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_choices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for stories
CREATE POLICY "Users can view own stories" ON stories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own stories" ON stories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stories" ON stories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own stories" ON stories
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for story_nodes
CREATE POLICY "Users can view own story nodes" ON story_nodes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = story_nodes.story_id
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own story nodes" ON story_nodes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = story_nodes.story_id
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own story nodes" ON story_nodes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = story_nodes.story_id
      AND stories.user_id = auth.uid()
    )
  );

-- Create RLS policies for story_choices
CREATE POLICY "Users can view story choices" ON story_choices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM story_nodes
      JOIN stories ON stories.id = story_nodes.story_id
      WHERE story_nodes.id = story_choices.node_id
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create story choices" ON story_choices
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM story_nodes
      JOIN stories ON stories.id = story_nodes.story_id
      WHERE story_nodes.id = story_choices.node_id
      AND stories.user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for stories table
CREATE TRIGGER update_stories_updated_at BEFORE UPDATE ON stories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();