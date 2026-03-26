-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Mainlines (主线)
CREATE TABLE mainlines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    cover_url TEXT,
    author_id UUID NOT NULL, -- Logical link to Supabase Auth
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Chapters (章节)
CREATE TABLE chapters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mainline_id UUID REFERENCES mainlines(id) ON DELETE CASCADE,
    parent_chapter_id UUID, -- For hierarchical story structure
    title TEXT NOT NULL,
    content TEXT,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Branches (分支)
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    author_id UUID NOT NULL,
    is_official BOOLEAN DEFAULT FALSE, -- Official vs Community track
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Spinoffs (番外)
CREATE TABLE spinoffs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mainline_id UUID REFERENCES mainlines(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    author_id UUID NOT NULL,
    is_official BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Booklists (书单)
CREATE TABLE booklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    creator_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Booklist Items (书单关联章节)
CREATE TABLE booklist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booklist_id UUID REFERENCES booklists(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL
);

-- RLS (Row Level Security) - Basic setup
ALTER TABLE mainlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE spinoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE booklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE booklist_items ENABLE ROW LEVEL SECURITY;

-- Grant permissions to anon and authenticated
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;

-- Policies
CREATE POLICY "Public read for mainlines" ON mainlines FOR SELECT USING (true);
CREATE POLICY "Public read for chapters" ON chapters FOR SELECT USING (true);
CREATE POLICY "Public read for branches" ON branches FOR SELECT USING (true);
CREATE POLICY "Public read for spinoffs" ON spinoffs FOR SELECT USING (true);
CREATE POLICY "Public read for booklists" ON booklists FOR SELECT USING (true);
CREATE POLICY "Public read for booklist_items" ON booklist_items FOR SELECT USING (true);
