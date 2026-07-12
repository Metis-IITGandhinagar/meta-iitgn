import * as userApi from './user';
import * as pageApi from './page';
import * as draftApi from './draft';
import * as categoryApi from './category';

export const apiService = {
  ...userApi,
  ...pageApi,
  ...draftApi,
  ...categoryApi,
};

export * from './user';
export * from './page';
export * from './draft';
export * from './category';
