import React, { useState, useMemo } from "react";
import {
  X,
  Search,
  Filter,
  Trash2,
  Download,
  AlertTriangle,
  CheckCircle,
  Info,
  FileClock,
} from "lucide-react";
import { useStore } from "../lib/store";
import { LogLevel, LogCategory, SystemLogEntry } from "../types";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { cn } from "../lib/utils";

const SystemLogViewer: React.FC = () => {
  const { systemLogs, clearSystemLogs, setShowSystemLogs } = useStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState<LogLevel | "ALL">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<LogCategory | "ALL">(
    "ALL",
  );
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const filteredLogs = useMemo(() => {
    return systemLogs.filter((log) => {
      if (levelFilter !== "ALL" && log.level !== levelFilter) return false;
      if (categoryFilter !== "ALL" && log.category !== categoryFilter)
        return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          log.message.toLowerCase().includes(term) ||
          (log.details &&
            JSON.stringify(log.details).toLowerCase().includes(term))
        );
      }
      return true;
    });
  }, [systemLogs, levelFilter, categoryFilter, searchTerm]);

  const toggleRow = (id: string) => {
    const next = new Set(expandedRows);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedRows(next);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `serialman-logs-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getLevelIcon = (level: LogLevel) => {
    switch (level) {
      case "INFO":
        return <Info className="w-4 h-4 text-blue-500" />;
      case "WARN":
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case "ERROR":
        return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case "SUCCESS":
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    }
  };

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case "INFO":
        return "bg-blue-500/10 text-blue-700 border-blue-500/20";
      case "WARN":
        return "bg-amber-500/10 text-amber-700 border-amber-500/20";
      case "ERROR":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "SUCCESS":
        return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20";
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-5xl shadow-2xl border-border animate-in fade-in zoom-in-95 duration-200 h-[85vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border bg-muted/20 shrink-0">
          <div className="flex items-center gap-2">
            <FileClock className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Operation Logs</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSystemLogs(false)}
            className="h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <div className="p-4 border-b border-border flex flex-wrap items-center gap-3 bg-card shrink-0">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as any)}
            className="w-[120px] h-9"
          >
            <option value="ALL">All Levels</option>
            <option value="INFO">Info</option>
            <option value="SUCCESS">Success</option>
            <option value="WARN">Warning</option>
            <option value="ERROR">Error</option>
          </Select>
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="w-[140px] h-9"
          >
            <option value="ALL">All Categories</option>
            <option value="CONNECTION">Connection</option>
            <option value="COMMAND">Command</option>
            <option value="SYSTEM">System</option>
            <option value="SCRIPT">Script</option>
          </Select>
          <div className="w-px h-6 bg-border mx-1"></div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            title="Export JSON"
          >
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSystemLogs}
            className="text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4 mr-2" /> Clear
          </Button>
        </div>

        <CardContent className="flex-1 overflow-auto p-0 bg-muted/5">
          <div className="min-w-[800px]">
            <div className="flex items-center px-4 py-2 border-b border-border bg-muted/30 text-xs font-bold text-muted-foreground sticky top-0 backdrop-blur-sm z-10">
              <div className="w-[160px]">TIMESTAMP</div>
              <div className="w-[100px]">LEVEL</div>
              <div className="w-[120px]">CATEGORY</div>
              <div className="flex-1">MESSAGE</div>
            </div>
            {filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <FileClock className="w-12 h-12 mb-2 opacity-20" />
                <p>No logs found matching your criteria.</p>
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="group border-b border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <div
                    className="flex items-center px-4 py-2 cursor-pointer text-sm"
                    onClick={() => toggleRow(log.id)}
                  >
                    <div className="w-[160px] font-mono text-xs opacity-70 shrink-0">
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                    <div className="w-[100px] shrink-0">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] gap-1 px-1.5 py-0",
                          getLevelColor(log.level),
                        )}
                      >
                        {getLevelIcon(log.level)}
                        {log.level}
                      </Badge>
                    </div>
                    <div className="w-[120px] font-bold text-xs opacity-60 shrink-0">
                      {log.category}
                    </div>
                    <div className="flex-1 font-medium truncate pr-4">
                      {log.message}
                    </div>
                    {log.details && (
                      <Badge
                        variant="secondary"
                        className="text-[9px] h-5 opacity-50 group-hover:opacity-100"
                      >
                        Details
                      </Badge>
                    )}
                  </div>
                  {expandedRows.has(log.id) && log.details && (
                    <div className="px-4 pb-3 pl-[160px] animate-in slide-in-from-top-2">
                      <div className="bg-background border border-border rounded-md p-3 overflow-x-auto">
                        <pre className="text-xs font-mono text-muted-foreground">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>

        <div className="p-2 border-t border-border bg-card text-xs text-muted-foreground text-center">
          Showing {filteredLogs.length} / {systemLogs.length} events
        </div>
      </Card>
    </div>
  );
};

export default SystemLogViewer;
