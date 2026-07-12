import * as userApi from './user';
import * as pageApi from './page';
import * as draftApi from './draft';

export const apiService = {
  ...userApi,
  ...pageApi,
  ...draftApi,
};

export * from './user';
export * from './page';
export * from './draft';
