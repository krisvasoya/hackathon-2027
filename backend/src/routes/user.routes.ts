import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { UserRole } from '@prisma/client';

const router = Router();
const controller = new UserController();

// Anyone logged in can query user directories/details
router.get('/', authenticate, controller.getUsers);
router.get('/:id', authenticate, controller.getUserById);

// Write actions require Super Admin privileges
router.put('/:id', authenticate, requireRole(UserRole.SUPER_ADMIN), controller.updateUser);
router.patch('/:id/status', authenticate, requireRole(UserRole.SUPER_ADMIN), controller.updateUserStatus);
router.post('/:id/reset-password', authenticate, requireRole(UserRole.SUPER_ADMIN), controller.resetPassword);

export default router;
