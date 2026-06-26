import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { optionalAuthenticate, type AuthRequest } from '../middleware/auth';
import { sendErr } from '../utils/http';
import { catchAsync } from '../utils/catchAsync';
import { validateRequest } from '../middleware/validate';

const feedbackSchema = z.object({
  body: z.object({
    type: z.string().max(50).optional().default('other'),
    content: z.string().min(1, '反馈内容不能为空').max(5000),
    contact: z.string().max(200).optional().nullable(),
  }),
});

const reportSchema = z.object({
  body: z.object({
    type: z.string().min(1, '请选择举报类型').max(50),
    targetType: z.string().max(50).optional().nullable(),
    targetUrl: z.string().max(500).optional().nullable(),
    reason: z.string().max(500).optional().nullable(),
    description: z.string().min(1, '举报描述不能为空').max(5000),
    contact: z.string().max(200).optional().nullable(),
  }),
});

const router = Router();

router.post('/', optionalAuthenticate, validateRequest(feedbackSchema), catchAsync(async (req: AuthRequest, res: Response) => {
  const { type, content, contact } = req.body;
  await prisma.feedback.create({
    data: {
      type,
      content: content.trim(),
      contact: contact?.trim() || null,
      userId: req.user?.id || null,
    },
  });
  res.json({ success: true, data: { message: '感谢您的反馈！' } });
}));

router.post('/report', optionalAuthenticate, validateRequest(reportSchema), catchAsync(async (req: AuthRequest, res: Response) => {
  const { type, targetType, targetUrl, reason, description, contact } = req.body;
  await prisma.report.create({
    data: {
      type,
      targetType: targetType || null,
      targetUrl: targetUrl?.trim() || null,
      reason: reason?.trim() || null,
      description: description.trim(),
      contact: contact?.trim() || null,
      userId: req.user?.id || null,
    },
  });
  res.json({ success: true, data: { message: '举报已提交，我们会尽快核实处理。' } });
}));

export default router;
