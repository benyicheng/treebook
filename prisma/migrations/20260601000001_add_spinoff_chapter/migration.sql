-- Add originalChapterId to Spinoff model
ALTER TABLE [spinoffs] ADD COLUMN [originalChapterId] TEXT;

-- CreateIndex
CREATE INDEX [spinoffs_originalChapterId_idx] ON [spinoffs]([originalChapterId]);
