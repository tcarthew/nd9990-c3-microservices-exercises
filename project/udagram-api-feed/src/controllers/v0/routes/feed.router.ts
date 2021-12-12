import { Router, Request, Response } from 'express';
import { NextFunction } from 'connect';
import * as jwt from 'jsonwebtoken';
import { FeedItem } from '../../../models'
import * as AWS from '../../../aws';
import { config } from '../../../config/config';

const router: Router = Router();

export function requireAuth(req: Request, res: Response, next: NextFunction): Response {
    if (!req.headers || !req.headers.authorization) {
        return res.status(401).send({ message: 'No authorization headers.' });
    }

    const tokenBearer = req.headers.authorization.split(' ');

    if (tokenBearer.length != 2) {
        return res.status(401).send({ message: 'Malformed token.' });
    }

    const token = tokenBearer[1];

    try {
        jwt.verify(token, config.jwt.secret);
        next();
    } catch (err) {
        return res.status(500).send({ auth: false, message: 'Failed to authenticate.' });
    }
}

// Get all feed items
router.get('/', async (req: Request, res: Response) => {
    console.log('request feed items');

    const items = await FeedItem.findAndCountAll({ order: [['id', 'DESC']] });

    items.rows.map((item) => {
        if (item.url) {
            item.url = AWS.getGetSignedUrl(item.url);
        }
    });
    res.send(items);
});

// Get a feed resource
router.get('/:id',
    async (req: Request, res: Response) => {
        const { id } = req.params;
        const item = await FeedItem.findByPk(id);
        
        console.log('request feed ', id);

        res.send(item);
    });

// Get a signed url to put a new item in the bucket
router.get('/signed-url/:fileName', requireAuth, async (req: Request, res: Response) => {
    const { fileName } = req.params;
    const url = AWS.getPutSignedUrl(fileName);

    console.log(`request signed url for ${fileName} ${url}`);

    res.status(201).send({ url: url });
});

// Create feed with metadata
router.post('/', requireAuth, async (req: Request, res: Response) => {
    const caption = req.body.caption;
    const fileName = req.body.url; // same as S3 key name

    console.log(`create feed item ${caption} with ${fileName}`);

    if (!caption) {
        return res.status(400).send({ message: 'Caption is required or malformed.' });
    }

    if (!fileName) {
        return res.status(400).send({ message: 'File url is required.' });
    }

    const item = await new FeedItem({
        caption: caption,
        url: fileName,
    });

    const savedItem = await item.save();

    savedItem.url = AWS.getGetSignedUrl(savedItem.url);
    res.status(201).send(savedItem);
});

export const FeedRouter: Router = router;
