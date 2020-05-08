import { Router } from 'express';
import { Logger } from '../../../Logger';
import { asyncRoute } from '../../asyncRoute';
import { getTracks } from './requestHandlers';

export function registerJamendoRoutes(router: Router): void {
  Logger.info('Initializes jamendo routes');

  const handler = asyncRoute(getTracks);

  router.get('/api/jamendo/tracks/:order', handler);
  router.get('/api/jamendo/tracks/:tag/:order', handler);
}