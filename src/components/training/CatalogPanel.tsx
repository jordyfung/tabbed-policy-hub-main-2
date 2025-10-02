import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
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
  BookOpen, 
  Clock, 
  Play, 
  ExternalLink,
  UserPlus,
  MoreHorizontal
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface Course {
  id: string;
  title: string;
  description?: string;
  duration_hours?: number;
  is_mandatory: boolean;
  course_type: string;
  scorm_entry_point?: string;
}

interface CatalogPanelProps {
  onStart: (courseId: string) => void;
  onEnroll: (courseId: string) => void;
  onAssign: (courseId: string) => void;
  onViewDetails: (courseId: string) => void;
  onViewSyllabus: (courseId: string) => void;
  isAdmin?: boolean;
  viewingAsManager?: boolean;
}

export default function CatalogPanel({ 
  onStart, 
  onEnroll, 
  onAssign, 
  onViewDetails, 
  onViewSyllabus,
  isAdmin = false,
  viewingAsManager = false
}: CatalogPanelProps) {
  const { t } = useTranslation();
  const { isAdmin: userIsAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    if (isOpen) {
      fetchCourses();
    }
  }, [isOpen]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, description, duration_hours, is_mandatory, course_type, scorm_entry_point')
        .order('title')
        .limit(12);

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesType = filterType === 'all' || course.course_type === filterType;
    return matchesSearch && matchesType;
  });

  const getPrimaryAction = (course: Course) => {
    if (viewingAsManager && (userIsAdmin || isAdmin)) {
      return {
        text: t('trainingRedesign.catalog.actions.assign'),
        onClick: () => {
          // Telemetry: Track catalog assign action
          console.log('Catalog: Assign course clicked', { courseId: course.id, courseTitle: course.title });
          onAssign(course.id);
        },
        icon: <UserPlus className="h-4 w-4 mr-2" />
      };
    }
    
    if (course.course_type === 'scorm' && course.scorm_entry_point) {
      return {
        text: t('trainingRedesign.catalog.actions.launch'),
        onClick: () => {
          // Telemetry: Track catalog launch action
          console.log('Catalog: Launch course clicked', { courseId: course.id, courseTitle: course.title });
          onStart(course.id);
        },
        icon: <Play className="h-4 w-4 mr-2" />
      };
    }
    
    return {
      text: t('trainingRedesign.catalog.actions.enroll'),
      onClick: () => {
        // Telemetry: Track catalog enroll action
        console.log('Catalog: Enroll course clicked', { courseId: course.id, courseTitle: course.title });
        onEnroll(course.id);
      },
      icon: <BookOpen className="h-4 w-4 mr-2" />
    };
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="p-6">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-0 h-auto">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold text-foreground">
                  {t('trainingRedesign.catalog.title')}
                </h3>
                <p className="text-sm text-foreground/60">
                  {t('trainingRedesign.catalog.subtitle')}
                </p>
              </div>
            </div>
            <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-6">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground/40" />
              <Input
                placeholder={t('trainingRedesign.catalog.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  // Telemetry: Track catalog search
                  if (e.target.value.length > 2) {
                    console.log('Catalog: Search performed', { searchTerm: e.target.value });
                  }
                }}
                className="pl-10"
              />
            </div>
            <div className="flex space-x-2">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('all')}
              >
                {t('trainingRedesign.catalog.filters.all')}
              </Button>
              <Button
                variant={filterType === 'scorm' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('scorm')}
              >
                SCORM
              </Button>
              <Button
                variant={filterType === 'manual' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('manual')}
              >
                {t('trainingRedesign.catalog.filters.manual')}
              </Button>
            </div>
          </div>

          {/* Course Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[0,1,2,3,4,5].map((i) => (
                <Card key={i} className="p-4">
                  <div className="space-y-3">
                    <div className="h-4 bg-foreground/10 rounded animate-pulse" />
                    <div className="h-3 bg-foreground/5 rounded animate-pulse" />
                    <div className="h-3 bg-foreground/5 rounded animate-pulse w-2/3" />
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-8 text-foreground/60">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-foreground/30" />
              <p>{t('trainingRedesign.catalog.emptyState')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCourses.slice(0, 6).map((course) => {
                const primaryAction = getPrimaryAction(course);
                
                return (
                  <Card key={course.id} className="p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <BookOpen className="h-4 w-4 text-primary" />
                        <Badge variant="outline" className="text-xs">
                          {course.course_type === 'scorm' ? 'SCORM' : t('trainingRedesign.catalog.filters.manual')}
                        </Badge>
                      </div>
                      {course.is_mandatory && (
                        <Badge variant="outline" className="bg-critical/10 text-critical text-xs">
                          {t('trainingProfile.badges.mandatory')}
                        </Badge>
                      )}
                    </div>

                    <h4 className="font-medium text-foreground mb-2 line-clamp-2">
                      {course.title}
                    </h4>
                    
                    {course.description && (
                      <p className="text-sm text-foreground/60 mb-3 line-clamp-2">
                        {course.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-sm text-foreground/60 mb-4">
                      {course.duration_hours && (
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{course.duration_hours}h</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={primaryAction.onClick}
                        size="sm"
                        className="flex-1"
                      >
                        {primaryAction.icon}
                        {primaryAction.text}
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onViewDetails(course.id)}>
                            <BookOpen className="h-4 w-4 mr-2" />
                            {t('trainingRedesign.actions.viewDetails')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onViewSyllabus(course.id)}>
                            <BookOpen className="h-4 w-4 mr-2" />
                            {t('trainingRedesign.actions.viewSyllabus')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {filteredCourses.length > 6 && (
            <div className="text-center mt-6">
              <Button variant="outline" size="sm">
                {t('trainingRedesign.catalog.loadMore')}
              </Button>
            </div>
          )}
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
