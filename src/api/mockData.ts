export interface Story {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  authorName: string;
  isOfficial: boolean;
  viewCount: number;
  branchCount: number;
  createdAt: string;
}

export const mockMainlines: Story[] = [
  {
    id: '1',
    title: '星际余晖',
    description: '在银河系边缘的废弃空间站，人类最后的幸存者发现了一个改变命运的秘密。',
    coverImage: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=scifi+space+station+nebula+epic+book+cover&image_size=square_hd',
    authorName: '艾萨克',
    isOfficial: true,
    viewCount: 1250,
    branchCount: 5,
    createdAt: '2024-03-01',
  },
  {
    id: '2',
    title: '永恒之城',
    description: '一座永不陷落的机械城市，背后隐藏着关于时间的终极悖论。',
    coverImage: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=steampunk+mechanical+city+clockwork+book+cover&image_size=square_hd',
    authorName: '维恩',
    isOfficial: true,
    viewCount: 890,
    branchCount: 3,
    createdAt: '2024-03-05',
  },
];

export const mockBranches: Story[] = [
  {
    id: 'b1',
    title: '星际余晖：暗影协议',
    description: '假如主角在空间站没有选择开启秘密，而是选择了逃离...',
    coverImage: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=dark+space+escape+ship+scifi+book+cover&image_size=square_hd',
    authorName: '星空游民',
    isOfficial: false,
    viewCount: 450,
    branchCount: 0,
    createdAt: '2024-03-10',
  },
];
