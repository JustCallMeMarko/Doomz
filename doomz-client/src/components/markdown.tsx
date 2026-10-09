import ReactMarkdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"

function omitNode<P extends { node?: unknown }>(props: P): Omit<P, "node"> {
  const { node, ...rest } = props
  void node
  return rest
}

const components: Components = {
  p: (props) => <p className="my-2 first:mt-0 last:mb-0" {...omitNode(props)} />,
  h1: (props) => <h3 className="mt-3 mb-2 text-base font-semibold first:mt-0" {...omitNode(props)} />,
  h2: (props) => <h3 className="mt-3 mb-2 text-base font-semibold first:mt-0" {...omitNode(props)} />,
  h3: (props) => <h4 className="mt-3 mb-1.5 font-semibold first:mt-0" {...omitNode(props)} />,
  h4: (props) => <h4 className="mt-3 mb-1.5 font-semibold first:mt-0" {...omitNode(props)} />,
  ul: (props) => <ul className="my-2 list-disc space-y-1 pl-5" {...omitNode(props)} />,
  ol: (props) => <ol className="my-2 list-decimal space-y-1 pl-5" {...omitNode(props)} />,
  li: (props) => <li className="pl-0.5" {...omitNode(props)} />,
  strong: (props) => <strong className="font-semibold text-foreground" {...omitNode(props)} />,
  a: (props) => (
    <a className="text-primary underline underline-offset-2" target="_blank" rel="noreferrer" {...omitNode(props)} />
  ),
  blockquote: (props) => (
    <blockquote className="my-2 border-l-2 border-border pl-3 text-muted-foreground" {...omitNode(props)} />
  ),
  hr: () => <hr className="my-3 border-border" />,
  pre: (props) => (
    <pre className="my-2 overflow-x-auto rounded-lg bg-background p-3 font-mono text-xs [&_code]:bg-transparent [&_code]:p-0" {...omitNode(props)} />
  ),
  code: (props) => <code className="rounded bg-background px-1 py-0.5 font-mono text-xs" {...omitNode(props)} />,
  table: (props) => (
    <div className="my-2 overflow-x-auto">
      <table className="w-full border-collapse text-xs" {...omitNode(props)} />
    </div>
  ),
  th: (props) => <th className="border border-border px-2 py-1 text-left font-semibold" {...omitNode(props)} />,
  td: (props) => <td className="border border-border px-2 py-1" {...omitNode(props)} />,
}

export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {children}
    </ReactMarkdown>
  )
}
