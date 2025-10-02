import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExternalLink, GraduationCap, BookOpen, Search, Filter, Clock, Shield, Users } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  duration_hours: number;
  is_mandatory: boolean;
  course_type: string;
  scorm_entry_point: string;
  created_at: string;
}

export default function CoursesContent() {
  const { isAdmin } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterMandatory, setFilterMandatory] = useState<string>('all');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExternalTraining = () => {
    window.open('https://learning.agedcarequality.gov.au/user_login', '_blank');
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || course.course_type === filterType;
    
    const matchesMandatory = filterMandatory === 'all' || 
                            (filterMandatory === 'mandatory' && course.is_mandatory) ||
                            (filterMandatory === 'optional' && !course.is_mandatory);

    return matchesSearch && matchesType && matchesMandatory;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading courses...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Training Courses</h1>
        <p className="text-foreground/60 mt-2">Access external ALIS training platform and browse internal course catalog</p>
      </div>

      {/* External ALIS Training */}
      <Card className="p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-full bg-primary/10 text-primary">
            <GraduationCap className="h-12 w-12" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Official Aged Care Quality Training (ALIS)
        </h2>
        
        <p className="text-foreground/70 mb-6 max-w-2xl mx-auto">
          Access comprehensive training modules from the Aged Care Quality and Safety Commission. 
          Learn about quality standards, compliance requirements, and best practices in aged care.
        </p>
        
        <Button 
          onClick={handleExternalTraining}
          size="lg"
          className="inline-flex items-center space-x-2"
        >
          <span>Access ALIS Training Platform</span>
          <ExternalLink className="h-4 w-4" />
        </Button>
        
        <p className="text-sm text-foreground/60 mt-4">
          Opens in a new window • learning.agedcarequality.gov.au
        </p>
      </Card>

      {/* Internal Course Catalog */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Internal Course Catalog</h2>
          {isAdmin && (
            <Button variant="outline" size="sm">
              <BookOpen className="h-4 w-4 mr-2" />
              Manage Courses
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-foreground/60" />
            <Input
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Course Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="scorm">SCORM</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterMandatory} onValueChange={setFilterMandatory}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Requirements" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              <SelectItem value="mandatory">Mandatory</SelectItem>
              <SelectItem value="optional">Optional</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.length > 0 ? (
            filteredCourses.map((course) => (
              <Card key={course.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5 text-info" />
                    <Badge variant="outline" className="text-xs">
                      {course.course_type === 'scorm' ? 'SCORM' : 'Manual'}
                    </Badge>
                  </div>
                  {course.is_mandatory && (
                    <Badge variant="outline" className="bg-critical/10 text-critical">
                      Mandatory
                    </Badge>
                  )}
                </div>

                <h3 className="font-semibold text-foreground mb-2">{course.title}</h3>
                
                {course.description && (
                  <p className="text-sm text-foreground/70 mb-3 line-clamp-3">
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

                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    if (course.course_type === 'scorm' && course.scorm_entry_point) {
                      window.open(course.scorm_entry_point, '_blank');
                    }
                  }}
                  disabled={course.course_type !== 'scorm' || !course.scorm_entry_point}
                >
                  {course.course_type === 'scorm' ? 'Launch Course' : 'View Details'}
                  {course.course_type === 'scorm' && <ExternalLink className="h-4 w-4 ml-2" />}
                </Button>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <BookOpen className="h-12 w-12 text-foreground/20 mx-auto mb-4" />
              <p className="text-foreground/60">No courses found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>

      {/* Training Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 rounded-lg bg-success/10 text-success">
              <Shield className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-foreground">Quality Standards</h3>
          </div>
          <p className="text-foreground/70 text-sm">
            Comprehensive training on the 8 Quality Standards for aged care services
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 rounded-lg bg-info/10 text-info">
              <BookOpen className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-foreground">Learning Modules</h3>
          </div>
          <p className="text-foreground/70 text-sm">
            Interactive modules covering compliance, safety, and care delivery
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-foreground">Staff Development</h3>
          </div>
          <p className="text-foreground/70 text-sm">
            Professional development resources for all aged care staff roles
          </p>
        </Card>
      </div>
    </div>
  );
}