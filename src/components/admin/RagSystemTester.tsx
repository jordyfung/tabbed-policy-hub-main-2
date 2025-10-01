import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Search, MessageSquare, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { RAGService, RAGResponse } from '@/services/ragService';

const SAMPLE_QUESTIONS = [
  "What are the requirements for incident reporting?",
  "How should we handle data breaches?",
  "What training is mandatory for staff?",
  "How often should policies be reviewed?",
  "What are the GDPR compliance requirements?",
];

export default function RagSystemTester() {
  const [testQuery, setTestQuery] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<RAGResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ragService = new RAGService();

  const handleTestQuery = async (query: string) => {
    if (!query.trim()) return;

    setIsTesting(true);
    setError(null);
    setTestResult(null);

    try {
      const result = await ragService.askQuestion(query);
      setTestResult(result);
    } catch (error) {
      console.error('Test query error:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSampleQuestion = (question: string) => {
    setTestQuery(question);
    handleTestQuery(question);
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">RAG System Tester</h2>
        <p className="text-foreground/60 mt-2">
          Test the AI assistant's ability to answer questions using policy documents
        </p>
      </div>

      {/* Test Query Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Test Query</span>
          </CardTitle>
          <CardDescription>
            Enter a question to test the RAG system's response
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-query">Question</Label>
            <div className="flex space-x-2">
              <Input
                id="test-query"
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                placeholder="Ask a question about policies..."
                onKeyPress={(e) => e.key === 'Enter' && handleTestQuery(testQuery)}
              />
              <Button
                onClick={() => handleTestQuery(testQuery)}
                disabled={isTesting || !testQuery.trim()}
                className="flex items-center space-x-2"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Test</span>
              </Button>
            </div>
          </div>

          {/* Sample Questions */}
          <div className="space-y-2">
            <Label>Sample Questions</Label>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_QUESTIONS.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSampleQuestion(question)}
                  disabled={isTesting}
                  className="text-xs"
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {(testResult || error || isTesting) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {isTesting ? (
                <>
                  <Clock className="h-5 w-5 animate-spin" />
                  <span>Testing...</span>
                </>
              ) : error ? (
                <>
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <span>Test Failed</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Test Results</span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isTesting && (
              <div className="text-center py-8">
                <Clock className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-foreground/60">Processing your question...</p>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {testResult && (
              <div className="space-y-4">
                {/* Response */}
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Label>AI Response</Label>
                    <Badge className={getConfidenceColor(testResult.confidence)}>
                      {testResult.confidence} confidence
                    </Badge>
                    <span className="text-xs text-foreground/50">
                      {testResult.processingTime}ms
                    </span>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm leading-relaxed">{testResult.answer}</p>
                  </div>
                </div>

                {/* Sources */}
                {testResult.sources && testResult.sources.length > 0 && (
                  <div>
                    <Label className="flex items-center space-x-2">
                      <span>Sources ({testResult.sources.length})</span>
                    </Label>
                    <div className="space-y-2 mt-2">
                      {testResult.sources.map((source, index) => (
                        <div key={source.id} className="bg-card border rounded-lg p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{source.title}</h4>
                              <p className="text-xs text-foreground/60 mt-1">
                                Similarity: {(source.similarity * 100).toFixed(1)}%
                              </p>
                              {source.content && (
                                <p className="text-xs text-foreground/80 mt-2 line-clamp-3">
                                  {source.content.substring(0, 200)}...
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Performance Metrics */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-primary">
                      {testResult.sources?.length || 0}
                    </div>
                    <div className="text-xs text-foreground/60">Sources Found</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-primary">
                      {testResult.processingTime}ms
                    </div>
                    <div className="text-xs text-foreground/60">Response Time</div>
                  </div>
                  <div className="text-center">
                    <Badge className={getConfidenceColor(testResult.confidence)}>
                      {testResult.confidence}
                    </Badge>
                    <div className="text-xs text-foreground/60 mt-1">Confidence</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Guidelines</CardTitle>
          <CardDescription>
            How to evaluate RAG system performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <strong>High Confidence:</strong> Response is accurate and directly based on policy content
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Medium Confidence:</strong> Response may be partially correct but should be verified
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Low Confidence:</strong> System couldn't find relevant information
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
