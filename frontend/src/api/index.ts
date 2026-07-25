import * as userApi from "./user";
import * as pageApi from "./page";
import * as draftApi from "./draft";
import * as categoryApi from "./category";
import * as newsApi from "./news";
import * as bookmarksApi from "./bookmarks";
import * as blogApi from "./blog";
import * as collegeinfoApi from "./collegeinfo";
import * as featuredApi from "./featured";
import * as paperApi from "./paper";
import * as competitionApi from "./competition";
import * as interviewApi from "./interviews";

export const apiService = {
  ...userApi,
  ...pageApi,
  ...draftApi,
  ...categoryApi,
  ...newsApi,
  ...bookmarksApi,
  ...blogApi,
  ...collegeinfoApi,
  ...featuredApi,
  ...paperApi,
  ...competitionApi,
  ...interviewApi,
};

export * from "./user";
export * from "./page";
export * from "./draft";
export * from "./category";
export * from "./news";
export * from "./bookmarks";
export * from "./blog";
export * from "./collegeinfo";
export * from "./featured";
export * from "./paper";
export * from "./competition";
export * from "./interviews";

