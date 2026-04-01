import { Request, Response, NextFunction } from 'express';
import { RoleService } from '../services/RoleService';
import { catchAsync } from '../utils/catchAsync';

export const listRoles = catchAsync(async (req: Request, res: Response) => {
  const { page, pageSize, q } = req.query;
  const result = await RoleService.listRoles({ 
    page: Number(page) || 1, 
    pageSize: Number(pageSize) || 20, 
    q: String(q || '') 
  });
  res.json({ success: true, data: result });
});

export const createRole = catchAsync(async (req: Request, res: Response) => {
  const result = await RoleService.createRole(req.body);
  res.status(201).json({ success: true, data: result });
});

export const getRoleById = catchAsync(async (req: Request, res: Response) => {
  const result = await RoleService.getRoleById(req.params.id);
  res.json({ success: true, data: result });
});

export const updateRole = catchAsync(async (req: Request, res: Response) => {
  const result = await RoleService.updateRole(req.params.id, req.body);
  res.json({ success: true, data: result });
});

export const updateRolePermissions = catchAsync(async (req: Request, res: Response) => {
  const result = await RoleService.updateRolePermissions(req.params.id, req.body.permissionIds);
  res.json({ success: true, data: result });
});

export const listPermissions = catchAsync(async (req: Request, res: Response) => {
  const result = await RoleService.listPermissions(String(req.query.q || ''));
  res.json({ success: true, data: result });
});

export const deleteRole = catchAsync(async (req: Request, res: Response) => {
  const result = await RoleService.deleteRole(req.params.id);
  res.json({ success: true, data: result });
});

export const bulkDeleteRoles = catchAsync(async (req: Request, res: Response) => {
  const result = await RoleService.bulkDeleteRoles(req.body.ids);
  res.json({ success: true, data: result });
});

export const exportRolesCsv = catchAsync(async (req: Request, res: Response) => {
  const csv = await RoleService.exportRoles();
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=roles.csv');
  res.send(csv);
});
