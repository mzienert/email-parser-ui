"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, AlertCircle, CheckCircle, Mail, Phone, Building2, Shield, Star, MessageSquare, FileText } from "lucide-react";

interface ApiResultsViewerProps {
  emailId?: string;
}

interface Supplier {
  supplierId: string;
  companyName: string;
  score?: number;
  confidence?: string;
  capabilities?: string[];
  complianceStatus?: {
    taaCompliant?: boolean;
    epeatLevels?: string[];
    securityClearance?: string[];
  };
  businessCertifications?: string[];
  contactInfo?: {
    email?: string;
    phone?: string;
    primaryContact?: {
      name?: string;
      title?: string;
      email?: string;
      phone?: string;
    };
  };
  matchReasons?: string[];
}

interface SupplierSuggestionResponse {
  success: boolean;
  message: string;
  data: {
    suggestions: Supplier[];
    totalEvaluated: number;
    metadata: {
      generatedAt: string;
      threshold: number;
      duration: string;
    };
  };
}

interface EmailMatch {
  supplierId: string;
  companyName: string;
  compositeScore: number;
  confidence?: string;
  strategyScores?: {
    compliance?: number;
    fuzzyMatch?: number;
    geographic?: number;
  };
  capabilities?: string[];
  businessCertifications?: string[];
  contactInfo?: {
    email?: string;
    phone?: string;
  };
}

interface EmailMatchResponse {
  success: boolean;
  message: string;
  data: {
    email: {
      emailId: string;
    };
    matches: EmailMatch[];
    matchCount: number;
    matchSummary: {
      averageScore: number;
      topScore: number;
      strategySummary: {
        complianceWeight: number;
        fuzzyMatchWeight: number;
        geographicWeight: number;
      };
      processingTime: string;
    };
  };
}

const API_BASE_URL = 'https://ms3d3yxove.execute-api.us-west-2.amazonaws.com/dev';
const TEST_EMAILS = ['sewp-nutanix-rfq', 'nasa-networking-rfq', 'gsa-generic-rfi'];

export function ApiResultsViewer({ emailId }: ApiResultsViewerProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [emailMatches, setEmailMatches] = useState<{ [key: string]: EmailMatchResponse }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<'suggestions' | 'matches' | 'feedback'>('suggestions');

  const fetchSupplierSuggestions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const requestBody = {
        items: [{ name: "General IT", category: "technology" }],
        requirements: { taaCompliant: true },
        preferences: { maxSuppliers: 10 }
      };

      const response = await fetch(`${API_BASE_URL}/suppliers/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data: SupplierSuggestionResponse = await response.json();
      
      if (data.success && data.data.suggestions) {
        setSuppliers(data.data.suggestions);
      }
    } catch (err) {
      console.error('Error fetching supplier suggestions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmailMatches = async () => {
    try {
      const matchPromises = TEST_EMAILS.map(async (emailId) => {
        const response = await fetch(`${API_BASE_URL}/emails/${emailId}/matches`);
        if (response.ok) {
          const data = await response.json();
          return { emailId, data };
        }
        return { emailId, data: null };
      });

      const results = await Promise.all(matchPromises);
      const matchData: { [key: string]: EmailMatchResponse } = {};
      
      results.forEach(({ emailId, data }) => {
        if (data) {
          matchData[emailId] = data;
        }
      });

      setEmailMatches(matchData);
    } catch (err) {
      console.error('Error fetching email matches:', err);
    }
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await Promise.all([fetchSupplierSuggestions(), fetchEmailMatches()]);
      setDataLoaded(true);
      setLastFetch(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const submitFeedback = async (emailId: string, supplierId: string, feedback: string, rating: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/suppliers/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailId,
          supplierId,
          feedback,
          rating,
          comments: `Test feedback for ${supplierId}`
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Feedback submitted successfully! ID: ${data.data.feedbackId}`);
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      alert('Failed to submit feedback');
    }
  };

     useEffect(() => {
     fetchAllData();
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);

  const formatScore = (score: number) => {
    return (score * 100).toFixed(1);
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.7) return "text-green-600 bg-green-100";
    if (score >= 0.5) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            API Results Dashboard
            {emailId && <Badge variant="secondary">Context: {emailId}</Badge>}
          </CardTitle>
          <CardDescription>
            Live data from your email parser API endpoints
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Button
              onClick={fetchAllData}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh All Data
            </Button>
            
            {lastFetch && (
              <span className="text-xs text-muted-foreground">
                Last updated: {lastFetch.toLocaleTimeString()}
              </span>
            )}
            
            {dataLoaded && (
              <Badge variant="default" className="ml-auto">
                <CheckCircle className="h-3 w-3 mr-1" />
                Data Loaded
              </Badge>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-4">
            <Button
              variant={activeTab === 'suggestions' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('suggestions')}
            >
              <Building2 className="h-4 w-4 mr-2" />
              Supplier Suggestions
            </Button>
            <Button
              variant={activeTab === 'matches' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('matches')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Email Matches
            </Button>
            <Button
              variant={activeTab === 'feedback' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('feedback')}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Feedback System
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 mb-4">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Fetching data from API...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content based on active tab */}
      {activeTab === 'suggestions' && (
        <Card>
          <CardHeader>
            <CardTitle>Supplier Suggestions (POST /suppliers/suggest)</CardTitle>
            <CardDescription>
              AI-powered supplier recommendations based on requirements
            </CardDescription>
          </CardHeader>
          <CardContent>
            {suppliers.length > 0 ? (
              <div className="space-y-4">
                <div className="text-sm font-medium">
                  Found {suppliers.length} supplier{suppliers.length !== 1 ? 's' : ''}
                </div>
                
                {suppliers.map((supplier) => (
                  <Card key={supplier.supplierId} className="border-l-4 border-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{supplier.companyName}</CardTitle>
                          <CardDescription className="text-xs">
                            ID: {supplier.supplierId}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          {supplier.score && (
                            <Badge className={`${getScoreColor(supplier.score)} text-sm`}>
                              {formatScore(supplier.score)}%
                            </Badge>
                          )}
                          {supplier.confidence && (
                            <Badge variant="outline" className="text-sm">
                              {supplier.confidence}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Contact Information */}
                      {(supplier.contactInfo?.email || supplier.contactInfo?.phone || supplier.contactInfo?.primaryContact) && (
                        <div>
                          <div className="font-medium text-sm mb-2">Contact Information</div>
                          <div className="flex flex-wrap gap-4 text-sm">
                            {supplier.contactInfo.email && (
                              <a href={`mailto:${supplier.contactInfo.email}`} className="flex items-center gap-1 text-blue-600 hover:text-blue-800">
                                <Mail className="h-3 w-3" />
                                {supplier.contactInfo.email}
                              </a>
                            )}
                            {supplier.contactInfo.phone && (
                              <a href={`tel:${supplier.contactInfo.phone}`} className="flex items-center gap-1 text-blue-600 hover:text-blue-800">
                                <Phone className="h-3 w-3" />
                                {supplier.contactInfo.phone}
                              </a>
                            )}
                            {supplier.contactInfo.primaryContact?.name && (
                              <Badge variant="outline" className="text-xs">
                                {supplier.contactInfo.primaryContact.name}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Certifications */}
                      {(supplier.businessCertifications || supplier.complianceStatus) && (
                        <div>
                          <div className="font-medium text-sm mb-2">Certifications</div>
                          <div className="flex flex-wrap gap-2">
                            {supplier.businessCertifications?.map((cert) => (
                              <Badge key={cert} variant="secondary" className="text-xs">
                                {cert}
                              </Badge>
                            ))}
                            {supplier.complianceStatus?.taaCompliant && (
                              <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                                <Shield className="h-3 w-3 mr-1" />
                                TAA Compliant
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Match Reasons */}
                      {supplier.matchReasons && supplier.matchReasons.length > 0 && (
                        <div>
                          <div className="font-medium text-sm mb-2">Match Reasons</div>
                          <ul className="text-xs space-y-1">
                            {supplier.matchReasons.map((reason, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-green-600">•</span>
                                <span>{reason}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No supplier suggestions available
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'matches' && (
        <Card>
          <CardHeader>
            <CardTitle>Email Matches (GET /emails/{`{id}`}/matches)</CardTitle>
            <CardDescription>
              Historical email processing results from test emails
            </CardDescription>
          </CardHeader>
          <CardContent>
                         {Object.keys(emailMatches).length > 0 ? (
               <div className="space-y-6">
                 {Object.entries(emailMatches).map(([emailId, response]) => (
                   <Card key={emailId} className="border-l-4 border-purple-500">
                     <CardHeader>
                       <CardTitle className="text-lg">Email: {emailId}</CardTitle>
                       <CardDescription>
                         {response.data?.matchCount || 0} matches found
                         {response.data?.matchSummary?.averageScore && (
                           <span> | Average score: {formatScore(response.data.matchSummary.averageScore)}%</span>
                         )}
                       </CardDescription>
                     </CardHeader>
                     <CardContent>
                       <div className="space-y-4">
                                                  {response.data?.matches?.length > 0 ? (
                           response.data.matches.map((match) => (
                             <div key={match.supplierId} className="border rounded-lg p-4">
                               <div className="flex items-start justify-between mb-2">
                                 <div>
                                   <h4 className="font-medium">{match.companyName}</h4>
                                   <p className="text-xs text-muted-foreground">ID: {match.supplierId}</p>
                                 </div>
                                 <Badge className={`${getScoreColor(match.compositeScore || 0)} text-sm`}>
                                   {formatScore(match.compositeScore || 0)}%
                                 </Badge>
                               </div>
                               
                               {match.strategyScores && (
                                 <div className="grid grid-cols-3 gap-4 mt-2 text-xs">
                                   <div className="text-center">
                                     <div className="font-medium">Compliance</div>
                                     <div className={`text-sm ${getScoreColor(match.strategyScores.compliance || 0)}`}>
                                       {match.strategyScores.compliance ? formatScore(match.strategyScores.compliance) : 'N/A'}%
                                     </div>
                                   </div>
                                   <div className="text-center">
                                     <div className="font-medium">Fuzzy Match</div>
                                     <div className={`text-sm ${getScoreColor(match.strategyScores.fuzzyMatch || 0)}`}>
                                       {match.strategyScores.fuzzyMatch ? formatScore(match.strategyScores.fuzzyMatch) : 'N/A'}%
                                     </div>
                                   </div>
                                   <div className="text-center">
                                     <div className="font-medium">Geographic</div>
                                     <div className={`text-sm ${getScoreColor(match.strategyScores.geographic || 0)}`}>
                                       {match.strategyScores.geographic ? formatScore(match.strategyScores.geographic) : 'N/A'}%
                                     </div>
                                   </div>
                                 </div>
                               )}

                               <div className="mt-3 flex justify-end">
                                 <Button
                                   size="sm"
                                   variant="outline"
                                   onClick={() => submitFeedback(emailId, match.supplierId, 'good_match', 4)}
                                 >
                                   <Star className="h-3 w-3 mr-1" />
                                   Test Feedback
                                 </Button>
                               </div>
                             </div>
                           ))
                         ) : (
                           <div className="text-center text-muted-foreground py-4">
                             No matches found for this email
                           </div>
                         )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No email matches available
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'feedback' && (
        <Card>
          <CardHeader>
            <CardTitle>Feedback System (POST /suppliers/feedback)</CardTitle>
            <CardDescription>
              Submit feedback on supplier match quality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Use the &quot;Test Feedback&quot; buttons in the Email Matches tab to submit feedback to the API.
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center p-4 border rounded-lg">
                  <div className="font-medium">Feedback Types</div>
                  <div className="mt-2 space-y-1">
                    <Badge variant="outline">good_match</Badge>
                    <Badge variant="outline">poor_match</Badge>
                    <Badge variant="outline">acceptable</Badge>
                  </div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="font-medium">Rating Scale</div>
                  <div className="mt-2 space-y-1">
                    <div>1 = Poor</div>
                    <div>3 = Average</div>
                    <div>5 = Excellent</div>
                  </div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="font-medium">API Response</div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Returns feedback ID and confirmation
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 