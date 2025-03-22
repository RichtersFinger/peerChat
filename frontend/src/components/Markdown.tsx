import { createContext, useContext } from "react";
import { Button } from "flowbite-react";
import ReactMarkdown, { Options } from "react-markdown";
import { FiClipboard } from "react-icons/fi";

const CodeBlockContext = createContext(false);

export default function Markdown(props: Readonly<Options>) {
  return (
    <div className="markdown">
      <ReactMarkdown
        {...{
          ...props,
          components: {
            p: ({ children, node, ...props }) => (
              <p {...props} style={{ marginTop: 2, marginBottom: 2 }}>
                {children}
              </p>
            ),
            a: ({ children, node, ...props }) => (
              <a {...props} target="_blank" style={{ color: "#1a56db" }}>
                {children}
              </a>
            ),
            ul: ({ children, node, ...props }) => (
              <ul {...props} style={{ marginTop: 0, marginBottom: 2 }}>
                {children}
              </ul>
            ),
            ol: ({ children, node, ...props }) => (
              <ol {...props} style={{ marginTop: 0, marginBottom: 2 }}>
                {children}
              </ol>
            ),
            h1: ({ children, node, ...props }) => (
              <h1 {...props} style={{ marginTop: 0 }}>
                {children}
              </h1>
            ),
            h2: ({ children, node, ...props }) => (
              <h2 {...props} style={{ marginTop: 0 }}>
                {children}
              </h2>
            ),
            h3: ({ children, node, ...props }) => (
              <h3 {...props} style={{ marginTop: 0 }}>
                {children}
              </h3>
            ),
            h4: ({ children, node, ...props }) => (
              <h4 {...props} style={{ marginTop: 0 }}>
                {children}
              </h4>
            ),
            h5: ({ children, node, ...props }) => (
              <h5 {...props} style={{ marginTop: 0 }}>
                {children}
              </h5>
            ),
            h6: ({ children, node, ...props }) => (
              <h6 {...props} style={{ marginTop: 0 }}>
                {children}
              </h6>
            ),
            pre: ({ children, node, ...props }) => {
              return (
                <CodeBlockContext.Provider value={true}>
                  <pre
                    {...props}
                    style={{
                      background: "#fcfcfc",
                      padding: 4,
                      paddingLeft: 10,
                    }}
                  >
                    {children}
                  </pre>
                </CodeBlockContext.Provider>
              );
            },
            code: function Code({ children, ...rest }) {
              const codeBlock = useContext(CodeBlockContext);
              if (codeBlock)
                return (
                  <div className="relative">
                    <code {...rest}>{children}</code>
                    <Button
                      color="gray"
                      size="xs"
                      className="absolute right-2 -top-1 w-8 h-8 transition duration-200 opacity-10 hover:opacity-100"
                      onClick={() =>
                        navigator.clipboard
                          .writeText(children?.toString().trim() ?? "")
                          .then(
                            function () {
                              console.log("Copied.");
                            },
                            function (err) {
                              console.error("Copy to clipboard failed: ", err);
                            }
                          )
                      }
                    >
                      <FiClipboard size="15" />
                    </Button>
                  </div>
                );
              else
                return (
                  <code
                    style={{
                      background: "#fcfcfc",
                      padding: 4,
                    }}
                    {...rest}
                  >
                    {children}
                  </code>
                );
            },
            ...props.components,
          },
        }}
      />
    </div>
  );
}
