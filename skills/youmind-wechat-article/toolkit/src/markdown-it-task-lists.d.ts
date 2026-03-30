declare module 'markdown-it-task-lists' {
  import type MarkdownIt from 'markdown-it';

  interface TaskListOptions {
    enabled?: boolean;
    label?: boolean;
    labelAfter?: boolean;
  }

  const taskLists: MarkdownIt.PluginWithOptions<TaskListOptions>;
  export default taskLists;
}
