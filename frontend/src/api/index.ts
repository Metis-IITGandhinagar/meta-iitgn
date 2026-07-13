import * as userApi from './user';
import * as pageApi from './page';
import * as draftApi from './draft';
import * as categoryApi from './category';
import * as newsApi from './news';
import * as bookmarksApi from './bookmarks';

export const apiService = {
  ...userApi,
  ...pageApi,
  ...draftApi,
  ...categoryApi,
  ...newsApi,
  ...bookmarksApi,
};

export * from './user';
export * from './page';
export * from './draft';
export * from './category';
export * from './news';
export * from './bookmarks';
