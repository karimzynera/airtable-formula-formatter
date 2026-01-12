"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { formatAirtableFormula } from "@/lib/formatter";
import {
  highlightAirtableFormula,
  type HighlightedToken,
} from "@/lib/syntax-highlighter";
import { CopyIcon, CheckIcon, CodeIcon } from "@phosphor-icons/react";

export default function Page() {
  const [input, setInput] = React.useState("");
  const [formatted, setFormatted] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const [formattedFeedback, setFormattedFeedback] = React.useState(false);
  const outputRef = React.useRef<HTMLDivElement>(null);

  // Debounced formatting
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (input.trim()) {
        const formatted = formatAirtableFormula(input);
        setFormatted(formatted);
      } else {
        setFormatted("");
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [input]);

  const handleCopy = async () => {
    if (formatted) {
      try {
        await navigator.clipboard.writeText(formatted);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  };

  const handleFormat = () => {
    if (input.trim()) {
      const formatted = formatAirtableFormula(input);
      setFormatted(formatted);
      setFormattedFeedback(true);
      setTimeout(() => setFormattedFeedback(false), 2000);
    }
  };

  // Split formatted text into lines for line numbers
  const formattedLines = React.useMemo(() => {
    if (!formatted) return [];
    return formatted.split("\n");
  }, [formatted]);

  // Get highlighted tokens for the full formatted text
  const highlightedTokens = React.useMemo(() => {
    if (!formatted) return [];
    return highlightAirtableFormula(formatted);
  }, [formatted]);

  return (
    <div className="min-h-screen bg-[#FAF9F6] p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 text-center">
          <div className="mb-6 flex justify-center">
            <img
              src="/relationl-logo.svg"
              alt="Relationl"
              className="h-12 md:h-16"
            />
          </div>
          <h1 className="mb-2 text-3xl font-bold text-[#1A1A1A] md:text-4xl">
            Airtable Formula Formatter
          </h1>
          <p className="text-sm text-[#1A1A1A]/70 md:text-base">
            Format your Airtable formulas with proper indentation and syntax
            highlighting
          </p>
        </div>

        <Card className="border-[#E8E6E0] bg-white shadow-lg">
          <CardContent className="p-4 md:p-6">
            <div className="grid gap-4 md:grid-cols-2 md:gap-6 items-stretch md:h-[60vh]">
              {/* Input Section */}
              <div className="flex flex-col h-full">
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="formula-input"
                    className="text-sm font-medium text-[#1A1A1A]"
                  >
                    Enter your formula
                  </label>
                  <Button
                    onClick={handleFormat}
                    disabled={!input.trim()}
                    size="sm"
                    className="bg-[#FF6B35] text-white hover:bg-[#FF6B35]/90 disabled:opacity-50"
                  >
                    {formattedFeedback ? (
                      <>
                        <CheckIcon className="mr-1.5" />
                        Formatted!
                      </>
                    ) : (
                      <>
                        <CodeIcon className="mr-1.5" />
                        Format
                      </>
                    )}
                  </Button>
                </div>
                <div
                  className="flex-1 overflow-hidden rounded-md border border-[#E8E6E0] bg-[#FAF9F6] box-border shadow-none"
                  style={{
                    borderWidth: "1px",
                  }}
                >
                  <Textarea
                    id="formula-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder='IF(AND({Status}="Active",{Count}>0),CONCATENATE({Name}," - ",{Code}),"Inactive")'
                    className="h-full w-full resize-none font-mono text-sm p-4 !border-0 !shadow-none !rounded-none bg-transparent"
                    style={{
                      margin: 0,
                    }}
                  />
                </div>
              </div>

              {/* Output Section */}
              <div className="flex flex-col h-full">
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="formula-output"
                    className="text-sm font-medium text-[#1A1A1A]"
                  >
                    Formatted output
                  </label>
                  <Button
                    onClick={handleCopy}
                    disabled={!formatted}
                    size="sm"
                    className="bg-[#FF6B35] text-white hover:bg-[#FF6B35]/90 disabled:opacity-50"
                  >
                    {copied ? (
                      <>
                        <CheckIcon className="mr-1.5" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <CopyIcon className="mr-1.5" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <div
                  ref={outputRef}
                  id="formula-output"
                  className="flex-1 overflow-auto rounded-md border border-[#E8E6E0] bg-[#FAF9F6] font-mono text-sm box-border shadow-none"
                  style={{
                    borderWidth: "1px",
                  }}
                >
                  {formatted ? (
                    <div className="flex h-full">
                      {/* Line numbers */}
                      <div className="select-none border-r border-[#E8E6E0] bg-[#F5F4F0] px-3 py-4 text-right text-[#1A1A1A]/40 font-mono">
                        {formattedLines.map((_, index) => (
                          <div key={index} className="leading-6 text-sm">
                            {index + 1}
                          </div>
                        ))}
                      </div>
                      {/* Code content */}
                      <div className="flex-1 overflow-x-auto p-4">
                        <pre className="m-0 whitespace-pre tab-size-4 leading-6 font-mono">
                          {highlightedTokens.map((token, index) => {
                            const className =
                              token.type === "function"
                                ? "text-[#FF6B35] font-semibold"
                                : token.type === "field"
                                ? "text-[#1A1A1A] font-medium"
                                : token.type === "string"
                                ? "text-[#FF8C5A]"
                                : token.type === "number"
                                ? "text-[#1A1A1A]"
                                : token.type === "operator"
                                ? "text-[#666666]"
                                : "text-[#1A1A1A]";
                            return (
                              <span key={index} className={className}>
                                {token.text}
                              </span>
                            );
                          })}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <p className="p-4 text-[#1A1A1A]/50">
                      Enter a formula to see the formatted output...
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
