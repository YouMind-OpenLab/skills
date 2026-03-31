/**
 * Reddit publisher — submit posts and handle crossposting.
 */

import {
  submitSelfPost, crossPost,
  type RedditConfig, type SubmitResult,
} from './reddit-api.js';

export interface PublishOptions {
  subreddit: string;
  title: string;
  body: string;
  flairId?: string;
  crosspostTo?: string[];
  config?: RedditConfig;
}

export interface PublishResult {
  postId: string;
  postName: string;
  postUrl: string;
  subreddit: string;
  crossposts: Array<{ subreddit: string; url: string }>;
}

export async function publishPost(options: PublishOptions): Promise<PublishResult> {
  const { subreddit, title, body, flairId, crosspostTo, config } = options;

  const result = await submitSelfPost(subreddit, title, body, flairId, config);
  console.error(`[INFO] Post submitted to r/${subreddit}: ${result.url}`);

  const crossposts: Array<{ subreddit: string; url: string }> = [];

  if (crosspostTo?.length) {
    for (const sub of crosspostTo) {
      try {
        const xp = await crossPost(sub, result.name, title, config);
        crossposts.push({ subreddit: sub, url: xp.url });
        console.error(`[INFO] Crossposted to r/${sub}: ${xp.url}`);
      } catch (e) {
        console.error(`[WARN] Crosspost to r/${sub} failed: ${e}`);
      }
    }
  }

  return {
    postId: result.id,
    postName: result.name,
    postUrl: result.url,
    subreddit,
    crossposts,
  };
}
