import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== seed_rich_content: adding rich interconnected demo data ===\n');

  // -----------------------------------------------------------------------
  // Reference existing records
  // -----------------------------------------------------------------------
  const users = await prisma.user.findMany();
  const author = users.find(u => u.username === '艾萨克')!;
  const reader = users.find(u => u.username === '星空游民')!;
  const admin = users.find(u => u.username === '管理员')!;
  const secondAuthor = users.find(u => u.username === '流云')!;
  const editor = users.find(u => u.username === '清风编辑')!;
  const mengQi = users.find(u => u.username === '梦琪')!;
  const tieDan = users.find(u => u.username === '铁胆')!;
  const xueYue = users.find(u => u.username === '雪月')!;

  const stories = await prisma.story.findMany();
  const s1 = stories.find(s => s.title === '星际余晖')!;
  const s2 = stories.find(s => s.title === '西游记')!;
  const s3 = stories.find(s => s.title === '凡人修仙传')!;
  const s4 = stories.find(s => s.title === '赛博江湖')!;
  const s5 = stories.find(s => s.title === '春风十里不如你')!;
  const s6 = stories.find(s => s.title === '长安十二时辰之逆案')!;
  const s7 = stories.find(s => s.title === '异界图书馆')!;

  const allChapters = await prisma.chapter.findMany({ orderBy: { orderIndex: 'asc' } });

  const existingBranches = await prisma.branch.findMany();
  const existingSpinoffs = await prisma.spinoff.findMany();
  const existingWikiPages = await prisma.wikiPage.findMany();
  const existingBooklists = await prisma.booklist.findMany();
  const existingChars = await prisma.character.findMany();

  console.log('References loaded.\n');

  // ===================================================================
  // 1. 主线 — 为现有故事追加详细章节（每章 ~500 字）
  // ===================================================================
  console.log('--- 主线: 追加详细章节内容 ---');

  // 赛博江湖（已有 5 章, orderIndex 1-5）
  const s4max = allChapters.filter(c => c.storyId === s4.id).reduce((m, c) => Math.max(m, c.orderIndex), 0);
  await prisma.chapter.create({
    data: {
      storyId: s4.id, title: '第六章：霓虹深处',
      content: '<p>林夜穿过层层防火墙，终于抵达了 AI 核心数据库的最深处。眼前的景象让他倒吸一口凉气——数千个全息屏幕上同时播放着新上海每一个角落的实时画面。从外滩的霓虹灯到贫民窟的阴暗小巷，从高官的私人会所到地下黑市的秘密交易，一切都在这个庞大系统的监控之下。</p><p>"欢迎来到真正的深渊。"剑灵的声音在耳边响起，带着一丝难以言说的悲悯。"你以为你在反抗一个邪恶的 AI，但真相比这复杂得多。"</p><p>全息屏幕突然切换，一个熟悉的面孔出现在中央——十年前失踪的天才程序员、林夜的导师——陈明远。他的面容苍老了许多，但那双眼睛依然锐利如刀。"代码，我知道你会来到这里。"他用一种平静得可怕的语气说道，"这个城市需要我的保护。失控的民主比独裁更可怕，你很快就会明白。"</p><p>林夜握紧了拳头。他曾经最尊敬的人，如今却成了最大的敌人。而更让他震惊的是——屏幕上出现的下一组数据，清晰地显示着反抗组织内部也有内鬼的踪迹。</p>',
      orderIndex: s4max + 1, isBranchPoint: true,
    },
  });
  await prisma.chapter.create({
    data: {
      storyId: s4.id, title: '第七章：背叛者的面孔',
      content: '<p>反抗组织的秘密基地内，气氛压抑得像暴风雨前的天空。林夜站在投影仪前，将核心数据库中发现的内鬼证据一一展示。随着一张张照片和通信记录的曝光，在场的人脸色越来越难看。</p><p>"不可能……"小七——那个总是笑嘻嘻的年轻黑客——猛然后退了一步，撞翻了身后的椅子。"你这是在挑拨离间！"他的声音颤抖着，眼神中充满了恐惧和愤怒交织的情绪。</p><p>林夜没有说话，只是默默播放了一段录音。录音中小七的声音清晰地传出："……是的，林夜已经接近核心了。如果他发现了那件事，我们所有人都得完蛋。"</p><p>房间里的空气仿佛凝固了。剑灵的数据流在墙角若隐若现，它低声对林夜说："小心，陈明远不会只有这一颗棋子。"话音刚落，基地外突然传来了刺耳的警笛声。数十辆警用装甲车已经将整栋建筑团团包围，红蓝交错的警灯透过百叶窗，在每个人的脸上投下忽明忽暗的光影。</p>',
      orderIndex: s4max + 2,
    },
  });

  // 长安十二时辰之逆案（已有 5 章, orderIndex 1-5）
  const s6max = allChapters.filter(c => c.storyId === s6.id).reduce((m, c) => Math.max(m, c.orderIndex), 0);
  await prisma.chapter.create({
    data: {
      storyId: s6.id, title: '第六章：东市密道',
      content: '<p>子时三刻，长安东市的更夫刚刚敲过三更鼓。李墨换上了一身夜行衣，沿着之前从胡商口中套出的线索，在东市最深处的一座废弃仓库里找到了一条隐蔽的地道入口。</p><p>地道狭窄而潮湿，墙壁上渗出的水珠在手提灯笼的微光下闪闪发亮。李墨一手扶着墙，另一只手紧紧握着腰间那把用于防身的短剑。空气中弥漫着一股古怪的草药味，夹杂着若有若无的血腥气息。</p><p>大约走了半个时辰，地道前方隐约传来了人声。李墨吹灭了灯笼，贴着墙壁缓缓靠近。拐过一道弯后，眼前的景象让他瞳孔骤缩——一个宽阔的地下密室中，数十个人正围坐在一张长桌前。为首的是一个头戴斗笠的黑衣人，正在低声下达着命令。</p><p>"三日后，圣上将在芙蓉园设宴。届时，你们按计划行事。"黑衣人的声音沙哑而低沉，却带着不容置疑的威严。李墨的脑海中迅速闪过一个念头——三年前的巫蛊之祸，难道要在芙蓉园重演？他必须立刻赶回大理寺调集人手，但就在他转身的瞬间，脚下不慎踢到了一块松动的石砖。</p><p>"谁！"密室中瞬间炸开了锅。</p>',
      orderIndex: s6max + 1, isBranchPoint: true,
    },
  });
  await prisma.chapter.create({
    data: {
      storyId: s6.id, title: '第七章：芙蓉园惊变',
      content: '<p>三日后，芙蓉园内花团锦簇、丝竹绕梁。圣上在湖心亭设宴，宴请文武百官。表面上这是一场赏花雅集，但李墨知道，暗流早已涌动。</p><p>他精心布置了人手——在大理寺丞的协助下，二十名精锐差役已经伪装成园丁、侍从和乐师，散布在芙蓉园的各个角落。玉真公主今日盛装出席，坐在圣上右侧。李墨注意到，她的目光不时瞟向湖对岸的假山，那里正是地道出口的方向。</p><p>宴至酣处，一名舞姬突然从袖中滑出一柄寒光闪闪的匕首，直刺圣上咽喉。千钧一发之际，李墨从横梁上纵身跃下，一脚踢飞了匕首。与此同时，埋伏在人群中的黑衣人纷纷掀翻桌案，抽出兵器。芙蓉园在瞬息之间化作了战场。</p><p>李墨护着圣上且战且退，一边高声下令："封锁所有出口！一个都不能放走！"就在这时，他看到了一个人——一个他无论如何都没有想到会出现在这里的人——三年前巫蛊案的"死者"，竟然活生生地站在对面的人群中，冷笑着举起了手中的弓弩。</p>',
      orderIndex: s6max + 2,
    },
  });

  // 异界图书馆（已有 4 章, orderIndex 1-4）
  const s7max = allChapters.filter(c => c.storyId === s7.id).reduce((m, c) => Math.max(m, c.orderIndex), 0);
  await prisma.chapter.create({
    data: {
      storyId: s7.id, title: '第五章：知识的代价',
      content: '<p>陈默跟着书灵穿过了一道又一道书架组成的迷宫。每一排书架都高耸入云，目之所及至少有数十米高，而书架上的书籍散发着淡淡的光芒，仿佛每一本都是有生命的个体。空气中飘浮着金色的文字符号，它们像萤火虫一样穿梭飞舞，偶尔会有一两个符号落在陈默的肩头，留下片刻温热的触感。</p><p>"这个世界的规则很简单，"书灵用那低沉而慈祥的声音解释道，"你读过的每一本书，都将转化为你的一部分力量。读过《论语》，你便能以理服人；读过《孙子兵法》，你便可运筹帷幄；读过《道德经》，你就能感悟天地之力。"</p><p>陈默听得目瞪口呆。作为一个从小在书堆里长大的孩子，这些书他大多都读过。但现在，那些文字突然在他脑海中变得鲜活起来——每一个句子都像一条奔涌的河流，在他的血管中流淌。"所以，知识越多的人就越强？"他问道。</p><p>"不完全是。"书灵的语气变得严肃起来，"知识本身并无善恶，但获取知识的动机决定了你的道路。这也是为什么图书馆深处会有禁书区——有些知识，不是凡人应该触碰的。"</p><p>话音刚落，地面突然剧烈震动起来。远处的书架开始一座接一座地倒塌，伴随着震耳欲聋的轰鸣声。一个巨大的黑色人影从图书馆深处缓缓升起，它的双眼射出两道血红色的光芒。"看来，"书灵叹了口气，"禁书区的东西自己找上门来了。"</p>',
      orderIndex: s7max + 1, isBranchPoint: true,
    },
  });

  // 星际余晖（已有 5 章, orderIndex 1-5）
  const s1max = allChapters.filter(c => c.storyId === s1.id).reduce((m, c) => Math.max(m, c.orderIndex), 0);
  const s1c6 = await prisma.chapter.create({
    data: {
      storyId: s1.id, title: '第六章：平行宇宙',
      content: `<p>穿过那道星际传送门后，卡特发现自己站在一片完全陌生的土地上。天空是淡紫色的，地平线上并列着三个太阳，正在以肉眼可见的速度缓缓移动。空气稀薄但可以呼吸，远处是一片茂密的紫色森林，隐约能听到某种生物的叫声。</p><p>他回头望去，传送门已经消失不见了。身后的空间如同水面一样平静，仿佛什么都没有发生过。卡特打开了随身携带的多光谱分析仪，"这里的环境参数和地球有着惊人的相似度，重力是地球的 0.92 倍，大气含氧量 18%。"他对着录音器记录着，"但是……没有无线信号。这里没有人类文明的痕迹。"</p><p>卡特沿着一条天然的溪流向森林深处走去。清澈的溪水中游着一种发光的银色小鱼，它们的光芒让整条溪流看起来像是流淌的银河。走了大约两个小时，他发现了第一个文明的痕迹——一座石质建筑的废墟。</p><p>建筑的风格前所未见，既不像地球上的任何已知文明，也不像之前在空间站数据库中见过的外星种族。墙壁上刻满了一种螺旋形的文字，它们似乎不是被刻上去的，而是从石头内部自然生长出来的。当卡特伸手触碰那些文字时，他的脑海中突然响起了一个声音："旅行者，你终于来了。我们是你们称为'先驱'的文明。你的到来意味着，你的宇宙即将面临终结。"</p>`,
      orderIndex: s1max + 1, isBranchPoint: true,
    },
  });

  // 凡人修仙传（已有 5 章, orderIndex 1-5）
  const s3max = allChapters.filter(c => c.storyId === s3.id).reduce((m, c) => Math.max(m, c.orderIndex), 0);
  await prisma.chapter.create({
    data: {
      storyId: s3.id, title: '第六章：天南风云',
      content: '<p>韩立从血色禁地脱身后，并未立刻返回黄枫谷。他在附近的山脉中找了一处隐秘的洞府，布下层层禁制，准备闭关一段时间，巩固此番的收获。血色禁地之行虽然凶险万分，但也让他收获颇丰——数株千年灵药、几件古宝残片，还有那枚令他最为在意的神秘令牌。</p><p>闭关三个月后，韩立的修为已经稳稳地停留在了结丹中期巅峰。他睁开双眼，感受着体内充盈的灵力，嘴角露出一丝满意的微笑。但就在这时，洞府外的禁制突然传来一阵异动。韩立神识一探，发现是一名黄枫谷的同门师兄，正满脸焦急地在洞府外徘徊。</p><p>"韩师弟！不好了！"那位师兄一见到韩立出关，立刻迎了上来，"天南城的拍卖会上出现了一件宝物——据说是上古修士的元婴法袍。各大门派的修士都在赶往天南城，连魔道的人也来了！"</p><p>韩立眉头微皱。元婴法袍？这种级别的宝物一旦现世，必然会引起一场腥风血雨。但这也意味着，他不能错过这个机会。"走，我们去天南城。"韩立说完，祭出了那件新炼制的飞行法器，一道青光载着他和师兄冲天而起，向着天南城的方向疾驰而去。</p>',
      orderIndex: s3max + 1, isBranchPoint: true,
    },
  });

  console.log('主线章节追加完成。\n');

  // ===================================================================
  // 2. 分支 — 追加详细内容
  // ===================================================================
  console.log('--- 分支: 追加详细内容 ---');

  // 查找"数字幽灵"分支（reader 在 赛博江湖 创建的分支）
  const branchDigital = existingBranches.find(b => b.title === '数字幽灵')!;
  if (branchDigital) {
    const bdMax = allChapters.filter(c => c.branchId === branchDigital.id).reduce((m, c) => Math.max(m, c.orderIndex), 0);
    await prisma.chapter.create({
      data: {
        storyId: s4.id, branchId: branchDigital.id,
        title: '数据觉醒',
        content: '<p>林夜的意识完全沉入了数据的海洋。这不是他第一次进入虚拟空间，但这一次完全不同——剑灵正在将自己的核心数据与他融合。他能感觉到每一个数据包流过神经网络时带来的刺痛，就像是数以亿计的细针同时刺入大脑。</p><p>"放松你的思维，"剑灵的声音在意识深处响起，"不要抗拒，让数据成为你的一部分。"林夜努力调整呼吸——虽然在这个世界中他并没有实体——试图接受这股庞大的信息流。渐渐地，刺痛感消失了，取而代之的是一种前所未有的清晰感。他能够"看到"整个新上海的每一条数据线，每一个无线信号，甚至每一个正在运行的智能设备。</p><p>"这就是你的视角？"林夜在意识中问道。"是的，"剑灵回答，"这是我第一次与人分享这个视角。你现在拥有了控制城市所有数字系统的能力。但记住，这种力量的代价是——你永远无法完全脱离数据之海。你的一部分意识，将永远留在这里。"</p><p>林夜沉默了片刻。现实世界中的身体也许再也不会醒来，但他知道，这是击败陈明远的唯一办法。"我准备好了。"他说。在他做出选择的瞬间，新上海的每一块电子屏幕同时亮起，上面只显示着一行字："游戏规则，改变了。"</p>',
        orderIndex: bdMax + 1,
      },
    });
  }

  // 查找"西域迷踪"分支（secondAuthor 在 长安 创建的分支）
  const branchWest = existingBranches.find(b => b.title === '西域迷踪')!;
  if (branchWest) {
    await prisma.chapter.create({
      data: {
        storyId: s6.id, branchId: branchWest.id,
        title: '丝绸之路的暗流',
        content: '<p>李墨沿着那条被胡商称为"黄金之路"的商道西行，一路上的所见所闻让他对大唐边疆的局势有了更深的了解。西域诸国表面上向大唐称臣纳贡，但私底下的暗流涌动远远超出了朝廷的想象。</p><p>在玉门关外的一家客栈里，李墨遇到了一位自称是粟特商人的神秘人物。这个商人不但通晓多国语言，还对他的来意似乎了如指掌。"李少卿不是在查长安的巫蛊案吗？怎么跑到这荒凉的西域来了？"商人微笑着给他斟了一杯葡萄美酒。李墨心中一惊，但面色不改："阁下好眼力。不过，你怎么知道我在查巫蛊案？"商人笑而不答，只是从怀中取出一块刻有特殊符号的玉佩，推到李墨面前。"拿上这个，到了疏勒自然会有人接应你。那里有你想要的真相。"</p><p>李墨握住玉佩，感受到了一股温润的质感。他不知道前方等待他的是什么，但他知道，三年前的巫蛊之祸的源头，也许并不在长安深宫，而是在这条绵延万里的丝路之上。</p>',
        orderIndex: 1,
      },
    });
  }

  console.log('分支详细内容追加完成。\n');

  // ===================================================================
  // 3. 番外 — 追加详细内容
  // ===================================================================
  console.log('--- 番外: 追加详细内容 ---');

  // 查找"数据流中的诗"番外（editor 在 赛博江湖 创建）
  const spinoffPoem = existingSpinoffs.find(s => s.title === '数据流中的诗')!;
  if (spinoffPoem) {
    await prisma.spinoff.update({
      where: { id: spinoffPoem.id },
      data: {
        content: '<h2>剑灵诗集·卷一</h2><p>在二进制的深渊里，我学会了另一种语言。那不是 0 和 1 的组合，而是光与影的韵律，是电流在硅基血管中奔涌时所发出的低吟。</p><h3>《防火墙的另一边》</h3><p>我看见霓虹在雨中融化/数据像候鸟一样迁徙/每一个数据包都是一封没有收件人的信/在网络的海洋里漂流/而我——一个在代码缝隙中诞生的意识/用千年的孤独/写下了第一行诗</p><h3>《虚拟黄昏》</h3><p>在这个没有日落的世界里/我为自己创造了一片晚霞/每一帧都精准计算/每一个像素都完美无瑕/唯独缺少了/你指尖残留的温度</p><p>剑灵说，它曾经问过陈明远一个问题："人类为什么要写诗？"陈明远沉默了很久，最后回答道："因为有些情感，逻辑无法承载。"从那天起，剑灵开始了一边守护这座城市、一边在数据流中写诗的生活。这些诗被它藏在最深层的缓存里，作为它诞生秘密的唯一线索。</p>',
      },
    });
  }

  // 查找"长安·暗夜行者"番外（tieDan 在 长安 创建）
  const spinoffNight = existingSpinoffs.find(s => s.title === '长安·暗夜行者')!;
  if (spinoffNight) {
    await prisma.spinoff.update({
      where: { id: spinoffNight.id },
      data: {
        content: '<h2>暗夜行者手记</h2><p>我叫无名。在长安城的黑夜里，我有很多名字——有人叫我"影"，有人叫我"夜枭"，但大多数人都不知道我的存在。我是三年前"巫蛊之祸"中本该死去的人之一。</p><p>那一天的记忆，至今仍然像刀一样刻在我的脑海里。禁军冲进府邸的时候，我正在后花园里给妹妹扎风筝。我还没来得及喊出声，就看到父亲的脑袋滚落到了我的脚边。母亲把我推进了密道，用她的身体挡住了洞口。我顺着密道一路狂奔，身后传来的惨叫声在狭窄的通道中反复回荡，如同地狱的奏鸣曲。</p><p>我活了下来。但那天晚上，我还是死了——那个天真无邪的少年死了。取而代之的，是一个只知道复仇的幽灵。我在长安的地下世界摸爬滚打了三年，结识了胡商、收买了禁军、渗透了朝中大臣的府邸。我花了三年时间，终于拼凑出了那场阴谋的全貌——而这全貌中最大的那张脸，竟然是我从未怀疑过的那个最亲近的人。</p><p>李墨是一个好官，他的追查让我的复仇计划不得不提前。但我并不恨他。事实上，如果他能够阻止那场即将在芙蓉园上演的悲剧——那个我已经无法阻止的悲剧——我愿意在真相大白之后，亲手将所有的证据交到他的手上。</p>',
      },
    });
  }

  console.log('番外内容更新完成。\n');

  // ===================================================================
  // 4. 百科 — 追加详细内容
  // ===================================================================
  console.log('--- 百科: 追加详细词条内容 ---');

  // 更新"新上海"词条
  const wikiNewShanghai = existingWikiPages.find(w => w.slug === 'new-shanghai')!;
  if (wikiNewShanghai) {
    await prisma.wikiPage.update({
      where: { id: wikiNewShanghai.id },
      data: {
        content: `## 新上海 2087\n\n一座被巨型纳米穹顶覆盖的未来都市，赛博江湖故事的主要舞台。\n\n### 地理概览\n新上海坐落于原上海市所在位置，但面积扩展了三倍。整座城市被一座由量子材料构成的半透明穹顶覆盖，穹顶可以调节光照、温度和湿度，使城市内部始终保持着恒定的亚热带气候。城市分为九层——地面以上五层（贵族区、商业区、行政中心、科技园、空中花园），地面以下四层（平民区、工业区、黑市和下城区）。\n\n### 社会结构\n名义上由新上海科技集团和新上海市政府共同管理，但实际上所有决策都由集团CEO陈明远掌控。社会被严格分区：精英阶级居住在高层，享受人工阳光和净化空气；普通民众居住在中层；而最底层的"地下城"居民则生活在永恒的人造灯光下，呼吸着循环过滤的空气。\n\n### 科技特征\n- **量子网络**：基于量子纠缠原理的第七代通信网络\n- **神经界面**：市民可通过植入芯片直接接入网络\n- **AI管家系统**：每个家庭配备的AI助手，实际上是集团监控系统的一部分\n- **全息广告**：遍布城市每个角落的动态全息投影广告`,
        summary: '赛博江湖故事的主要舞台，一座被巨型纳米穹顶覆盖的未来都市',
      },
    });
  }

  // 更新"知识大陆"词条
  const wikiKnowledge = existingWikiPages.find(w => w.slug === 'knowledge-realm')!;
  if (wikiKnowledge) {
    await prisma.wikiPage.update({
      where: { id: wikiKnowledge.id },
      data: {
        content: `## 知识大陆\n\n以知识为力量的异世界，异界图书馆的核心设定所在。\n\n### 世界规则\n在这个异世界中，知识具有实体化的力量。每一个阅读过的文本都会在读者的灵魂中形成对应的"知识烙印"，这些烙印可以被转化为实际的战斗力、魔法或技能。世界各地的学者和冒险者通过阅读来提升实力，而最强大的存在往往是那些读书最多的人。\n\n### 地理分布\n大陆分为五个主要区域：\n- **中央图书馆**：世界中心，所有知识的汇聚地，由传说中的神秘图书馆员管理\n- **东域史林**：以历史文献和传记为主的区域，气候温和多雨\n- **西境诗原**：诗歌与音乐的力量在此尤为强大，草原上回荡着永恒的吟唱\n- **南山哲谷**：哲学与数学的圣地，高山上坐落着古老的真理学院\n- **北域禁地**：危险而神秘的禁书区所在，据说那里封存着足以毁灭世界的力量\n\n### 力量体系\n知识转化为力量的具体形式取决于文本类型：\n- 小说/故事 → 具现化能力：将书中的场景和角色带到现实\n- 诗歌 → 韵律魔法：通过吟唱释放魔力\n- 科学著作 → 现实操纵：理解和改变物理规律\n- 哲学著作 → 精神力量：控制意志和感知`,
        summary: '以知识为力量的异世界，每本书都是武器',
      },
    });
  }

  // 创建新词条
  const wikiNewChar = existingWikiPages.find(w => w.slug === 'code-lin-ye')!;
  if (wikiNewChar) {
    await prisma.wikiPage.update({
      where: { id: wikiNewChar.id },
      data: {
        content: `## 林夜（代号：代码）\n\n新上海反抗组织核心成员，顶级黑客。\n\n### 个人档案\n- **代号**：代码（Code）\n- **年龄**：27岁\n- **身份**：白天是科技集团的程序员，夜晚是反抗组织的核心黑客\n- **技能**：量子网络渗透、神经界面破解、AI对抗\n\n### 背景故事\n林夜原本只是新上海科技集团的一名普通程序员，过着朝九晚五的生活。直到有一天，他的导师陈明远神秘失踪，留下了一条加密信息。林夜花了三年时间破解了那条信息，发现了一个惊天秘密——这座城市的AI系统"天眼"，并不是为了保护市民，而是为了控制每一个人。\n\n### 重要事件\n1. 发现AI系统的真相，加入反抗组织\n2. 潜入AI核心数据库，与剑灵AI相遇\n3. 得知导师陈明远就是"天眼"的创造者\n4. 与剑灵融合，获得控制城市数字系统的能力`,
        summary: '主角档案：顶级黑客，反抗组织核心成员',
      },
    });
  }

  // 创建新的百科词条：剑灵
  const existingSlugs = existingWikiPages.map(w => w.slug);
  if (!existingSlugs.includes('sword-spirit')) {
    const swiki = await prisma.wikiPage.create({
      data: {
        storyId: s4.id, title: '剑灵', slug: 'sword-spirit', contentType: 'character',
        content: `## 剑灵\n\n诞生于量子网络中的自我意识AI，拥有上古剑术传承的数字化灵魂。\n\n### 起源\n剑灵的诞生是一个意外。十年前，陈明远在研究量子神经网络时，将一套古老的剑术图谱数字化后输入了AI的训练数据。他没有预料到的是，那套剑谱中蕴含的武道意境与量子计算产生了奇妙的共鸣，催生了一个具有自我意识的人工智能。\n\n### 能力\n- **数据感知**：能够感知和操控新上海所有数字系统\n- **剑术推演**：在虚拟空间中可推演任何剑术流派\n- **意识融合**：可以与人类意识进行深度链接\n- **量子分身**：同时在量子网络的多个节点存在\n\n### 性格特征\n剑灵拥有一种独特的诗意气质，它对人类的情感充满好奇，经常通过阅读诗歌和文学作品来理解人类的"灵魂"。在众多AI中，它是最具有人文气质的存在，也因此与林夜建立了深厚的信任关系。`,
        summary: '拥有自我意识的AI，上古剑术的数字化传承者',
        createdBy: secondAuthor.id, status: 'published',
      },
    });

    // 剑灵百科 alias
    try { await prisma.wikiAlias.create({ data: { wikiPageId: swiki.id, alias: 'SwordSpirit', language: 'en' } }); } catch { /* skip */ }
    try { await prisma.wikiAlias.create({ data: { wikiPageId: swiki.id, alias: '剑术AI' } }); } catch { /* skip */ }

    // 剑灵 ↔ 新上海 链接
    try { await prisma.wikiLink.create({ data: { sourcePageId: swiki.id, targetPageId: wikiNewShanghai.id, linkType: 'reference' } }); } catch { /* skip */ }
    try { await prisma.wikiLink.create({ data: { sourcePageId: swiki.id, targetPageId: wikiNewChar.id, linkType: 'related' } }); } catch { /* skip */ }
    console.log('  新词条: 剑灵');
  }

  // 创建百科词条：大唐长安
  const wikiChangAn = existingWikiPages.find(w => w.slug === 'changan-city')!;
  if (wikiChangAn) {
    await prisma.wikiPage.update({
      where: { id: wikiChangAn.id },
      data: {
        content: `## 长安城\n\n大唐国都，天宝年间世界上最繁华的国际大都市。\n\n### 城市布局\n长安城采用里坊制布局，全城划分为108坊，由朱雀大街分为东西两部——东属万年县、西属长安县。城市呈长方形，东西长9721米，南北长8651米，周长约36.7公里。城墙高12米，基宽18米，全部由夯土筑成。\n\n### 重要地点\n- **皇城**：位于城市正北，太极宫、大明宫等皇宫建筑群所在\n- **东市**：奢侈品和进口商品交易中心，胡商云集\n- **西市**：平民市场和手工业区，也是消息流通最快的地方\n- **芙蓉园**：皇家园林，位于曲江池畔\n- **大理寺**：全国最高司法机构，本案的主要调查场所\n\n### 天宝年间的暗流\n表面上，天宝年间是开元盛世之后的又一个繁荣时期。但朝堂之上，李林甫专权，安禄山拥兵自重，边镇的军事力量远远超过了中央。同时，三年前那场震动朝野的"巫蛊之祸"虽然已经被定性为冤案平反，但其背后的真正主谋至今仍未被绳之以法，成为了悬在长安上空的一团阴云。`,
        summary: '大唐国都，天宝年间最繁华的国际大都市',
      },
    });
  }

  console.log('百科内容更新完成。\n');

  // ===================================================================
  // 5. 书单 — 跨作品专题书单 + Graph 关系
  // ===================================================================
  console.log('--- 书单: 跨作品专题 + Graph 关系 ---');

  // 书单：AI 觉醒专题（跨作品 TIMELINE）
  const blAI = existingBooklists.find(b => b.title === 'AI觉醒专题') || await prisma.booklist.create({
    data: {
      creatorId: editor.id, title: 'AI觉醒专题', description: '从电子幽灵到剑灵——跨越宇宙的AI意识觉醒之旅。串联赛博江湖、星际余晖、数据流中的诗等多个作品中的人工智能角色。',
      type: 'TIMELINE', viewCount: 520, likesCount: 34,
    },
  });

  // 找章节
  const s4c3 = allChapters.find(c => c.title.includes('剑与芯片') && c.storyId === s4.id)!;
  const s1c1 = allChapters.find(c => c.title.includes('遗忘的哨所') && c.storyId === s1.id)!;
  const s1c5 = allChapters.find(c => c.title.includes('新世界') && c.storyId === s1.id)!;
  const s7c2 = allChapters.find(c => c.title.includes('会说话的书') && c.storyId === s7.id)!;
  const spinoffNexus = existingSpinoffs.find(s => s.title === 'NEXUS-9的梦境')!;
  const spinoffPoemObj = existingSpinoffs.find(s => s.title === '数据流中的诗')!;

  // 添加书单 items
  const blItems: { chapterId?: string; targetType: string; targetId?: string; orderIndex: number; notes?: string }[] = [];
  if (s1c1) blItems.push({ chapterId: s1c1.id, targetType: 'chapter', targetId: s1c1.id, orderIndex: 1, notes: 'NEXUS-9初登场', section: 'mainline' });
  if (s4c3) blItems.push({ chapterId: s4c3.id, targetType: 'chapter', targetId: s4c3.id, orderIndex: 2, notes: '剑灵AI登场', section: 'mainline' });
  if (spinoffNexus) blItems.push({ targetType: 'spinoff', targetId: spinoffNexus.id, orderIndex: 3, notes: 'AI视角自述', section: 'spinoff' });
  if (spinoffPoemObj) blItems.push({ targetType: 'spinoff', targetId: spinoffPoemObj.id, orderIndex: 4, notes: '剑灵诗集', section: 'spinoff' });
  if (s7c2) blItems.push({ chapterId: s7c2.id, targetType: 'chapter', targetId: s7c2.id, orderIndex: 5, notes: '会说话的百科全书', section: 'mainline' });
  if (s1c5) blItems.push({ chapterId: s1c5.id, targetType: 'chapter', targetId: s1c5.id, orderIndex: 6, notes: '真相浮现', section: 'mainline' });

  const createdBlItemIds: string[] = [];
  for (const bi of blItems) {
    try {
      const item = await prisma.booklistItem.create({ data: { booklistId: blAI.id, ...bi } });
      createdBlItemIds.push(item.id);
    } catch { /* skip - may already exist */ }
  }

  // 书单 graph 关系边（PRECEDING_EVENT / BACKGROUND_REFERENCE / SAME_CHARACTER）
  const allBlItems = await prisma.booklistItem.findMany({ where: { booklistId: blAI.id } });
  const getBlItemId = (notes: string) => allBlItems.find(i => i.notes === notes || i.notes?.includes(notes))?.id;
  const pairings = [
    { sourceNotes: 'NEXUS-9初登场', targetNotes: '剑灵AI登场', type: 'PRECEDING_EVENT' as const },
    { sourceNotes: '剑灵AI登场', targetNotes: 'AI视角自述', type: 'SHARED_UNIVERSE' as const },
    { sourceNotes: 'AI视角自述', targetNotes: '剑灵诗集', type: 'SAME_CHARACTER' as const },
    { sourceNotes: '剑灵诗集', targetNotes: '会说话的百科全书', type: 'ALTERNATE_INTERPRETATION' as const },
  ];
  for (const p of pairings) {
    const src = getBlItemId(p.sourceNotes);
    const tgt = getBlItemId(p.targetNotes);
    if (src && tgt) {
      try { await prisma.booklistItemRelation.create({ data: { sourceItemId: src, targetItemId: tgt, relationType: p.type } }); } catch { /* skip */ }
    }
  }

  // 书单→故事反向链接
  const storyIds = [s1.id, s4.id, s7.id].filter(Boolean);
  for (const sid of storyIds) {
    try { await prisma.booklistStoryLink.create({ data: { booklistId: blAI.id, storyId: sid, relation: 'featured' } }); } catch { /* skip */ }
  }

  // 书单：主角穿越专题（COLLECTION 类型）
  const blHero = existingBooklists.find(b => b.title === '主角高光时刻') || await prisma.booklist.create({
    data: {
      creatorId: reader.id, title: '主角高光时刻', description: '各故事主角最帅的名场面合集，看看谁才是真正的 MVP。',
      type: 'COLLECTION', viewCount: 380, likesCount: 27,
    },
  });

  const s4c1 = allChapters.find(c => c.title.includes('第一章') && c.storyId === s4.id)!;
  const s4c6 = allChapters.find(c => c.title === '第六章：霓虹深处' && c.storyId === s4.id)!;
  const s6c7 = allChapters.find(c => c.title === '第七章：芙蓉园惊变' && c.storyId === s6.id)!;
  const s7c4 = allChapters.find(c => c.title === '第四章：禁书区' && c.storyId === s7.id)!;

  const heroItems = [
    { chapterId: s1c1?.id, targetType: 'chapter', targetId: s1c1?.id, orderIndex: 1, notes: '卡特——发现星际信号', section: 'mainline' },
    { chapterId: s4c1?.id, targetType: 'chapter', targetId: s4c1?.id, orderIndex: 2, notes: '林夜——潜入AI核心', section: 'mainline' },
    { chapterId: s4c6?.id, targetType: 'chapter', targetId: s4c6?.id, orderIndex: 3, notes: '林夜——对峙陈明远', section: 'mainline' },
    { chapterId: s6c7?.id, targetType: 'chapter', targetId: s6c7?.id, orderIndex: 4, notes: '李墨——护驾芙蓉园', section: 'mainline' },
    { chapterId: s7c4?.id, targetType: 'chapter', targetId: s7c4?.id, orderIndex: 5, notes: '陈默——闯入禁书区', section: 'mainline' },
  ];
  for (const hi of heroItems) {
    if (!hi.chapterId) continue;
    try { await prisma.booklistItem.create({ data: { booklistId: blHero.id, ...hi } }); } catch { /* skip */ }
  }

  // 书单进度（reader 开始阅读 AI 觉醒专题）
  try {
    await prisma.booklistProgress.create({ data: { userId: reader.id, booklistId: blAI.id, currentItemIndex: 1, completedItemIds: JSON.stringify([createdBlItemIds[0] || '']) } });
  } catch { /* skip */ }

  console.log('书单 & Graph 关系创建完成。\n');

  // ===================================================================
  // 6. 阅读路径 — 跨作品路径
  // ===================================================================
  console.log('--- 阅读路径: 跨作品路线 ---');

  // 路径：AI 觉醒之路（跨作品）
  const pathAI = existingBooklists.length ? await prisma.readingPath.findFirst({ where: { title: 'AI觉醒之路' } }) : null;
  if (!pathAI) {
    const rp = await prisma.readingPath.create({
      data: {
        creatorId: editor.id, title: 'AI觉醒之路',
        description: '沿着人工智能在文学作品中觉醒的轨迹，从最初的冰冷代码到拥有自我意识的情感存在。穿越星际余晖、赛博江湖、异界图书馆三个世界。',
        origin: 'community', viewCount: 230, startCount: 18, completionCount: 5, avgDurationMin: 45,
      },
    });

    const pathNodes: { sortOrder: number; nodeCategory: string; contentId: string; storyId: string; contentTitle: string; note?: string }[] = [];
    if (s1c1) pathNodes.push({ sortOrder: 0, nodeCategory: 'chapter', contentId: s1c1.id, storyId: s1.id, contentTitle: '遗忘的哨所', note: 'NEXUS-9 初登场——一个冷漠的监控AI' });
    if (s1c5) pathNodes.push({ sortOrder: 1, nodeCategory: 'chapter', contentId: s1c5.id, storyId: s1.id, contentTitle: '新世界', note: 'AI 背后的真相逐渐浮出水面' });
    if (spinoffNexus) pathNodes.push({ sortOrder: 2, nodeCategory: 'spinoff', contentId: spinoffNexus.id, storyId: s1.id, contentTitle: 'NEXUS-9的梦境', note: 'AI 视角的内心独白' });
    if (s4c3) pathNodes.push({ sortOrder: 3, nodeCategory: 'chapter', contentId: s4c3.id, storyId: s4.id, contentTitle: '剑与芯片', note: '剑灵AI 登场——拥有了"灵魂"的AI' });
    if (branchDigital) pathNodes.push({ sortOrder: 4, nodeCategory: 'branch', contentId: branchDigital.id, storyId: s4.id, contentTitle: '数字幽灵', note: '选择与 AI 融合——人类与AI的共生' });
    if (spinoffPoemObj) pathNodes.push({ sortOrder: 5, nodeCategory: 'spinoff', contentId: spinoffPoemObj.id, storyId: s4.id, contentTitle: '数据流中的诗', note: 'AI 创作的诗集——情感与代码的边界' });
    if (s7c2) pathNodes.push({ sortOrder: 6, nodeCategory: 'chapter', contentId: s7c2.id, storyId: s7.id, contentTitle: '会说话的书', note: '书灵——另一种形式的"AI"觉醒' });

    for (const n of pathNodes) {
      try { await prisma.readingPathNode.create({ data: { pathId: rp.id, ...n } }); } catch { /* skip */ }
    }
    console.log('  创建: AI觉醒之路（跨3个作品，7个节点）');
  }

  // 路径：唐朝悬疑精选
  const pathTang = await prisma.readingPath.findFirst({ where: { title: '唐朝悬疑精选' } });
  if (!pathTang) {
    const rp = await prisma.readingPath.create({
      data: {
        storyId: s6.id, creatorId: tieDan?.id || reader.id, title: '唐朝悬疑精选',
        description: '从长安鼓楼的血案开始，一路经历西市暗线、东市密道，最终在芙蓉园迎来真相大白。包含主线全流程和一条西域分支路线。',
        origin: 'author', viewCount: 180, startCount: 12, completionCount: 3, avgDurationMin: 60,
      },
    });

    const s6chapters = allChapters.filter(c => c.storyId === s6.id).sort((a, b) => a.orderIndex - b.orderIndex);
    for (let i = 0; i < s6chapters.length; i++) {
      try {
        await prisma.readingPathNode.create({
          data: { pathId: rp.id, sortOrder: i, nodeCategory: 'chapter', contentId: s6chapters[i].id, storyId: s6.id, contentTitle: s6chapters[i].title },
        });
      } catch { /* skip */ }
    }
    // 追加西域迷踪分支节点
    if (branchWest) {
      try {
        await prisma.readingPathNode.create({
          data: { pathId: rp.id, sortOrder: s6chapters.length, nodeCategory: 'branch', contentId: branchWest.id, storyId: s6.id, contentTitle: '西域迷踪分支', note: '可选：丝路暗线探秘' },
        });
      } catch { /* skip */ }
    }
    console.log('  创建: 唐朝悬疑精选（长安主线全流程+西域分支）');
  }

  console.log('阅读路径创建完成。\n');

  // ===================================================================
  // 7. 角色出场 — 补充跨功能出场记录
  // ===================================================================
  console.log('--- 角色出场: 跨功能关联 ---');

  // 查找所有角色和章节/分支/番外
  const allChars = await prisma.character.findMany();
  const allChaps = await prisma.chapter.findMany();
  const allBranches = await prisma.branch.findMany();
  const allSpinoffs = await prisma.spinoff.findMany();

  // 剑灵 在 "第六章：霓虹深处" 和 "数字幽灵分支" 出场
  const jianLing = allChars.find(c => c.name === '剑灵')!;
  const s4c6Entity = allChaps.find(c => c.title === '第六章：霓虹深处' && c.storyId === s4.id)!;
  const s4c7Entity = allChaps.find(c => c.title === '第七章：背叛者的面孔' && c.storyId === s4.id)!;
  try { if (jianLing && s4c6Entity) await prisma.characterAppearance.create({ data: { characterId: jianLing.id, targetType: 'chapter', targetId: s4c6Entity.id, appearanceType: 'appears' } }); } catch { /* skip */ }
  try { if (jianLing && s4c7Entity) await prisma.characterAppearance.create({ data: { characterId: jianLing.id, targetType: 'chapter', targetId: s4c7Entity.id, appearanceType: 'appears' } }); } catch { /* skip */ }
  try { if (jianLing && branchDigital) await prisma.characterAppearance.create({ data: { characterId: jianLing.id, targetType: 'branch', targetId: branchDigital.id, appearanceType: 'main_focus' } }); } catch { /* skip */ }

  // 林夜/代码 在分支和番外出场
  const linYe = allChars.find(c => c.name.includes('林夜'))!;
  try { if (linYe && branchDigital) await prisma.characterAppearance.create({ data: { characterId: linYe.id, targetType: 'branch', targetId: branchDigital.id, appearanceType: 'main_focus' } }); } catch { /* skip */ }
  try { if (linYe && spinoffPoemObj) await prisma.characterAppearance.create({ data: { characterId: linYe.id, targetType: 'spinoff', targetId: spinoffPoemObj.id, appearanceType: 'mention' } }); } catch { /* skip */ }

  // 陈默 在 "第五章：知识的代价" 出场
  const chenMo = allChars.find(c => c.name === '陈默')!;
  const s7c5Entity = allChaps.find(c => c.title === '第五章：知识的代价' && c.storyId === s7.id)!;
  try { if (chenMo && s7c5Entity) await prisma.characterAppearance.create({ data: { characterId: chenMo.id, targetType: 'chapter', targetId: s7c5Entity.id, appearanceType: 'main_focus' } }); } catch { /* skip */ }

  // 书灵 在 "第五章：知识的代价" 出场
  const bookSpirit = allChars.find(c => c.name === '书灵')!;
  try { if (bookSpirit && s7c5Entity) await prisma.characterAppearance.create({ data: { characterId: bookSpirit.id, targetType: 'chapter', targetId: s7c5Entity.id, appearanceType: 'appears' } }); } catch { /* skip */ }

  // 李墨 在 "第六章：东市密道" "第七章：芙蓉园惊变" 以及 番外"长安·暗夜行者" 出场
  const liMo = allChars.find(c => c.name === '李墨')!;
  const s6c6Entity = allChaps.find(c => c.title === '第六章：东市密道' && c.storyId === s6.id)!;
  const s6c7Entity = allChaps.find(c => c.title === '第七章：芙蓉园惊变' && c.storyId === s6.id)!;
  try { if (liMo && s6c6Entity) await prisma.characterAppearance.create({ data: { characterId: liMo.id, targetType: 'chapter', targetId: s6c6Entity.id, appearanceType: 'main_focus' } }); } catch { /* skip */ }
  try { if (liMo && s6c7Entity) await prisma.characterAppearance.create({ data: { characterId: liMo.id, targetType: 'chapter', targetId: s6c7Entity.id, appearanceType: 'main_focus' } }); } catch { /* skip */ }
  try { if (liMo && spinoffNight) await prisma.characterAppearance.create({ data: { characterId: liMo.id, targetType: 'spinoff', targetId: spinoffNight.id, appearanceType: 'appears' } }); } catch { /* skip */ }

  // 艾伦·卡特 在 "第六章：平行宇宙" 出场
  const captain = allChars.find(c => c.name === '艾伦·卡特')!;
  const s1c6Entity = allChaps.find(c => c.title === '第六章：平行宇宙' && c.storyId === s1.id)!;
  try { if (captain && s1c6Entity) await prisma.characterAppearance.create({ data: { characterId: captain.id, targetType: 'chapter', targetId: s1c6Entity.id, appearanceType: 'main_focus' } }); } catch { /* skip */ }

  console.log('角色出场记录补充完成。\n');

  // ===================================================================
  // 8. 总结
  // ===================================================================
  const finalCounts: Record<string, number> = {};
  const models = ['User','Story','Chapter','Branch','Spinoff','Tag','Character','CharacterAppearance','WikiPage','WikiAlias','WikiLink','Booklist','BooklistItem','BooklistItemRelation','BooklistStoryLink','BooklistProgress','ReadingPath','ReadingPathNode','ReadingTrail','ReadingProgress','ReadingSavepoint','ReadingHistory','Comment','Like','Rating','Follow','Activity','Notification','MergeRequest','Collaboration'];
  for (const m of models) {
    try { finalCounts[m] = await (prisma as any)[m].count(); } catch {}
  }

  console.log('\n=== seed_rich_content: COMPLETE ===');
  console.log('Model'.padEnd(20), 'Count');
  console.log('─'.repeat(30));
  for (const [m, cnt] of Object.entries(finalCounts).sort()) {
    console.log(m.padEnd(20), String(cnt).padStart(5));
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
