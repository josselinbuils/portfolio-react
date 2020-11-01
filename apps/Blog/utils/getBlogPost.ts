import { BlogPost } from '../interfaces/BlogPost';
import { getPostSlug } from './getPostSlug';
import { getPostTitle } from './getPostTitle';

export function getBlogPost(slug: string): BlogPost {
  const context = require.context('../posts', false, /\.md$/);
  const postKey = context.keys().find((key) => getPostSlug(key) === slug);

  if (postKey === undefined) {
    throw new Error(`Unable to find post with slug ${slug}.`);
  }
  const content = context(postKey).default as string;
  const title = getPostTitle(content);

  return { content, title, slug };
}
