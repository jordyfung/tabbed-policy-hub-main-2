import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Clock, Trophy, Star, Calendar, User, Play, Eye, CheckCircle2, ShieldCheck } from 'lucide-react';

interface StaffMember {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
  role: string;
}

interface Assignment {
  id: string;
  course_id: string;
  due_date: string;
  completion_count: number;
  last_completed_at: string;
  course: {
    title: string;
    is_mandatory: boolean;
  };
}

interface Achievement {
  achievement_name: string;
  points: number;
  earned_at: string;
}

// Strengthened Aged Care Quality Standards (configurable mapping)
const SQS = {
  '1': { code: 'Std 1', title: 'The Individual' },
  '2': { code: 'Std 2', title: 'The Organisation' },
  '3': { code: 'Std 3', title: 'Care and Services' },
  '4': { code: 'Std 4', title: 'The Environment' },
  '5': { code: 'Std 5', title: 'Clinical Care' },
  '6': { code: 'Std 6', title: 'Food and Nutrition' },
  '7': { code: 'Std 7', title: 'The Residential Community' },
} as const;

// Simple demo mapping by course title keywords; replace with backend mapping when ready
function getStandardsForCourseTitle(title: string): Array<keyof typeof SQS> {
  const t = title.toLowerCase();
  const mapped: Set<keyof typeof SQS> = new Set();
  if (t.includes('infection') || t.includes('clinical')) {
    mapped.add('5');
    mapped.add('4');
  }
  if (t.includes('safety')) {
    mapped.add('4');
  }
  if (t.includes('customer') || t.includes('service') || t.includes('dignity') || t.includes('choice')) {
    mapped.add('1');
    mapped.add('3');
  }
  if (t.includes('nutrition') || t.includes('food')) {
    mapped.add('6');
  }
  if (mapped.size === 0) {
    mapped.add('3');
  }
  return Array.from(mapped);
}

export default function StaffProfileContent() {
  const { t, i18n } = useTranslation();
  const { profile, isAdmin } = useAuth();
  const [selectedStaff, setSelectedStaff] = useState<string>(profile?.user_id || '');
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (isAdmin) {
      fetchStaffMembers();
    }
    if (selectedStaff) {
      fetchStaffData();
    }
  }, [selectedStaff, isAdmin]);

  const fetchStaffMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, first_name, last_name, email, created_at, role')
        .order('first_name');

      if (error) throw error;
      setStaffMembers(data || []);
    } catch (error) {
      console.error('Error fetching staff members:', error);
    }
  };

  const fetchStaffData = async () => {
    if (!selectedStaff) return;
    
    setLoading(true);
    try {
      // Fetch assignments
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('course_assignments')
        .select(`
          id,
          course_id,
          due_date,
          completion_count,
          last_completed_at,
          course:courses(title, is_mandatory)
        `)
        .eq('assigned_to', selectedStaff);

      if (assignmentError) throw assignmentError;

      // Fetch achievements
      const { data: achievementData, error: achievementError } = await supabase
        .from('user_achievements')
        .select('achievement_name, points, earned_at')
        .eq('user_id', selectedStaff)
        .order('earned_at', { ascending: false });

      if (achievementError) throw achievementError;

      setAssignments(assignmentData || []);
      setAchievements(achievementData || []);
    } catch (error) {
      console.error('Error fetching staff data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStaff = () => {
    return staffMembers.find(s => s.user_id === selectedStaff);
  };

  const calculateProgress = () => {
    if (assignments.length === 0) return 0;
    const completed = assignments.filter(a => a.completion_count > 0).length;
    return Math.round((completed / assignments.length) * 100);
  };

  const calculateMandatoryProgress = () => {
    const total = assignments.filter(a => a.course.is_mandatory).length;
    if (total === 0) return { percent: 0, completed: 0, total: 0 };
    const completed = assignments.filter(a => a.course.is_mandatory && a.completion_count > 0).length;
    return { percent: Math.round((completed / total) * 100), completed, total };
  };

  const findNextAssignment = () => {
    return assignments
      .filter(a => a.completion_count === 0)
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0];
  };

  const handleContinue = () => {
    const next = findNextAssignment();
    if (next) {
      toast({ title: t('trainingProfile.toasts.start') });
    }
  };

  const handleStart = () => toast({ title: t('trainingProfile.toasts.start') });
  const handleViewDetails = () => toast({ title: t('trainingProfile.toasts.viewDetails') });
  const handleMarkDone = (id: string) => {
    setAssignments(prev => prev.map(a => a.id === id ? { ...a, completion_count: 1, last_completed_at: new Date().toISOString() } : a));
    toast({ title: t('trainingProfile.toasts.markedDone') });
  };

  const getTimeAtCompany = () => {
    const staff = getCurrentStaff();
    if (!staff) return '';
    
    const startDate = new Date(staff.created_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return t('time.day_other', { count: diffDays });
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return months === 1 ? t('time.month_one', { count: months }) : t('time.month_other', { count: months });
    } else {
      const years = Math.floor(diffDays / 365);
      const remainingMonths = Math.floor((diffDays % 365) / 30);
      const yearsStr = years === 1 ? t('time.year_one', { count: years }) : t('time.year_other', { count: years });
      const monthsStr = remainingMonths > 0 ? (remainingMonths === 1 ? t('time.month_one', { count: remainingMonths }) : t('time.month_other', { count: remainingMonths })) : '';
      return `${yearsStr}${monthsStr ? ` ${monthsStr}` : ''}`;
    }
  };

  const getTotalXP = () => {
    return achievements.reduce((total, achievement) => total + achievement.points, 0);
  };

  const getStatusBadge = (assignment: Assignment) => {
    if (assignment.completion_count > 0) {
      return <Badge variant="secondary" className="bg-success/10 text-success">{t('trainingProfile.badges.completed')}</Badge>;
    }
    
    if (assignment.due_date) {
      const dueDate = new Date(assignment.due_date);
      const now = new Date();
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDue < 0) {
        return <Badge variant="destructive">{t('trainingProfile.badges.overdue')}</Badge>;
      } else if (daysUntilDue <= 7) {
        return <Badge variant="secondary" className="bg-warning/10 text-warning">{t('trainingProfile.badges.dueSoon')}</Badge>;
      }
    }
    
    return <Badge variant="outline">{t('trainingProfile.badges.pending')}</Badge>;
  };

  const currentStaff = getCurrentStaff();

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in-0 duration-300">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[0,1,2,3].map((i) => (
            <Card key={i} className="p-6">
              <div className="space-y-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-6 w-20" />
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Current Assignments</h3>
          <div className="space-y-3">
            {[0,1,2].map((i) => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="flex items-start space-x-3">
                  <Skeleton className="h-5 w-5 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-56" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-in fade-in-0 duration-300">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {isAdmin ? t('trainingProfile.titleAdmin') : t('trainingProfile.titleSelf')}
          </h1>
          <p className="text-foreground/60 mt-2">
            {isAdmin ? t('trainingProfile.subtitleAdmin') : t('trainingProfile.subtitleSelf')}
          </p>
        </div>
        
        {isAdmin && (
          <Select value={selectedStaff} onValueChange={setSelectedStaff}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select staff member" />
            </SelectTrigger>
            <SelectContent>
              {staffMembers.map((staff) => (
                <SelectItem key={staff.user_id} value={staff.user_id}>
                  {staff.first_name} {staff.last_name} ({staff.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {currentStaff && (
        <>
          {/* Staff Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-6 transition-all hover:shadow-sm animate-in fade-in-0 zoom-in-95 duration-300">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{currentStaff.first_name} {currentStaff.last_name}</p>
                  <p className="text-sm text-foreground/60 capitalize">{currentStaff.role}</p>
                </div>
              </div>
            </Card>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="p-6 transition-all hover:shadow-sm animate-in fade-in-0 zoom-in-95 duration-300 delay-100 cursor-default">
                    <div className="flex items-center space-x-3 mb-2">
                      <Calendar className="h-5 w-5 text-success" />
                      <span className="text-sm font-medium text-foreground/60">{t('trainingProfile.timeAtCompany')}</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{getTimeAtCompany()}</p>
                  </Card>
                </TooltipTrigger>
                <TooltipContent>{t('trainingProfile.tooltips.timeAtCompany')}</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="p-6 transition-all hover:shadow-sm animate-in fade-in-0 zoom-in-95 duration-300 delay-150 cursor-default">
                    <div className="flex items-center space-x-3 mb-2">
                      <ShieldCheck className="h-5 w-5 text-info" />
                      <span className="text-sm font-medium text-foreground/60">OriComply</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center space-x-3">
                        <div className="relative h-10 w-10">
                          {(() => {
                            const { percent } = calculateMandatoryProgress();
                            const circumference = 2 * Math.PI * 16;
                            const dash = (percent / 100) * circumference;
                            return (
                              <svg viewBox="0 0 40 40" className="h-10 w-10">
                                <circle cx="20" cy="20" r="16" className="stroke-muted" strokeWidth="3" fill="none" />
                                <circle
                                  cx="20"
                                  cy="20"
                                  r="16"
                                  strokeWidth="3"
                                  fill="none"
                                  className="stroke-info transition-all duration-700"
                                  style={{ strokeDasharray: `${dash} ${circumference}`, strokeLinecap: 'round' }}
                                />
                                <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" className="text-[10px] fill-foreground">
                                  {percent}%
                                </text>
                              </svg>
                            );
                          })()}
                        </div>
                        <div>
                          <div className="text-xs font-medium text-foreground/60">{t('trainingProfile.mandatoryCompliance')}</div>
                          {(() => { const { completed, total, percent } = calculateMandatoryProgress(); return (
                            <div className="text-sm font-semibold text-foreground">{completed}/{total} ({percent}%)</div>
                          ); })()}
                        </div>
                      </div>
                      <Button onClick={handleContinue} size="sm" className="bg-primary hover:bg-primary/90">
                        <Play className="w-3 h-3 mr-2" /> {t('trainingProfile.actions.continue')}
                      </Button>
                    </div>
                  </Card>
                </TooltipTrigger>
                <TooltipContent>{t('trainingProfile.tooltips.progress')}</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="p-6 transition-all hover:shadow-sm animate-in fade-in-0 zoom-in-95 duration-300 delay-200 cursor-default">
                    <div className="flex items-center space-x-3 mb-2">
                      <Trophy className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium text-foreground/60">{t('trainingProfile.totalXP')}</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{getTotalXP()}</p>
                  </Card>
                </TooltipTrigger>
                <TooltipContent>{t('trainingProfile.tooltips.totalXp')}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Training Assignments */}
          <Card className="p-6 animate-in fade-in-0 duration-300">
            <h3 className="text-lg font-semibold text-foreground mb-4">{t('trainingProfile.currentAssignments')}</h3>
            <div className="space-y-3">
              {(() => {
                const demoAssignments: Assignment[] = [
                  {
                    id: 'demo-1',
                    course_id: 'demo-course-1',
                    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
                    completion_count: 0,
                    last_completed_at: '',
                    course: { title: 'Work Health & Safety Essentials', is_mandatory: true },
                  },
                  {
                    id: 'demo-2',
                    course_id: 'demo-course-2',
                    due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                    completion_count: 0,
                    last_completed_at: '',
                    course: { title: 'Infection Prevention & Control', is_mandatory: true },
                  },
                  {
                    id: 'demo-3',
                    course_id: 'demo-course-3',
                    due_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
                    completion_count: 1,
                    last_completed_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                    course: { title: 'Customer Service Fundamentals', is_mandatory: false },
                  },
                ];

                const assignmentsToShow = (assignments.length > 0 ? assignments : demoAssignments)
                  .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
                const limitedAssignments = assignmentsToShow.slice(0, 3);
                return limitedAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-4 border rounded-lg transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-sm bg-card"
                  >
                    <div className="flex items-start space-x-3">
                      <BookOpen className="h-5 w-5 text-info mt-0.5" />
                      <div>
                         <p className="font-medium text-foreground">{assignment.course.title}</p>
                        {assignment.due_date && (
                          <p className="text-sm text-foreground/60">
                            {t('trainingProfile.labels.due')}: {new Date(assignment.due_date).toLocaleDateString(i18n.language)}
                          </p>
                        )}
                        {assignment.last_completed_at && (
                          <p className="text-sm text-foreground/60">
                            {t('trainingProfile.labels.lastCompleted')}: {new Date(assignment.last_completed_at).toLocaleDateString(i18n.language)}
                          </p>
                        )}
                        <div className="mt-1 flex flex-wrap gap-2">
                          {getStandardsForCourseTitle(assignment.course.title).map((key) => (
                            <TooltipProvider key={`${assignment.id}-${key}`}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="secondary" className="text-xs cursor-default">{SQS[key].code}</Badge>
                                </TooltipTrigger>
                                <TooltipContent>{SQS[key].title}</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {assignment.course.is_mandatory && (
                        <Badge variant="outline" className="bg-critical/10 text-critical">{t('trainingProfile.badges.mandatory')}</Badge>
                      )}
                      {getStatusBadge(assignment)}
                      {assignment.completion_count === 0 && (
                        <div className="flex items-center space-x-2 ml-2">
                          <Button size="sm" variant="outline" onClick={handleStart} className="h-8">
                            <Play className="w-3 h-3 mr-1" /> {t('trainingProfile.actions.start')}
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleViewDetails} className="h-8">
                            <Eye className="w-3 h-3 mr-1" /> {t('trainingProfile.actions.viewDetails')}
                          </Button>
                          <Button size="sm" onClick={() => handleMarkDone(assignment.id)} className="h-8">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> {t('trainingProfile.actions.markDone')}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </Card>

          {/* Recent Achievements intentionally hidden for minimal one-page demo */}
        </>
      )}
    </div>
  );
}