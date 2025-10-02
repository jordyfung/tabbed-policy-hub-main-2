import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  Search, 
  Award, 
  Calendar, 
  Star,
  BookOpen,
  CheckCircle2
} from 'lucide-react';

interface HistoryItem {
  id: string;
  title: string;
  completedAt: string;
  score?: number;
  certificateUrl?: string;
  standards?: string[];
}

interface HistoryPanelProps {
  history: HistoryItem[];
  onViewCertificate: (certificateUrl: string) => void;
}

export default function HistoryPanel({ history, onViewCertificate }: HistoryPanelProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'completed' | 'certificates' | 'scores'>('all');

  const filteredHistory = history.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || 
      (filter === 'completed' && item.completedAt) ||
      (filter === 'certificates' && item.certificateUrl) ||
      (filter === 'scores' && item.score !== undefined);
    
    return matchesSearch && matchesFilter;
  });

  const getScoreBadge = (score?: number) => {
    if (score === undefined) return null;
    
    if (score >= 90) {
      return <Badge className="bg-success/10 text-success">Excellent</Badge>;
    } else if (score >= 80) {
      return <Badge className="bg-info/10 text-info">Good</Badge>;
    } else if (score >= 70) {
      return <Badge className="bg-warning/10 text-warning">Pass</Badge>;
    } else {
      return <Badge variant="destructive">Needs Improvement</Badge>;
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="p-6">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-0 h-auto">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Award className="h-5 w-5" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold text-foreground">
                  {t('trainingRedesign.history.title')}
                </h3>
                <p className="text-sm text-foreground/60">
                  {history.length} completed courses
                </p>
              </div>
            </div>
            <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-6">
          {history.length === 0 ? (
            <div className="text-center py-8 text-foreground/60">
              <Award className="h-12 w-12 mx-auto mb-4 text-foreground/30" />
              <p>{t('trainingRedesign.history.emptyState')}</p>
            </div>
          ) : (
            <>
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground/40" />
                  <Input
                    placeholder={t('trainingRedesign.history.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('all')}
                  >
                    All
                  </Button>
                  <Button
                    variant={filter === 'completed' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('completed')}
                  >
                    {t('trainingRedesign.history.completed')}
                  </Button>
                  <Button
                    variant={filter === 'certificates' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('certificates')}
                  >
                    {t('trainingRedesign.history.certificates')}
                  </Button>
                  <Button
                    variant={filter === 'scores' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('scores')}
                  >
                    {t('trainingRedesign.history.scores')}
                  </Button>
                </div>
              </div>

              {/* History Items */}
              <div className="space-y-3">
                {filteredHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="p-2 rounded-lg bg-success/10 text-success">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium text-foreground">{item.title}</h4>
                          {getScoreBadge(item.score)}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-foreground/60">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Completed: {new Date(item.completedAt).toLocaleDateString()}
                            </span>
                          </div>
                          {item.score !== undefined && (
                            <div className="flex items-center space-x-1">
                              <Star className="h-4 w-4" />
                              <span>Score: {item.score}%</span>
                            </div>
                          )}
                        </div>
                        
                        {item.standards && item.standards.length > 0 && (
                          <div className="mt-2">
                            <div className="flex flex-wrap gap-1">
                              {item.standards.map((standard, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {standard}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {item.certificateUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewCertificate(item.certificateUrl!)}
                      >
                        <Award className="h-4 w-4 mr-2" />
                        View Certificate
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
