import { Router, Request, Response } from 'express';

import { User } from '../../../models/user.model';
import { AuthRouter } from './auth.router';

const router: Router = Router();

router.use('/auth', AuthRouter);

router.get('/', async (req: Request, res: Response) => {
    res.send('users');
});

router.get('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const item = await User.findByPk(id);
    
    if (!item) {
        return res.status(404).send({ message: `Invalid user id ${id}` });
    }
    
    res.send(item);
});

export const UserRouter: Router = router;
