import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Download, Plus, X } from 'lucide-react';
import { qualityStandardsData, QualityAction } from '@/lib/qualityStandardsData';

interface QualityStandardsTableProps {
  onExport?: (data: any) => void;
}

export default function QualityStandardsTable({ onExport }: QualityStandardsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStandard, setSelectedStandard] = useState<string>('all');
  const [editingAction, setEditingAction] = useState<string | null>(null);
  const [actionData, setActionData] = useState<Record<string, Partial<QualityAction>>>({});

  const handleEditAction = (actionId: string) => {
    setEditingAction(actionId);
    if (!actionData[actionId]) {
      setActionData(prev => ({
        ...prev,
        [actionId]: {
          linkedPolicies: [],
          linkedTraining: [],
          evidence: [],
          operationalImpact: ''
        }
      }));
    }
  };

  const handleSaveAction = (actionId: string) => {
    setEditingAction(null);
    // Here you would typically save to backend
    console.log('Saving action data:', actionId, actionData[actionId]);
  };

  const handleAddPolicy = (actionId: string) => {
    const newPolicy = prompt('Enter policy name:');
    if (newPolicy) {
      setActionData(prev => ({
        ...prev,
        [actionId]: {
          ...prev[actionId],
          linkedPolicies: [...(prev[actionId]?.linkedPolicies || []), newPolicy]
        }
      }));
    }
  };

  const handleAddTraining = (actionId: string) => {
    const newTraining = prompt('Enter training name:');
    if (newTraining) {
      setActionData(prev => ({
        ...prev,
        [actionId]: {
          ...prev[actionId],
          linkedTraining: [...(prev[actionId]?.linkedTraining || []), newTraining]
        }
      }));
    }
  };

  const handleAddEvidence = (actionId: string) => {
    const newEvidence = prompt('Enter evidence description:');
    if (newEvidence) {
      setActionData(prev => ({
        ...prev,
        [actionId]: {
          ...prev[actionId],
          evidence: [...(prev[actionId]?.evidence || []), newEvidence]
        }
      }));
    }
  };

  const handleRemoveItem = (actionId: string, type: 'policies' | 'training' | 'evidence', index: number) => {
    setActionData(prev => ({
      ...prev,
      [actionId]: {
        ...prev[actionId],
        [type === 'policies' ? 'linkedPolicies' : type === 'training' ? 'linkedTraining' : 'evidence']: 
          (prev[actionId]?.[type === 'policies' ? 'linkedPolicies' : type === 'training' ? 'linkedTraining' : 'evidence'] || []).filter((_, i) => i !== index)
      }
    }));
  };

  const handleExport = () => {
    const exportData = qualityStandardsData.map(standard => ({
      standard: standard.title,
      outcomes: standard.outcomes.map(outcome => ({
        outcome: outcome.title,
        actions: outcome.actions.map(action => ({
          action: action.description,
          linkedPolicies: actionData[action.id]?.linkedPolicies || [],
          linkedTraining: actionData[action.id]?.linkedTraining || [],
          evidence: actionData[action.id]?.evidence || [],
          operationalImpact: actionData[action.id]?.operationalImpact || ''
        }))
      }))
    }));
    
    if (onExport) {
      onExport(exportData);
    } else {
      console.log('Export data:', exportData);
      // Mock export functionality
      const csvContent = "data:text/csv;charset=utf-8," + 
        "Standard,Outcome,Action,Linked Policies,Linked Training,Evidence,Operational Impact\n" +
        exportData.flatMap(standard => 
          standard.outcomes.flatMap(outcome => 
            outcome.actions.map(action => 
              `${standard.standard},${outcome.outcome},"${action.action}","${action.linkedPolicies.join('; ')}","${action.linkedTraining.join('; ')}","${action.evidence.join('; ')}","${action.operationalImpact}"`
            )
          )
        ).join('\n');
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "quality_standards_audit_evidence.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const filteredStandards = qualityStandardsData.filter(standard => {
    if (selectedStandard !== 'all' && standard.id.toString() !== selectedStandard) return false;
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return standard.title.toLowerCase().includes(searchLower) ||
           standard.outcomes.some(outcome => 
             outcome.title.toLowerCase().includes(searchLower) ||
             outcome.actions.some(action => 
               action.description.toLowerCase().includes(searchLower)
             )
           );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search standards, outcomes, or actions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={selectedStandard} onValueChange={setSelectedStandard}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by standard" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Standards</SelectItem>
            {qualityStandardsData.map(standard => (
              <SelectItem key={standard.id} value={standard.id.toString()}>
                Standard {standard.id}: {standard.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleExport} className="w-full sm:w-auto">
          <Download className="h-4 w-4 mr-2" />
          Export Evidence
        </Button>
      </div>

      {filteredStandards.map(standard => (
        <Card key={standard.id} className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Standard {standard.id}: {standard.title}</CardTitle>
            <CardDescription>{standard.intent}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {standard.outcomes.map(outcome => (
                <div key={outcome.id} className="border-l-4 border-blue-200 pl-4">
                  <h4 className="font-semibold text-sm text-blue-900 mb-2">{outcome.title}</h4>
                  <p className="text-sm text-gray-600 mb-3">{outcome.statement}</p>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-1/4">Action</TableHead>
                        <TableHead className="w-1/6">Linked Policies</TableHead>
                        <TableHead className="w-1/6">Linked Training</TableHead>
                        <TableHead className="w-1/6">Evidence</TableHead>
                        <TableHead className="w-1/6">Operational Impact</TableHead>
                        <TableHead className="w-1/12">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {outcome.actions.map(action => (
                        <TableRow key={action.id}>
                          <TableCell className="text-sm">
                            <div className="font-medium mb-1">{action.id}</div>
                            <div className="text-gray-600">{action.description}</div>
                          </TableCell>
                          
                          <TableCell>
                            {editingAction === action.id ? (
                              <div className="space-y-1">
                                {(actionData[action.id]?.linkedPolicies || []).map((policy, index) => (
                                  <Badge key={index} variant="secondary" className="mr-1 mb-1">
                                    {policy}
                                    <X 
                                      className="h-3 w-3 ml-1 cursor-pointer" 
                                      onClick={() => handleRemoveItem(action.id, 'policies', index)}
                                    />
                                  </Badge>
                                ))}
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => handleAddPolicy(action.id)}
                                  className="h-6 text-xs"
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                {(actionData[action.id]?.linkedPolicies || []).map((policy, index) => (
                                  <Badge key={index} variant="secondary" className="mr-1 mb-1">
                                    {policy}
                                  </Badge>
                                ))}
                                {(!actionData[action.id]?.linkedPolicies || actionData[action.id].linkedPolicies.length === 0) && (
                                  <span className="text-gray-400 text-xs">No policies linked</span>
                                )}
                              </div>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            {editingAction === action.id ? (
                              <div className="space-y-1">
                                {(actionData[action.id]?.linkedTraining || []).map((training, index) => (
                                  <Badge key={index} variant="outline" className="mr-1 mb-1">
                                    {training}
                                    <X 
                                      className="h-3 w-3 ml-1 cursor-pointer" 
                                      onClick={() => handleRemoveItem(action.id, 'training', index)}
                                    />
                                  </Badge>
                                ))}
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => handleAddTraining(action.id)}
                                  className="h-6 text-xs"
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                {(actionData[action.id]?.linkedTraining || []).map((training, index) => (
                                  <Badge key={index} variant="outline" className="mr-1 mb-1">
                                    {training}
                                  </Badge>
                                ))}
                                {(!actionData[action.id]?.linkedTraining || actionData[action.id].linkedTraining.length === 0) && (
                                  <span className="text-gray-400 text-xs">No training linked</span>
                                )}
                              </div>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            {editingAction === action.id ? (
                              <div className="space-y-1">
                                {(actionData[action.id]?.evidence || []).map((evidence, index) => (
                                  <Badge key={index} variant="destructive" className="mr-1 mb-1">
                                    {evidence}
                                    <X 
                                      className="h-3 w-3 ml-1 cursor-pointer" 
                                      onClick={() => handleRemoveItem(action.id, 'evidence', index)}
                                    />
                                  </Badge>
                                ))}
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => handleAddEvidence(action.id)}
                                  className="h-6 text-xs"
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                {(actionData[action.id]?.evidence || []).map((evidence, index) => (
                                  <Badge key={index} variant="destructive" className="mr-1 mb-1">
                                    {evidence}
                                  </Badge>
                                ))}
                                {(!actionData[action.id]?.evidence || actionData[action.id].evidence.length === 0) && (
                                  <span className="text-gray-400 text-xs">No evidence</span>
                                )}
                              </div>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            {editingAction === action.id ? (
                              <Textarea
                                placeholder="Describe operational impact..."
                                value={actionData[action.id]?.operationalImpact || ''}
                                onChange={(e) => setActionData(prev => ({
                                  ...prev,
                                  [action.id]: {
                                    ...prev[action.id],
                                    operationalImpact: e.target.value
                                  }
                                }))}
                                className="h-20 text-xs"
                              />
                            ) : (
                              <div className="text-sm">
                                {actionData[action.id]?.operationalImpact || (
                                  <span className="text-gray-400">No impact described</span>
                                )}
                              </div>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            {editingAction === action.id ? (
                              <div className="space-y-1">
                                <Button 
                                  size="sm" 
                                  onClick={() => handleSaveAction(action.id)}
                                  className="h-6 text-xs"
                                >
                                  Save
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => setEditingAction(null)}
                                  className="h-6 text-xs ml-1"
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleEditAction(action.id)}
                                className="h-6 text-xs"
                              >
                                Edit
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
