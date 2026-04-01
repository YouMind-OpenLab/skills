# Hashnode GraphQL API Reference

Endpoint: `https://gql.hashnode.com`

Full API docs: https://apidocs.hashnode.com

## Authentication

All requests require the `Authorization` header with a Personal Access Token:

```
Authorization: YOUR_HASHNODE_TOKEN
```

Get your token from: https://hashnode.com/settings/developer

## GraphQL Endpoint

All operations use a single POST endpoint:

```
POST https://gql.hashnode.com
Content-Type: application/json
Authorization: YOUR_TOKEN
```

Request body:
```json
{
  "query": "...",
  "variables": { ... }
}
```

## Mutations

### Publish Post

Creates and publishes a new post to a publication.

```graphql
mutation PublishPost($input: PublishPostInput!) {
  publishPost(input: $input) {
    post {
      id
      title
      subtitle
      slug
      url
      canonicalUrl
      coverImage {
        url
      }
      brief
      tags {
        id
        name
        slug
      }
      series {
        id
        name
      }
      publishedAt
      readTimeInMinutes
    }
  }
}
```

**Variables:**
```json
{
  "input": {
    "publicationId": "your-publication-id",
    "title": "Article Title",
    "contentMarkdown": "# Content\n\nMarkdown body here...",
    "subtitle": "A compelling subtitle",
    "tags": [
      { "slug": "typescript", "name": "TypeScript", "id": "" }
    ],
    "coverImageOptions": {
      "coverImageURL": "https://example.com/cover.jpg"
    },
    "canonicalUrl": "https://yourblog.com/original-post",
    "seriesId": "series-id-here",
    "metaTags": {
      "title": "SEO Title",
      "description": "SEO description (max 160 chars)",
      "image": "https://example.com/og-image.jpg"
    }
  }
}
```

**Notes:**
- `publicationId` is required
- `tags` can use slug-based matching (set `id` to empty string)
- `coverImageOptions.coverImageURL` must be an absolute URL
- `metaTags` are optional but recommended for SEO
- Posts are published immediately (no draft state in this mutation)

### Update Post

Updates an existing post.

```graphql
mutation UpdatePost($input: UpdatePostInput!) {
  updatePost(input: $input) {
    post {
      id
      title
      subtitle
      slug
      url
      ...
    }
  }
}
```

**Variables:**
```json
{
  "input": {
    "id": "post-id",
    "title": "Updated Title",
    "contentMarkdown": "Updated content...",
    "subtitle": "Updated subtitle"
  }
}
```

**Notes:**
- Only `id` is required; include only fields to update
- Cannot change `publicationId` after creation

## Queries

### Get Post

Fetch a single post by ID.

```graphql
query GetPost($id: ID!) {
  post(id: $id) {
    id
    title
    subtitle
    slug
    url
    canonicalUrl
    coverImage {
      url
    }
    brief
    content {
      markdown
      html
    }
    tags {
      id
      name
      slug
    }
    series {
      id
      name
    }
    publishedAt
    readTimeInMinutes
    reactionCount
    views
  }
}
```

### List Publication Posts

Fetch posts from a publication with pagination.

```graphql
query ListPosts($publicationId: ObjectId!, $first: Int!) {
  publication(id: $publicationId) {
    id
    title
    posts(first: $first) {
      edges {
        node {
          id
          title
          subtitle
          slug
          url
          brief
          coverImage {
            url
          }
          tags {
            id
            name
            slug
          }
          publishedAt
          readTimeInMinutes
          reactionCount
          views
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
}
```

**Variables:**
```json
{
  "publicationId": "your-publication-id",
  "first": 10
}
```

**Notes:**
- Uses cursor-based pagination
- `first` controls how many posts to fetch
- Use `pageInfo.endCursor` with an `after` parameter for next page

### Search Tags

Search for existing Hashnode tags.

```graphql
query SearchTags($keyword: String!, $first: Int!) {
  searchTags(keyword: $keyword, first: $first) {
    edges {
      node {
        id
        name
        slug
        postsCount
      }
    }
  }
}
```

**Variables:**
```json
{
  "keyword": "typescript",
  "first": 10
}
```

## Error Handling

GraphQL errors are returned in the `errors` array:

```json
{
  "data": null,
  "errors": [
    {
      "message": "Publication not found",
      "extensions": {
        "code": "NOT_FOUND"
      }
    }
  ]
}
```

Common error codes:
- `UNAUTHENTICATED` -- Invalid or missing token
- `NOT_FOUND` -- Publication or post not found
- `VALIDATION_ERROR` -- Invalid input (bad tags, missing fields)
- `FORBIDDEN` -- No permission to modify this resource

## Rate Limits

- Hashnode applies rate limiting on the GraphQL API
- Exact limits are not publicly documented
- Best practice: add a 1-second delay between batch operations
- If rate limited, wait and retry with exponential backoff

## Finding Your Publication ID

1. Go to your Hashnode publication dashboard
2. Navigate to Settings > General
3. The publication ID is visible in the URL: `https://hashnode.com/{publication_id}/dashboard`
4. Alternatively, use the GraphQL API:

```graphql
query Me {
  me {
    publications(first: 10) {
      edges {
        node {
          id
          title
          url
        }
      }
    }
  }
}
```
