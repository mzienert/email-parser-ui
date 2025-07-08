"use client";

import { useState, useEffect, useRef } from "react";
import { CloudWatchLogsClient, FilterLogEventsCommand, DescribeLogGroupsCommand, FilteredLogEvent } from "@aws-sdk/client-cloudwatch-logs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Play, Pause, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

interface LogsViewerProps {
  emailId?: string;
  isVisible: boolean;
}

interface LogGroup {
  logGroupName: string;
  displayName: string;
  isActive: boolean;
}

export function CloudWatchLogsViewer({ emailId, isVisible }: LogsViewerProps) {
  const [logs, setLogs] = useState<FilteredLogEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedLogGroup, setSelectedLogGroup] = useState<string>("");
  const [logGroups, setLogGroups] = useState<LogGroup[]>([]);
  const [client, setClient] = useState<CloudWatchLogsClient | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Initialize AWS client
  useEffect(() => {
    try {
      const awsClient = new CloudWatchLogsClient({
        region: process.env.NEXT_PUBLIC_AWS_REGION || "us-west-2",
        credentials: {
          accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || "",
          secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || "",
        },
      });
      setClient(awsClient);
    } catch {
      setError("Failed to initialize AWS client. Check your credentials.");
    }
  }, []);

  // Fetch available log groups
  useEffect(() => {
    if (!client) return;

    const fetchLogGroups = async () => {
      try {
        const command = new DescribeLogGroupsCommand({
          logGroupNamePrefix: "/aws/lambda/",
        });
        const response = await client.send(command);
        
        // Filter to only the specific email parsing related log groups
        const targetLogGroups = [
          "email-parser",
          "email-parsing-api", 
          "email-processor",
          "supplier-matcher"
        ];
        
        const allGroups = response.logGroups?.map((group) => ({
          logGroupName: group.logGroupName || "",
          displayName: group.logGroupName?.replace("/aws/lambda/", "") || "",
          isActive: false,
        })) || [];

        // Filter to only include our target log groups or BucketNotificationsHandler
        const groups = allGroups.filter(group => 
          targetLogGroups.includes(group.displayName) ||
          group.displayName.includes("BucketNotificationsHandler")
        );

        setLogGroups(groups);
        
        // Auto-select email-parser if available, otherwise email-processor
        const emailParserGroup = groups.find(g => g.displayName === "email-parser");
        const emailProcessorGroup = groups.find(g => g.displayName === "email-processor");
        
        if (emailParserGroup) {
          setSelectedLogGroup(emailParserGroup.logGroupName);
        } else if (emailProcessorGroup) {
          setSelectedLogGroup(emailProcessorGroup.logGroupName);
        } else if (groups.length > 0) {
          setSelectedLogGroup(groups[0].logGroupName);
        }
      } catch {
        setError("Failed to fetch log groups. Check your AWS permissions.");
      }
    };

    fetchLogGroups();
  }, [client]);

  // Fetch logs
  const fetchLogs = async (append = false) => {
    if (!client || !selectedLogGroup) return;

    setIsLoading(true);
    setError(null);

    try {
      const command = new FilterLogEventsCommand({
        logGroupName: selectedLogGroup,
        startTime: Date.now() - (1000 * 60 * 10), // Last 10 minutes
        endTime: Date.now(),
        limit: 100,
      });

      const response = await client.send(command);
      const newLogs = response.events || [];

      if (append) {
        setLogs(prevLogs => {
          const combinedLogs = [...prevLogs, ...newLogs];
          // Remove duplicates and sort by timestamp
          const uniqueLogs = combinedLogs.filter((log, index, self) => 
            index === self.findIndex(l => l.timestamp === log.timestamp && l.message === log.message)
          );
          return uniqueLogs.sort((a: FilteredLogEvent, b: FilteredLogEvent) => (a.timestamp || 0) - (b.timestamp || 0));
        });
      } else {
        setLogs(newLogs.sort((a: FilteredLogEvent, b: FilteredLogEvent) => (a.timestamp || 0) - (b.timestamp || 0)));
      }

      // Auto-scroll to bottom
      setTimeout(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
      }, 100);
    } catch (error) {
      setError(`Failed to fetch logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Start/stop real-time streaming
  const toggleStreaming = () => {
    if (isStreaming) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsStreaming(false);
    } else {
      fetchLogs(); // Initial fetch
      intervalRef.current = setInterval(() => fetchLogs(true), 3000); // Refresh every 3 seconds
      setIsStreaming(true);
    }
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Format log message for display
  const formatLogMessage = (message: string = "") => {
    // Color coding based on log level
    if (message.includes("ERROR") || message.includes("Error")) {
      return { type: "error", message };
    }
    if (message.includes("WARN") || message.includes("Warning")) {
      return { type: "warning", message };
    }
    if (message.includes("INFO") || message.includes("START") || message.includes("END")) {
      return { type: "info", message };
    }
    return { type: "default", message };
  };

  // Filter logs by email ID if provided
  const filteredLogs = emailId 
    ? logs.filter(log => log.message?.includes(emailId))
    : logs;

  if (!isVisible) return null;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Loader2 className="h-5 w-5" />
          CloudWatch Logs Viewer
          {emailId && (
            <Badge variant="secondary" className="ml-2">
              Filtering: {emailId}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Real-time logs from Lambda functions during email processing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={selectedLogGroup}
            onChange={(e) => setSelectedLogGroup(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm"
            disabled={isLoading}
          >
            <option value="">Select Log Group</option>
            {logGroups.map((group) => (
              <option key={group.logGroupName} value={group.logGroupName}>
                {group.displayName}
              </option>
            ))}
          </select>
          
          <Button
            onClick={toggleStreaming}
            variant={isStreaming ? "destructive" : "default"}
            size="sm"
            disabled={!selectedLogGroup || isLoading}
          >
            {isStreaming ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Stop Streaming
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Streaming
              </>
            )}
          </Button>
          
          <Button
            onClick={() => fetchLogs()}
            variant="outline"
            size="sm"
            disabled={!selectedLogGroup || isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            onClick={() => setLogs([])}
            variant="outline"
            size="sm"
          >
            Clear Logs
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Log Display */}
        <div className="h-96 w-full border rounded-lg p-4 bg-slate-50 dark:bg-slate-900 overflow-y-auto">
          <div ref={scrollAreaRef} className="space-y-1">
            {filteredLogs.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading logs...
                  </div>
                ) : (
                  "No logs found. Try refreshing or check your AWS credentials."
                )}
              </div>
            ) : (
              filteredLogs.map((log, index) => {
                const formatted = formatLogMessage(log.message);
                const timestamp = new Date(log.timestamp || 0).toLocaleTimeString();
                
                return (
                  <div
                    key={index}
                    className={`text-xs font-mono p-2 rounded border-l-2 ${
                      formatted.type === 'error' 
                        ? 'bg-red-50 border-red-500 text-red-800' 
                        : formatted.type === 'warning'
                        ? 'bg-yellow-50 border-yellow-500 text-yellow-800'
                        : formatted.type === 'info'
                        ? 'bg-blue-50 border-blue-500 text-blue-800'
                        : 'bg-white border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground">{timestamp}</span>
                      {formatted.type === 'error' && <AlertCircle className="h-3 w-3" />}
                      {formatted.type === 'info' && <CheckCircle className="h-3 w-3" />}
                    </div>
                    <div className="whitespace-pre-wrap">{formatted.message}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Total logs: {filteredLogs.length}</span>
          <span>Selected group: {selectedLogGroup.replace("/aws/lambda/", "") || "None"}</span>
          <span>Status: {isStreaming ? "Streaming" : "Paused"}</span>
        </div>
      </CardContent>
    </Card>
  );
} 