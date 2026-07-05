"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Folder,
  File,
  ChevronRight,
  ChevronDown,
  Loader2,
  ArrowLeft,
} from "lucide-react";

interface FileEntry {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  children?: FileEntry[];
}

export default function AdminFilesPage() {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [currentPath, setCurrentPath] = useState("");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [fileContent, setFileContent] = useState<{ path: string; content: string } | null>(null);

  const loadTree = async (path: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/files?path=${encodeURIComponent(path)}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    loadTree("");
  }, []);

  const navigateToDir = (path: string) => {
    setCurrentPath(path);
    loadTree(path);
  };

  const readFile = async (path: string) => {
    try {
      const res = await fetch("/api/admin/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "read", path }),
      });
      if (res.ok) {
        const data = await res.json();
        setFileContent({ path, content: data.content });
      }
    } catch {}
  };

  const toggleExpand = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const renderTree = (items: FileEntry[], depth = 0) => {
    return items.map((item) => (
      <div key={item.path}>
        <div
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer text-sm transition-colors"
          style={{ paddingLeft: `${depth * 20 + 8}px` }}
          onClick={() => {
            if (item.type === "directory") {
              toggleExpand(item.path);
              navigateToDir(item.path);
            } else {
              readFile(item.path);
            }
          }}
        >
          {item.type === "directory" ? (
            <>
              {expanded.has(item.path) ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <Folder className="h-4 w-4 text-primary" />
            </>
          ) : (
            <>
              <span className="w-3.5" />
              <File className="h-4 w-4 text-muted-foreground" />
            </>
          )}
          <span className="text-white">{item.name}</span>
          {item.size !== undefined && (
            <span className="text-xs text-muted-foreground ml-auto">
              {item.size > 1024
                ? `${(item.size / 1024).toFixed(1)} KB`
                : `${item.size} B`}
            </span>
          )}
        </div>
        {item.type === "directory" && expanded.has(item.path) && item.children && (
          <div className="border-l border-border ml-3">
            {renderTree(item.children, depth + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">File Manager</h1>
          <p className="mt-1 text-muted-foreground">
            Browse project files and directories
          </p>
        </div>
        {currentPath && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setCurrentPath("");
              loadTree("");
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Root
          </Button>
        )}
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-md border border-border bg-card p-4 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : (
            renderTree(entries)
          )}
        </div>

        <div className="rounded-md border border-border bg-card p-4 max-h-[70vh] overflow-y-auto">
          {fileContent ? (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-white">
                  {fileContent.path}
                </p>
                <button
                  onClick={() => setFileContent(null)}
                  className="text-xs text-muted-foreground hover:text-white"
                >
                  Close
                </button>
              </div>
              <pre className="rounded-lg bg-black/50 p-4 text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap">
                {fileContent.content}
              </pre>
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              Click a file to preview its contents
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
