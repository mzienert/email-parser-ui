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
  const [allLogGroups, setAllLogGroups] = useState<LogGroup[]>([]);
  const [showAllGroups, setShowAllGroups] = useState(false);
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
        
        // Map all log groups
        const allGroups = response.logGroups?.map((group) => ({
          logGroupName: group.logGroupName || "",
          displayName: group.logGroupName?.replace("/aws/lambda/", "") || "",
          isActive: false,
        })) || [];

        setAllLogGroups(allGroups);

        // Filter for email parsing related log groups (more flexible matching)
        const emailParsingKeywords = [
          "email-parser", "email-parsing", "email-processor", "supplier-matcher",
          "emailparser", "emailprocessor", "supplierMatcher", "SupplierMatcher",
          "BucketNotifications", "bucket-notifications",
          // Common AWS CDK patterns
          "EmailParser", "EmailProcessing", "SupplierMatching"
        ];
        
        const filteredGroups = allGroups.filter(group => {
          const displayName = group.displayName.toLowerCase();
          return emailParsingKeywords.some(keyword => 
            displayName.includes(keyword.toLowerCase())
          );
        });

        setLogGroups(filteredGroups);
        
        // Auto-select best match
        const priorityOrder = ["email-parser", "emailparser", "email-processor", "emailprocessor"];
        let selectedGroup = null;
        
        for (const priority of priorityOrder) {
          selectedGroup = filteredGroups.find(g => 
            g.displayName.toLowerCase().includes(priority)
          );
          if (selectedGroup) break;
        }
        
        if (!selectedGroup && filteredGroups.length > 0) {
          selectedGroup = filteredGroups[0];
        }
        
        if (selectedGroup) {
          setSelectedLogGroup(selectedGroup.logGroupName);
        }

        // If no filtered groups found, show debug info
        if (filteredGroups.length === 0) {
          console.log("No matching log groups found. Available groups:", allGroups.map(g => g.displayName));
          setError(`No email parsing log groups found. Found ${allGroups.length} total log groups. Toggle "Show All Groups" to see them.`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        setError(`Failed to fetch log groups: ${errorMessage}. Check AWS credentials and region.`);
        console.error("CloudWatch fetch error:", error);
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
          <Badge variant="outline" className="ml-auto text-xs">
            {process.env.NEXT_PUBLIC_AWS_REGION || "us-west-2"}
          </Badge>
        </CardTitle>
        <CardDescription>
          Real-time logs from Lambda functions during email processing
          {logGroups.length > 0 && (
            <span className="ml-2">({logGroups.length} groups found)</span>
          )}
          {allLogGroups.length > 0 && logGroups.length === 0 && (
            <span className="ml-2 text-yellow-600">({allLogGroups.length} total groups available)</span>
          )}
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
            {(showAllGroups ? allLogGroups : logGroups).map((group) => (
              <option key={group.logGroupName} value={group.logGroupName}>
                {group.displayName}
              </option>
            ))}
          </select>
          
          {allLogGroups.length > 0 && (
            <Button
              onClick={() => setShowAllGroups(!showAllGroups)}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              {showAllGroups ? `Show Filtered (${logGroups.length})` : `Show All (${allLogGroups.length})`}
            </Button>
          )}
          
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

        {/* Debug Info */}
        {(error || allLogGroups.length > 0) && (
          <details className="text-xs bg-muted p-3 rounded-lg">
            <summary className="cursor-pointer font-medium">Debug Info</summary>
            <div className="mt-2 space-y-2">
              <div><strong>Environment:</strong> {process.env.NODE_ENV || "development"}</div>
              <div><strong>AWS Region:</strong> {process.env.NEXT_PUBLIC_AWS_REGION || "us-west-2"}</div>
              <div><strong>AWS Access Key:</strong> {process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID ? "✓ Set" : "✗ Missing"}</div>
              <div><strong>AWS Secret Key:</strong> {process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY ? "✓ Set" : "✗ Missing"}</div>
              <div><strong>Total Log Groups Found:</strong> {allLogGroups.length}</div>
              <div><strong>Filtered Log Groups:</strong> {logGroups.length}</div>
              {allLogGroups.length > 0 && logGroups.length === 0 && (
                <div className="mt-2">
                  <strong>Available Log Groups:</strong>
                  <div className="mt-1 max-h-32 overflow-y-auto bg-slate-100 dark:bg-slate-800 p-2 rounded">
                    {allLogGroups.slice(0, 20).map(group => (
                      <div key={group.logGroupName} className="text-xs font-mono">
                        {group.displayName}
                      </div>
                    ))}
                    {allLogGroups.length > 20 && (
                      <div className="text-xs text-muted-foreground">... and {allLogGroups.length - 20} more</div>
                    )}
                  </div>
                </div>
              )}
              {error && (
                <div className="mt-2">
                  <strong>Error:</strong>
                  <div className="text-red-600 bg-red-50 p-2 rounded mt-1">{error}</div>
                </div>
              )}
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  );
} 