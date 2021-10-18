import cors from 'cors';
import express, { json } from 'express';

import { config } from './config/config';
import { sequelize } from './sequelize';
import { IndexRouter } from './controllers/v0/index.router';
import { V0_FEED_MODELS, V0_USER_MODELS } from './controllers/v0/model.index';

(async () => {
    sequelize.addModels(V0_FEED_MODELS);
    sequelize.addModels(V0_USER_MODELS);

    console.debug("Initialize database connection...");

    await sequelize.sync();

    const app = express();
    const port = process.env.PORT || 8080;

    app.use(json());

    // We set the CORS origin to * so that we don't need to
    // worry about the complexities of CORS this lesson. It's
    // something that will be covered in the next course.
    app.use(cors({
        allowedHeaders: [
            'Origin', 'X-Requested-With',
            'Content-Type', 'Accept',
            'X-Access-Token', 'Authorization',
        ],
        methods: 'GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE',
        preflightContinue: true,
        origin: '*',
    }));

    app.use('/api/v0/', IndexRouter);

    // Root URI call
    app.get('/', async (req, res) => {
        res.send('/api/v0/');
    });


    // Start the Server
    app.listen(port, () => {
        console.log(`server running on port ${port}`);
        console.log(`press CTRL+C to stop server`);
    });
})();
