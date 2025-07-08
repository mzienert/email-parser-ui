# Email Parser Frontend

A React TypeScript frontend for the AI-Powered Government Email Parsing and Supplier Matching System.

## System Overview

This frontend interfaces with a serverless AWS backend that intelligently parses government contracting emails (RFQs, RFPs, solicitations) and provides smart supplier recommendations. The system uses advanced AI (Amazon Bedrock Claude) to extract structured data from unstructured email content.

## Backend Architecture

### **What We've Built**

**Event-Driven Processing Pipeline:**
```
S3 Email Upload → Lambda Processing → AI Extraction → Supplier Matching → REST API → React Frontend
```

**Key Components:**
- **Email Processing**: Automated parsing of .eml files with Factory Pattern (SEWP, NASA, Generic parsers)
- **AI Extraction**: Amazon Bedrock Claude 3.7 Sonnet for intelligent content extraction
- **Supplier Matching**: Multi-strategy algorithms (Compliance, Geographic, Fuzzy Matching)
- **REST API**: Production-ready endpoints for frontend integration
- **Data Storage**: DynamoDB for emails, suppliers, and match history

**Technology Stack:**
- **Backend**: AWS Lambda (Node.js), Amazon Bedrock, DynamoDB, S3, EventBridge, SQS
- **Infrastructure**: AWS CDK (TypeScript)
- **API**: AWS API Gateway with CORS enabled
- **Frontend**: React TypeScript (this repository)

## API Endpoints

### **Base URL**
```
https://ms3d3yxove.execute-api.us-west-2.amazonaws.com/dev
```

### **Authentication**
Currently no authentication required (development environment). Production will require API keys or AWS Cognito.

### **Available Endpoints**

#### **1. POST /suppliers/suggest**
Get intelligent supplier suggestions based on requirements.

**Request:**
```json
{
  "items": [
    {
      "name": "Nutanix software",
      "category": "software",
      "quantity": 10,
      "specifications": "Hyper-converged infrastructure"
    }
  ],
  "requirements": {
    "taaCompliant": true,
    "businessCertifications": ["HUBZone", "SDVOSB"],
    "securityClearance": ["C", "CSAT"],
    "contractVehicle": "SEWP V"
  },
  "preferences": {
    "state": "WV",
    "supportLevel": "24/7 Federal",
    "maxSuppliers": 10
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Supplier suggestions generated successfully",
  "data": {
    "suggestions": [
      {
        "supplierId": "SUPP-001-NUTANIX-RESELLER",
        "companyName": "Federal Tech Solutions LLC",
        "score": 0.639,
        "confidence": "high",
        "capabilities": ["NUTANIX_RESELLER", "HYPER_CONVERGED_INFRASTRUCTURE"],
        "complianceStatus": {
          "taaCompliant": true,
          "epeatLevels": ["Bronze", "Silver", "Gold"],
          "securityClearance": ["C", "CSAT"]
        },
        "businessCertifications": ["HUBZone", "SDVOSB"],
        "contactInfo": {
          "primaryContact": {
            "name": "John Smith",
            "title": "Government Sales Director",
            "email": "john.smith@federaltech.com",
            "phone": "555-123-4567"
          }
        },
        "matchReasons": [
          "Authorized Nutanix reseller",
          "HUBZone certified",
          "Located in West Virginia",
          "24/7 Federal support"
        ]
      }
    ],
    "totalEvaluated": 3,
    "metadata": {
      "generatedAt": "2025-01-15T10:30:00Z",
      "threshold": 0.1,
      "duration": "245ms"
    }
  }
}
```

#### **2. GET /emails/{id}/matches**
Retrieve supplier match results for a processed email.

**Request:**
```bash
GET /emails/sewp-nutanix-rfq/matches
```

**Response:**
```json
{
  "success": true,
  "message": "Email matches retrieved successfully",
  "data": {
    "email": {
      "emailId": "sewp-nutanix-rfq"
    },
    "matches": [
      {
        "supplierId": "SUPP-001-NUTANIX-RESELLER",
        "companyName": "Federal Tech Solutions LLC",
        "compositeScore": 0.639,
        "strategyScores": {
          "compliance": 0.85,
          "geographic": 0.60,
          "fuzzy": 0.45
        }
      }
    ],
    "matchCount": 1,
    "matchSummary": {
      "averageScore": 0.639,
      "topScore": 0.639,
      "strategySummary": {
        "compliance": "Strong TAA compliance match",
        "geographic": "West Virginia preference satisfied",
        "fuzzy": "Moderate capability match"
      },
      "processingTime": "2025-01-15T10:25:00Z"
    }
  }
}
```

#### **3. POST /suppliers/feedback**
Submit feedback on supplier match quality.

**Request:**
```json
{
  "emailId": "sewp-nutanix-rfq",
  "supplierId": "SUPP-001-NUTANIX-RESELLER",
  "feedback": {
    "rating": 5,
    "helpful": true,
    "contacted": true,
    "selectedForBid": true,
    "comments": "Excellent match, fast response time"
  },
  "userInfo": {
    "userId": "user-123",
    "department": "IT Procurement"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Feedback submitted successfully",
  "data": {
    "feedbackId": "feedback-789",
    "submittedAt": "2025-01-15T10:30:00Z"
  }
}
```

## Data Structures

### **Supplier Record**
```typescript
interface Supplier {
  supplierId: string;
  companyName: string;
  duns: string;
  cageCode: string;
  
  contact: {
    primaryContact: Contact;
    technicalContact: Contact;
    contractsContact: Contact;
  };
  
  businessCertifications: Array<
    'HUBZone' | 'SDVOSB' | 'WOSB' | '8(a)' | 'SDB' | 'VET'
  >;
  
  complianceStatus: 'TAA_COMPLIANT' | 'EPEAT_CERTIFIED' | 'FULL_COMPLIANT';
  
  complianceDetails: {
    taaCompliant: boolean;
    epeatLevels: Array<'Bronze' | 'Silver' | 'Gold'>;
    securityClearance: Array<'C' | 'CSAT' | 'CNET' | 'CSOFT'>;
    federalContractHistory: boolean;
    governmentCertifications: Array<'FedRAMP' | 'FISMA' | 'NIST'>;
  };
  
  capabilities: string[];
  
  authorizedReseller: {
    nutanix: boolean;
    cisco: boolean;
    dell: boolean;
    hp: boolean;
    microsoft: boolean;
    vmware: boolean;
  };
  
  geographicCapabilities: {
    state: string;
    regions: string[];
    deliveryLocations: string[];
    supportCoverage: '24/7' | 'Business Hours' | 'Regional';
  };
  
  technicalCapabilities: {
    supportLevel: '24/7 Federal' | 'Business Hours' | 'Best Effort';
    installationCapability: boolean;
    maintenanceCapability: boolean;
    trainingCapability: boolean;
    customizationCapability: boolean;
  };
}

interface Contact {
  name: string;
  title: string;
  email: string;
  phone: string;
}
```

### **Email Processing Result**
```typescript
interface EmailProcessingResult {
  emailId: string;
  subject: string;
  from: string;
  to: string;
  parsedAt: string;
  
  parserType: 'SEWP' | 'NASA' | 'GENERIC';
  confidence: number;
  
  extractedData: {
    contractVehicle: string;
    rfqNumber?: string;
    dueDate?: string;
    requirements: string[];
    businessTypes: string[];
    complianceRequirements: string[];
    attachments: Array<{
      filename: string;
      type: string;
    }>;
  };
  
  validation: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    recommendedAction: 'proceed' | 'review' | 'manual_review';
  };
}
```

## Frontend Implementation Guide

### **Required Features**

#### **1. Email Composer Interface**
- **Email input**: Subject, from, to, body content
- **Real-time parsing**: Display extracted requirements as user types
- **Validation**: Show parsing confidence and validation warnings
- **Preview**: Show extracted structured data

#### **2. Supplier Suggestion Interface**
- **Requirements form**: Business certifications, compliance needs, geographic preferences
- **Real-time suggestions**: Call `/suppliers/suggest` API as requirements change
- **Supplier cards**: Display match scores, capabilities, contact info
- **Filtering**: Allow users to filter by score, certification, location
- **Sorting**: Sort by relevance, score, alphabetical

#### **3. Match Results Interface**
- **Email list**: Show processed emails with match counts
- **Match details**: Display supplier matches for each email
- **Strategy breakdown**: Show why each supplier was matched
- **Contact actions**: Email, call, or mark as contacted
- **Feedback**: Allow users to rate match quality

#### **4. Feedback System**
- **Rating interface**: Star rating for match quality
- **Selection tracking**: Mark suppliers as contacted or selected
- **Comments**: Free-text feedback on match quality
- **Analytics**: Show feedback trends and improvement metrics

### **Technical Implementation**

#### **API Client Setup**
```typescript
// api/client.ts
const API_BASE_URL = 'https://ms3d3yxove.execute-api.us-west-2.amazonaws.com/dev';

export class EmailParserAPI {
  private baseURL: string;
  
  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }
  
  async suggestSuppliers(request: SupplierSuggestionRequest): Promise<SupplierSuggestionResponse> {
    const response = await fetch(`${this.baseURL}/suppliers/suggest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  }
  
  async getEmailMatches(emailId: string): Promise<EmailMatchResponse> {
    const response = await fetch(`${this.baseURL}/emails/${emailId}/matches`);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  }
  
  async submitFeedback(feedback: FeedbackRequest): Promise<FeedbackResponse> {
    const response = await fetch(`${this.baseURL}/suppliers/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(feedback),
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  }
}
```

#### **React Hook for Supplier Suggestions**
```typescript
// hooks/useSupplierSuggestions.ts
import { useState, useEffect } from 'react';
import { EmailParserAPI } from '../api/client';

export const useSupplierSuggestions = (requirements: RequirementsInput) => {
  const [suggestions, setSuggestions] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const api = new EmailParserAPI();
  
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!requirements.items.length) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await api.suggestSuppliers(requirements);
        setSuggestions(response.data.suggestions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch suggestions');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSuggestions();
  }, [requirements]);
  
  return { suggestions, loading, error };
};
```

#### **Sample Components**
```typescript
// components/SupplierCard.tsx
interface SupplierCardProps {
  supplier: Supplier;
  onContact: (supplier: Supplier) => void;
  onFeedback: (supplier: Supplier, feedback: FeedbackData) => void;
}

export const SupplierCard: React.FC<SupplierCardProps> = ({ 
  supplier, 
  onContact, 
  onFeedback 
}) => {
  return (
    <div className="supplier-card">
      <h3>{supplier.companyName}</h3>
      <p>Match Score: {(supplier.score * 100).toFixed(1)}%</p>
      
      <div className="certifications">
        {supplier.businessCertifications.map(cert => (
          <span key={cert} className="certification-badge">
            {cert}
          </span>
        ))}
      </div>
      
      <div className="capabilities">
        {supplier.capabilities.map(cap => (
          <span key={cap} className="capability-tag">
            {cap}
          </span>
        ))}
      </div>
      
      <div className="contact-info">
        <p>{supplier.contactInfo.primaryContact.name}</p>
        <p>{supplier.contactInfo.primaryContact.email}</p>
        <p>{supplier.contactInfo.primaryContact.phone}</p>
      </div>
      
      <div className="match-reasons">
        {supplier.matchReasons.map((reason, index) => (
          <p key={index} className="match-reason">• {reason}</p>
        ))}
      </div>
      
      <button onClick={() => onContact(supplier)}>
        Contact Supplier
      </button>
    </div>
  );
};
```

### **Error Handling**
```typescript
// utils/errorHandler.ts
export const handleAPIError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unexpected error occurred';
};

// Example usage in component
const [error, setError] = useState<string | null>(null);

try {
  const response = await api.suggestSuppliers(request);
  setSuggestions(response.data.suggestions);
} catch (err) {
  setError(handleAPIError(err));
}
```

## Development Setup

### **Prerequisites**
- Node.js 18+
- TypeScript
- React 18+
- A package manager (npm, yarn, pnpm)

### **Recommended Dependencies**
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "react-query": "^3.39.3", // For API state management
    "react-hook-form": "^7.43.0", // For form handling
    "zod": "^3.21.0", // For schema validation
    "tailwindcss": "^3.3.0", // For styling
    "lucide-react": "^0.263.0" // For icons
  }
}
```

### **Environment Variables**
```env
REACT_APP_API_BASE_URL=https://ms3d3yxove.execute-api.us-west-2.amazonaws.com/dev
REACT_APP_ENVIRONMENT=development
```

### **Project Structure**
```
src/
├── components/
│   ├── EmailComposer.tsx
│   ├── SupplierCard.tsx
│   ├── SupplierList.tsx
│   ├── MatchResults.tsx
│   └── FeedbackForm.tsx
├── hooks/
│   ├── useSupplierSuggestions.ts
│   ├── useEmailMatches.ts
│   └── useSubmitFeedback.ts
├── api/
│   ├── client.ts
│   └── types.ts
├── utils/
│   ├── errorHandler.ts
│   └── formatters.ts
└── types/
    ├── supplier.ts
    ├── email.ts
    └── api.ts
```

## Testing

### **Test the API**
```bash
# Test supplier suggestions
curl -X POST "https://ms3d3yxove.execute-api.us-west-2.amazonaws.com/dev/suppliers/suggest" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"name": "Nutanix software", "category": "software"}],
    "requirements": {"taaCompliant": true, "businessCertifications": ["HUBZone"]},
    "preferences": {"state": "WV"}
  }'

# Test email matches
curl -X GET "https://ms3d3yxove.execute-api.us-west-2.amazonaws.com/dev/emails/sewp-nutanix-rfq/matches"
```

### **Sample Test Data**
The backend has these test emails available:
- `sewp-nutanix-rfq` - SEWP V RFQ with Nutanix requirements
- `nasa-networking-rfq` - NASA RFQ with networking requirements
- `gsa-generic-rfi` - GSA RFI with general IT requirements

## Backend System Status

### **✅ Operational Components**
- **API Gateway**: All endpoints functional with CORS enabled
- **Lambda Functions**: Email processing, parsing, and supplier matching
- **DynamoDB**: 3 active suppliers in catalog with full compliance data
- **Event Pipeline**: Complete S3 → Lambda → EventBridge → SQS flow
- **AI Processing**: Bedrock Claude integration for intelligent extraction

### **⚠️ Development Notes**
- **Authentication**: Currently disabled for development
- **Rate Limiting**: Not implemented (add for production)
- **Caching**: No response caching (consider adding for performance)
- **Error Handling**: Basic error responses (could be enhanced)

### **📊 Performance Metrics**
- **API Response Time**: 150-415ms average
- **Email Processing**: 5-7 seconds end-to-end
- **Supplier Matching**: 61.0% average accuracy
- **Best Match Example**: Federal Tech Solutions LLC (63.9% match)

## Production Considerations

### **Security**
- Add API authentication (AWS Cognito or API keys)
- Implement rate limiting
- Add input validation and sanitization
- Enable request/response logging

### **Performance**
- Implement response caching
- Add API request debouncing
- Optimize supplier suggestion queries
- Consider pagination for large result sets

### **Monitoring**
- Add error tracking (Sentry, LogRocket)
- Implement usage analytics
- Monitor API performance metrics
- Set up alerting for system failures

### **Deployment**
- Deploy to Vercel or AWS Amplify
- Set up CI/CD pipeline
- Configure environment-specific settings
- Add automated testing

## Support

### **Backend Issues**
- Check AWS CloudWatch logs for API errors
- Verify DynamoDB table health
- Monitor Lambda function performance
- Review EventBridge event processing

### **Frontend Development**
- All API endpoints are CORS-enabled
- No authentication required for development
- Test data is available for all endpoints
- Error responses include detailed messages

---

**Ready to build?** The backend is fully operational and ready for frontend integration. Start with the supplier suggestion interface - it's the most user-visible feature and demonstrates the core AI capabilities. 