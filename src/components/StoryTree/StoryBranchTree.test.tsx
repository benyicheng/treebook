import { render, fireEvent, screen } from '@testing-library/react';
import React from 'react';
import StoryBranchTree from './StoryBranchTree';
import { ReactFlowProvider } from 'reactflow';
import { vi } from 'vitest';

// Mock ResizeObserver
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserver;

// Mock ReactFlow because it's hard to test directly
vi.mock('reactflow', async () => {
  const actual = await vi.importActual('reactflow');
  return {
    ...actual,
    __esModule: true,
    default: ({ nodes, onNodeClick }: any) => (
      <div>
        {nodes.map((node: any) => (
          <div
            key={node.id}
            data-testid={`node-${node.id}`}
            onClick={(e) => onNodeClick(e, node)}
          >
            {node.data.label}
          </div>
        ))}
      </div>
    ),
    Background: () => <div>Background</div>,
    Controls: () => <div>Controls</div>,
    MiniMap: () => <div>MiniMap</div>,
  };
});

describe('StoryBranchTree', () => {
  it('should correctly parse UUIDs from node IDs', () => {
    const onNodeClick = vi.fn();
    const branchId = 'cb9ddc01-8316-4182-933b-8700078a6316';
    const chapterId = 'e2f9c8a1-5b7d-4e9c-8f1a-2b3c4d5e6f7g';

    const branches = [
      {
        id: branchId,
        parentStoryId: 'story-1',
        parentChapterId: 'chapter-1',
        authorId: 'user-1',
        title: 'Test Branch',
        description: 'Desc',
        branchType: 'parallel',
        isOfficial: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const chapters = [
      {
        id: 'chapter-1',
        storyId: 'story-1',
        title: 'Chapter 1',
        content: 'Content',
        orderIndex: 1,
        isBranchPoint: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: chapterId,
        storyId: 'story-1',
        title: 'Chapter 2',
        content: 'Content',
        orderIndex: 2,
        isBranchPoint: false,
        createdAt: new Date().toISOString(),
      },
    ];

    render(
      <ReactFlowProvider>
        <StoryBranchTree
          chapters={chapters}
          branches={branches}
          onNodeClick={onNodeClick}
        />
      </ReactFlowProvider>
    );

    // Click on branch node
    const branchNode = screen.getByTestId(`node-branch-${branchId}`);
    fireEvent.click(branchNode);
    expect(onNodeClick).toHaveBeenCalledWith(branchId, 'branch');

    // Click on chapter node
    const chapterNode = screen.getByTestId(`node-chapter-${chapterId}`);
    fireEvent.click(chapterNode);
    expect(onNodeClick).toHaveBeenCalledWith(chapterId, 'chapter');
  });
});
